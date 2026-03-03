/**
 * Call Quality Telemetry — Enhanced with Bandwidth Tier Analysis
 * Provides adaptive bitrate recommendations for Opus audio and video resolution.
 * Ingests client QoS reports to Kafka for ClickHouse / analytics downstream.
 */

import { producer } from '../../config/kafka.js';
import type {
    CallQualityReport,
    BandwidthTier,
    BandwidthAnalysis,
    OpusMode,
    VideoResolution,
    VideoRecommendation,
} from './call.types.js';
import { LOCAL_REGION } from '../../config/region.js';

const QUALITY_TOPIC = 'call.quality.telemetry';

// ─────────────────────────────────────────────────────────────────
// Opus Mode Presets (per bandwidth tier)
// ─────────────────────────────────────────────────────────────────

const OPUS_MODES: Record<BandwidthTier, OpusMode> = {
    EXCELLENT: { mode: 'VBR', bitrate: 64, packetTime: 20, fec: false, dtx: false },
    GOOD: { mode: 'VBR', bitrate: 48, packetTime: 20, fec: true, dtx: false },
    FAIR: { mode: 'CBR', bitrate: 32, packetTime: 40, fec: true, dtx: false },
    POOR: { mode: 'CBR', bitrate: 16, packetTime: 60, fec: true, dtx: true },
    CRITICAL: { mode: 'CBR', bitrate: 8, packetTime: 60, fec: true, dtx: true },
};

// ─────────────────────────────────────────────────────────────────
// Video Resolution Presets (per bandwidth tier)
// ─────────────────────────────────────────────────────────────────

const VIDEO_PRESETS: Record<Exclude<BandwidthTier, 'CRITICAL'>, VideoRecommendation> = {
    EXCELLENT: { resolution: '1080p', framerate: 30, bitrate: 2500 },
    GOOD: { resolution: '720p', framerate: 30, bitrate: 1500 },
    FAIR: { resolution: '480p', framerate: 30, bitrate: 800 },
    POOR: { resolution: '240p', framerate: 15, bitrate: 250 },
};

export class CallQualityService {

    /**
     * Ingest a quality report from a client and forward to Kafka
     */
    async ingest(report: CallQualityReport): Promise<void> {
        try {
            await producer.send({
                topic: QUALITY_TOPIC,
                messages: [{
                    key: report.callId,
                    value: JSON.stringify({
                        ...report,
                        region: LOCAL_REGION,
                        ingestedAt: Date.now(),
                        // Append computed analysis
                        analysis: this.analyzeBandwidth(report),
                    }),
                }],
            });
        } catch (error) {
            // Non-critical — don't fail the call
            console.error('[CallQuality] Failed to ingest telemetry:', error);
        }
    }

    /**
     * Analyze bandwidth and produce adaptive bitrate recommendations
     */
    analyzeBandwidth(report: CallQualityReport): BandwidthAnalysis {
        const tier = this.classifyBandwidthTier(report);
        const recommendedOpusMode = OPUS_MODES[tier];
        const shouldFallbackToAudio = tier === 'CRITICAL';

        let recommendedVideoResolution: VideoResolution | null = null;
        if (!shouldFallbackToAudio) {
            const presetTier = tier as Exclude<BandwidthTier, 'CRITICAL'>;
            recommendedVideoResolution = VIDEO_PRESETS[presetTier].resolution;
        }

        // Estimate effective bandwidth from report data
        let estimatedBandwidth = 0;
        if (report.video?.bandwidth) {
            estimatedBandwidth = report.video.bandwidth / 1000; // bps → kbps
        } else if (report.network?.downlink) {
            estimatedBandwidth = report.network.downlink * 1000; // Mbps → kbps
        } else if (report.audio?.bitrate) {
            estimatedBandwidth = report.audio.bitrate;
        }

        return {
            tier,
            estimatedBandwidth,
            recommendedOpusMode,
            recommendedVideoResolution,
            shouldFallbackToAudio,
        };
    }

    /**
     * Classify bandwidth tier from quality report
     */
    classifyBandwidthTier(report: CallQualityReport): BandwidthTier {
        // Use video bandwidth as primary signal (most accurate)
        if (report.video?.bandwidth) {
            const bwKbps = report.video.bandwidth / 1000;
            if (bwKbps > 2500) return 'EXCELLENT';
            if (bwKbps > 1500) return 'GOOD';
            if (bwKbps > 800) return 'FAIR';
            if (bwKbps > 200) return 'POOR';
            return 'CRITICAL';
        }

        // Fallback to network effective type
        if (report.network?.effectiveType) {
            switch (report.network.effectiveType) {
                case '4g': return 'GOOD';
                case '3g': return 'FAIR';
                case '2g': return 'CRITICAL';
                case 'slow-2g': return 'CRITICAL';
            }
        }

        // Fallback heuristic from audio metrics
        if (report.audio) {
            if (report.audio.packetLoss > 10 || report.audio.jitter > 100) return 'CRITICAL';
            if (report.audio.packetLoss > 5 || report.audio.jitter > 50) return 'POOR';
            if (report.audio.roundTripTime > 300) return 'POOR';
            if (report.audio.roundTripTime > 150) return 'FAIR';
        }

        return 'GOOD'; // Default assumption
    }

    /**
     * Get video resolution recommendation for current bandwidth
     */
    getVideoRecommendation(report: CallQualityReport): VideoRecommendation | null {
        const tier = this.classifyBandwidthTier(report);
        if (tier === 'CRITICAL') return null; // Fallback to audio-only
        return VIDEO_PRESETS[tier];
    }

    /**
     * Get Opus audio configuration recommendation
     */
    getOpusRecommendation(report: CallQualityReport): OpusMode {
        const tier = this.classifyBandwidthTier(report);
        return OPUS_MODES[tier];
    }

    /**
     * Analyze report for degradation detection
     * Returns true if quality is below acceptable threshold
     */
    isDegraded(report: CallQualityReport): boolean {
        // Audio degradation checks
        if (report.audio) {
            if (report.audio.packetLoss > 5) return true;     // >5% packet loss
            if (report.audio.jitter > 50) return true;         // >50ms jitter
            if (report.audio.roundTripTime > 300) return true;  // >300ms RTT
        }

        // Video degradation checks
        if (report.video) {
            if (report.video.frameRate < 10) return true;       // <10 FPS
            if (report.video.bandwidth < 200000) return true;   // <200kbps
            if (report.video.packetLoss && report.video.packetLoss > 10) return true;
        }

        return false;
    }

    /**
     * Determine if call should fallback to audio-only
     * Based on sustained low bandwidth
     */
    shouldFallbackToAudio(report: CallQualityReport): boolean {
        if (report.video && report.video.bandwidth < 200000) {
            return true; // <200kbps sustained — switch to audio-only
        }

        // Also fallback if packet loss is extreme
        if (report.video?.packetLoss && report.video.packetLoss > 20) {
            return true;
        }

        const tier = this.classifyBandwidthTier(report);
        return tier === 'CRITICAL';
    }

    /**
     * Determine packet loss recovery strategy
     */
    getPacketLossStrategy(report: CallQualityReport): 'NONE' | 'NACK' | 'FEC' | 'AGGRESSIVE' | 'AUDIO_FALLBACK' {
        const videoLoss = report.video?.packetLoss || 0;
        const audioLoss = report.audio?.packetLoss || 0;
        const maxLoss = Math.max(videoLoss, audioLoss);

        if (maxLoss <= 2) return 'NONE';
        if (maxLoss <= 5) return 'NACK';
        if (maxLoss <= 10) return 'FEC';
        if (maxLoss <= 20) return 'AGGRESSIVE';
        return 'AUDIO_FALLBACK';
    }
}

export const callQualityService = new CallQualityService();
