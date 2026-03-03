/**
 * Call State Machine — Redis-backed with Lua CAS transitions
 * Implements atomic state transitions, double-accept prevention,
 * simultaneous call detection (Redlock), split-brain version counters,
 * and video upgrade conflict handling.
 */

import { redis } from '../../config/redis.js';
import {
    type CallState,
    type CallData,
    type CallType,
    type MediaMode,
    VALID_TRANSITIONS,
    STATE_TTLS,
    TERMINAL_STATES,
    ACTIVE_MEDIA_STATES,
} from './call.types.js';
import { LOCAL_REGION, POD_ID } from '../../config/region.js';

// ─────────────────────────────────────────────────────────────────
// Lua Scripts for Atomic Operations
// ─────────────────────────────────────────────────────────────────

/**
 * Atomic CAS: Transition state only if current matches expected.
 * Args: expectedState, newState, version, ttl, ...additionalFields
 * Returns: 1 on success, 0 on state mismatch, -1 if call not found
 */
const LUA_TRANSITION_STATE = `
  local key = KEYS[1]
  local exists = redis.call('EXISTS', key)
  if exists == 0 then return -1 end

  local currentState = redis.call('HGET', key, 'state')
  local expectedState = ARGV[1]
  local newState = ARGV[2]
  local newVersion = ARGV[3]
  local ttl = tonumber(ARGV[4])

  if currentState ~= expectedState then return 0 end

  redis.call('HSET', key, 'state', newState, 'version', newVersion)

  -- Apply additional key-value pairs (ARGV[5], ARGV[6], ...)
  local i = 5
  while i <= #ARGV do
    redis.call('HSET', key, ARGV[i], ARGV[i+1])
    i = i + 2
  end

  if ttl > 0 then
    redis.call('EXPIRE', key, ttl)
  end

  return 1
`;

/**
 * Atomic accept: Only transitions from RINGING → ACCEPTED
 * Prevents double-accept across multiple devices
 */
const LUA_ACCEPT_CALL = `
  local key = KEYS[1]
  local state = redis.call('HGET', key, 'state')
  if state == 'RINGING' then
    redis.call('HMSET', key, 'state', 'ACCEPTED', 'acceptedBy', ARGV[1], 'acceptedAt', ARGV[2], 'version', ARGV[3])
    redis.call('EXPIRE', key, 15)
    return 1
  end
  return 0
`;

/**
 * Create call: Only if no active call between the two users exists
 * Prevents simultaneous-call conflicts
 */
const LUA_CREATE_CALL = `
  local callKey = KEYS[1]
  local lockKey = KEYS[2]

  -- Check if lock already exists (simultaneous call detection)
  local locked = redis.call('SET', lockKey, ARGV[1], 'NX', 'EX', 30)
  if not locked then return 0 end

  -- Create the call hash
  redis.call('HMSET', callKey,
    'callId', ARGV[1],
    'callerId', ARGV[2],
    'receiverId', ARGV[3],
    'callType', ARGV[4],
    'mediaMode', ARGV[5],
    'state', 'INITIATING',
    'version', '1',
    'region', ARGV[6],
    'createdAt', ARGV[7]
  )
  redis.call('EXPIRE', callKey, 10)

  return 1
`;

/**
 * Atomic video upgrade request: Only from AUDIO_ONLY_CONNECTED → VIDEO_UPGRADING
 * Prevents concurrent upgrade conflicts (first-writer-wins)
 */
const LUA_REQUEST_UPGRADE = `
  local key = KEYS[1]
  local state = redis.call('HGET', key, 'state')
  if state == 'AUDIO_ONLY_CONNECTED' then
    redis.call('HMSET', key,
      'state', 'VIDEO_UPGRADING',
      'upgradeRequestedBy', ARGV[1],
      'upgradeRequestedAt', ARGV[2],
      'version', ARGV[3]
    )
    redis.call('EXPIRE', key, 15)
    return 1
  end
  if state == 'VIDEO_UPGRADING' then
    return 2
  end
  return 0
`;

/**
 * Atomic upgrade completion: VIDEO_UPGRADING → VIDEO_CONNECTED
 * Updates mediaMode to AUDIO_VIDEO
 */
const LUA_COMPLETE_UPGRADE = `
  local key = KEYS[1]
  local state = redis.call('HGET', key, 'state')
  if state == 'VIDEO_UPGRADING' then
    redis.call('HMSET', key,
      'state', 'VIDEO_CONNECTED',
      'mediaMode', 'AUDIO_VIDEO',
      'version', ARGV[1]
    )
    redis.call('EXPIRE', key, 7200)
    return 1
  end
  return 0
`;

/**
 * Atomic downgrade: VIDEO_CONNECTED → AUDIO_ONLY_CONNECTED
 * Updates mediaMode to AUDIO_ONLY
 */
const LUA_DOWNGRADE_TO_AUDIO = `
  local key = KEYS[1]
  local state = redis.call('HGET', key, 'state')
  if state == 'VIDEO_CONNECTED' or state == 'DEGRADED' or state == 'CONNECTED' then
    redis.call('HMSET', key,
      'state', 'AUDIO_ONLY_CONNECTED',
      'mediaMode', 'AUDIO_ONLY',
      'version', ARGV[1]
    )
    redis.call('EXPIRE', key, 7200)
    return 1
  end
  return 0
`;

// ─────────────────────────────────────────────────────────────────
// CallStateMachine Class
// ─────────────────────────────────────────────────────────────────

export class CallStateMachine {
    /**
     * Create a new call in INITIATING state
     * Uses canonicalized lock key to prevent simultaneous A↔B calls
     * Sets initial mediaMode based on callType
     */
    async createCall(
        callId: string,
        callerId: string,
        receiverId: string,
        callType: CallType,
    ): Promise<boolean> {
        const [u1, u2] = [callerId, receiverId].sort();
        const lockKey = `lock:call:${u1}:${u2}`;
        const callKey = `call:${callId}`;
        const mediaMode: MediaMode = callType === 'VIDEO' ? 'AUDIO_VIDEO' : 'AUDIO_ONLY';

        const result = await redis.eval(
            LUA_CREATE_CALL,
            2,
            callKey, lockKey,
            callId, callerId, receiverId, callType, mediaMode, LOCAL_REGION, Date.now().toString()
        );

        return result === 1;
    }

    /**
     * Get current call data from Redis
     */
    async getCall(callId: string): Promise<CallData | null> {
        const data = await redis.hgetall(`call:${callId}`);
        if (!data || !data['callId']) return null;
        return {
            callId: data['callId']!,
            callerId: data['callerId']!,
            receiverId: data['receiverId']!,
            callType: data['callType'] as CallType,
            mediaMode: (data['mediaMode'] as MediaMode) || (data['callType'] === 'VIDEO' ? 'AUDIO_VIDEO' : 'AUDIO_ONLY'),
            state: data['state'] as CallState,
            version: Number(data['version'] || 0),
            region: data['region']!,
            createdAt: Number(data['createdAt'] || 0),
            acceptedAt: data['acceptedAt'] ? Number(data['acceptedAt']) : undefined,
            acceptedBy: data['acceptedBy'] || undefined,
            connectedAt: data['connectedAt'] ? Number(data['connectedAt']) : undefined,
            endedAt: data['endedAt'] ? Number(data['endedAt']) : undefined,
            endReason: data['endReason'] || undefined,
            lastHeartbeat: data['lastHeartbeat'] ? Number(data['lastHeartbeat']) : undefined,
            upgradeRequestedBy: data['upgradeRequestedBy'] || undefined,
            upgradeRequestedAt: data['upgradeRequestedAt'] ? Number(data['upgradeRequestedAt']) : undefined,
        };
    }

    /**
     * Atomic state transition with validation
     */
    async transition(
        callId: string,
        fromState: CallState,
        toState: CallState,
        additionalFields?: Record<string, string>,
    ): Promise<boolean> {
        // Validate transition
        const validTargets = VALID_TRANSITIONS[fromState];
        if (!validTargets || !validTargets.includes(toState)) {
            console.warn(`[CallSM] Invalid transition: ${fromState} → ${toState} for call ${callId}`);
            return false;
        }

        const call = await this.getCall(callId);
        if (!call) return false;

        const newVersion = (call.version + 1).toString();
        const ttl = STATE_TTLS[toState];

        // Build additional args
        const extraArgs: string[] = [];
        if (additionalFields) {
            for (const [key, value] of Object.entries(additionalFields)) {
                extraArgs.push(key, value);
            }
        }

        const result = await redis.eval(
            LUA_TRANSITION_STATE,
            1,
            `call:${callId}`,
            fromState,
            toState,
            newVersion,
            ttl.toString(),
            ...extraArgs,
        );

        if (result === 1) {
            console.log(`[CallSM] ${callId}: ${fromState} → ${toState} (v${newVersion})`);
            return true;
        }

        if (result === 0) {
            console.warn(`[CallSM] State mismatch for ${callId}: expected ${fromState}`);
        }
        if (result === -1) {
            console.warn(`[CallSM] Call ${callId} not found`);
        }

        return false;
    }

    /**
     * Atomic accept — prevents double-accept
     */
    async acceptCall(callId: string, userId: string): Promise<boolean> {
        const call = await this.getCall(callId);
        if (!call) return false;

        const newVersion = (call.version + 1).toString();
        const result = await redis.eval(
            LUA_ACCEPT_CALL,
            1,
            `call:${callId}`,
            userId,
            Date.now().toString(),
            newVersion,
        );

        if (result === 1) {
            console.log(`[CallSM] ${callId}: RINGING → ACCEPTED by ${userId}`);
            return true;
        }
        console.warn(`[CallSM] Accept failed for ${callId} — not in RINGING state`);
        return false;
    }

    // ─────────────────────────────────────────────────────────────────
    // Video Upgrade / Downgrade Operations
    // ─────────────────────────────────────────────────────────────────

    /**
     * Atomic video upgrade request — AUDIO_ONLY_CONNECTED → VIDEO_UPGRADING
     * Returns: 'SUCCESS' | 'UPGRADE_IN_PROGRESS' | 'INVALID_STATE'
     */
    async requestVideoUpgrade(callId: string, userId: string): Promise<'SUCCESS' | 'UPGRADE_IN_PROGRESS' | 'INVALID_STATE'> {
        const call = await this.getCall(callId);
        if (!call) return 'INVALID_STATE';

        const newVersion = (call.version + 1).toString();
        const result = await redis.eval(
            LUA_REQUEST_UPGRADE,
            1,
            `call:${callId}`,
            userId,
            Date.now().toString(),
            newVersion,
        );

        if (result === 1) {
            console.log(`[CallSM] ${callId}: AUDIO_ONLY → VIDEO_UPGRADING by ${userId}`);
            return 'SUCCESS';
        }
        if (result === 2) {
            console.warn(`[CallSM] Upgrade already in progress for ${callId}`);
            return 'UPGRADE_IN_PROGRESS';
        }
        console.warn(`[CallSM] Cannot upgrade ${callId} — not in AUDIO_ONLY_CONNECTED`);
        return 'INVALID_STATE';
    }

    /**
     * Complete video upgrade — VIDEO_UPGRADING → VIDEO_CONNECTED
     */
    async completeVideoUpgrade(callId: string): Promise<boolean> {
        const call = await this.getCall(callId);
        if (!call) return false;

        const newVersion = (call.version + 1).toString();
        const result = await redis.eval(
            LUA_COMPLETE_UPGRADE,
            1,
            `call:${callId}`,
            newVersion,
        );

        if (result === 1) {
            console.log(`[CallSM] ${callId}: VIDEO_UPGRADING → VIDEO_CONNECTED`);
            return true;
        }
        return false;
    }

    /**
     * Revert upgrade — VIDEO_UPGRADING → AUDIO_ONLY_CONNECTED
     */
    async revertUpgrade(callId: string): Promise<boolean> {
        return this.transition(callId, 'VIDEO_UPGRADING', 'AUDIO_ONLY_CONNECTED');
    }

    /**
     * Downgrade to audio — VIDEO_CONNECTED/DEGRADED → AUDIO_ONLY_CONNECTED
     */
    async downgradeToAudio(callId: string): Promise<boolean> {
        const call = await this.getCall(callId);
        if (!call) return false;

        const newVersion = (call.version + 1).toString();
        const result = await redis.eval(
            LUA_DOWNGRADE_TO_AUDIO,
            1,
            `call:${callId}`,
            newVersion,
        );

        if (result === 1) {
            console.log(`[CallSM] ${callId}: ${call.state} → AUDIO_ONLY_CONNECTED (downgrade)`);
            return true;
        }
        return false;
    }

    /**
     * Update the mediaMode field without state change
     */
    async updateMediaMode(callId: string, mediaMode: MediaMode): Promise<void> {
        await redis.hset(`call:${callId}`, 'mediaMode', mediaMode);
    }

    // ─────────────────────────────────────────────────────────────────
    // Lock & Presence Operations
    // ─────────────────────────────────────────────────────────────────

    /**
     * Release the call lock between two users
     */
    async releaseLock(callerId: string, receiverId: string): Promise<void> {
        const [u1, u2] = [callerId, receiverId].sort();
        await redis.del(`lock:call:${u1}:${u2}`);
    }

    /**
     * Update call heartbeat (keep-alive for active states)
     */
    async heartbeat(callId: string): Promise<void> {
        const state = await redis.hget(`call:${callId}`, 'state');
        const activeTTL = state ? STATE_TTLS[state as CallState] || 7200 : 7200;
        await redis.hset(`call:${callId}`, 'lastHeartbeat', Date.now().toString());
        await redis.expire(`call:${callId}`, activeTTL);
    }

    /**
     * Check if a user is currently in an active (non-terminal) call
     */
    async isUserInCall(userId: string): Promise<string | null> {
        const activeCallId = await redis.get(`user:activecall:${userId}`);
        if (!activeCallId) return null;

        const call = await this.getCall(activeCallId);
        if (!call || TERMINAL_STATES.includes(call.state)) {
            await redis.del(`user:activecall:${userId}`);
            return null;
        }
        return activeCallId;
    }

    /**
     * Track user's active call
     */
    async setUserActiveCall(userId: string, callId: string): Promise<void> {
        await redis.set(`user:activecall:${userId}`, callId, 'EX', 7200);
    }

    /**
     * Clear user's active call
     */
    async clearUserActiveCall(userId: string): Promise<void> {
        await redis.del(`user:activecall:${userId}`);
    }

    /**
     * Check if call is in an active media state
     */
    isActiveMediaState(state: CallState): boolean {
        return ACTIVE_MEDIA_STATES.includes(state);
    }
}

export const callStateMachine = new CallStateMachine();
