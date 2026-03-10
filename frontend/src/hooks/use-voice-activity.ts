import { useEffect, useRef, useState } from 'react';

interface UseVoiceActivityOptions {
    onSpeaking: (isSpeaking: boolean) => void;
    threshold?: number;
    interval?: number;
    enabled?: boolean;
}

export function useVoiceActivity({
    onSpeaking,
    threshold = 0.05,
    interval = 100,
    enabled = true
}: UseVoiceActivityOptions) {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const isSpeakingRef = useRef(false);

    useEffect(() => {
        if (!enabled) {
            stopDetection();
            return;
        }

        async function init() {
            try {
                // If we already have a stream/context, don't restart everything
                if (streamRef.current && audioContextRef.current) return;

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                setStream(stream);

                const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();
                audioContextRef.current = audioContext;

                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                let speakingCounter = 0;
                let silenceCounter = 0;

                timerRef.current = setInterval(() => {
                    analyser.getByteFrequencyData(dataArray);

                    // Simple volume average
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength / 255;

                    if (average > threshold) {
                        speakingCounter++;
                        silenceCounter = 0;
                        if (speakingCounter >= 2 && !isSpeakingRef.current) {
                            isSpeakingRef.current = true;
                            setIsSpeaking(true);
                            onSpeaking(true);
                        }
                    } else {
                        silenceCounter++;
                        speakingCounter = 0;
                        if (silenceCounter >= 15 && isSpeakingRef.current) {
                            isSpeakingRef.current = false;
                            setIsSpeaking(false);
                            onSpeaking(false);
                        }
                    }
                }, interval);

            } catch (err) {
                console.error('Error accessing microphone:', err);
                setIsSpeaking(false);
            }
        }

        init();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            // We don't close stream here to avoid flickering when speaking status changes
            // Component unmount or 'enabled' false will take care of it via stopDetection
        };
    }, [enabled, onSpeaking, threshold, interval]);

    useEffect(() => {
        return () => stopDetection();
    }, []);

    function stopDetection() {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
        }
        if (isSpeaking) {
            setIsSpeaking(false);
            onSpeaking(false);
        }
    }

    return { isSpeaking, stream };
}
