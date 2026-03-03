/**
 * Replay Guard — Nonce-based replay attack prevention
 * Each signaling message includes a nonce + timestamp + HMAC signature.
 * Prevents replay attacks by ensuring nonces are never reused within a window.
 */

import crypto from 'crypto';
import { redis } from '../../config/redis.js';

const NONCE_TTL = 60;        // 60s dedup window
const TIMESTAMP_WINDOW = 30_000; // 30s — messages older than this are rejected

export interface SignalEnvelope<T = unknown> {
    nonce: string;
    timestamp: number;
    payload: T;
    signature: string;
}

export class ReplayGuard {

    /**
     * Create a signed envelope for a payload
     */
    createEnvelope<T>(payload: T, secret: string): SignalEnvelope<T> {
        const nonce = crypto.randomUUID();
        const timestamp = Date.now();
        const signature = this.sign(nonce, timestamp, payload, secret);

        return { nonce, timestamp, payload, signature };
    }

    /**
     * Validate a signal envelope for replay attacks
     * Returns true if valid, false if replay/expired/tampered
     */
    async validate<T>(envelope: SignalEnvelope<T>, secret: string): Promise<boolean> {
        // 1. Check timestamp is within window
        if (Math.abs(Date.now() - envelope.timestamp) > TIMESTAMP_WINDOW) {
            console.warn(`[ReplayGuard] Expired timestamp: ${envelope.timestamp}`);
            return false;
        }

        // 2. Check nonce hasn't been used (Redis SET NX + TTL)
        const isNew = await redis.set(
            `nonce:${envelope.nonce}`,
            '1',
            'EX',
            NONCE_TTL,
            'NX',
        );
        if (!isNew) {
            console.warn(`[ReplayGuard] Duplicate nonce: ${envelope.nonce}`);
            return false;
        }

        // 3. Verify HMAC signature
        const expectedSignature = this.sign(
            envelope.nonce,
            envelope.timestamp,
            envelope.payload,
            secret,
        );

        if (envelope.signature !== expectedSignature) {
            console.warn(`[ReplayGuard] Invalid signature for nonce: ${envelope.nonce}`);
            return false;
        }

        return true;
    }

    /**
     * HMAC-SHA256 signature of nonce + timestamp + payload
     */
    private sign<T>(
        nonce: string,
        timestamp: number,
        payload: T,
        secret: string,
    ): string {
        const data = `${nonce}:${timestamp}:${JSON.stringify(payload)}`;
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }
}

export const replayGuard = new ReplayGuard();
