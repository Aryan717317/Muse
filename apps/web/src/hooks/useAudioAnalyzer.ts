'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioAnalyzerOptions {
    fftSize?: number;
    smoothingTimeConstant?: number;
    mode?: 'simulation' | 'microphone';
}

export function useAudioAnalyzer(isPlaying: boolean, options: AudioAnalyzerOptions = {}) {
    const { fftSize = 64, smoothingTimeConstant = 0.8, mode = 'simulation' } = options;
    const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(fftSize / 2));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Initialize Audio Context
    useEffect(() => {
        if (!isPlaying) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setFrequencyData(new Uint8Array(fftSize / 2).fill(0));
            return;
        }

        let lastUpdate = 0;
        const animate = () => {
            const now = Date.now();
            // Throttle to ~20fps (50ms) to prevent React state update lag
            if (now - lastUpdate >= 50) {
                if (mode === 'simulation') {
                    // Synthetic Generator (Simulates FFT physics)
                    const data = new Uint8Array(fftSize / 2);
                    const time = (now - startTimeRef.current) / 1000;

                    for (let i = 0; i < data.length; i++) {
                        const x = i / data.length;

                        // Bass (Lower frequencies) - High energy, slower pulses
                        const bass = Math.sin(time * 2 + i * 0.5) * 100 * (1 - x);

                        // Mids/Highs - Faster, lower amplitude
                        const mids = Math.cos(time * 5 + i * 2) * 50 * Math.sin(x * Math.PI);

                        // Noise/Jitter
                        const noise = Math.random() * 30;

                        // Combine and clamp
                        const value = Math.max(0, Math.min(255, 50 + bass + mids + noise));
                        data[i] = value;
                    }
                    setFrequencyData(data);
                } else if (mode === 'microphone' && analyserRef.current) {
                    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(data);
                    setFrequencyData(data);
                }
                lastUpdate = now;
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        if (mode === 'microphone') {
            const initMic = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                    const ctx = new Ctx();
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = fftSize;
                    analyser.smoothingTimeConstant = smoothingTimeConstant;

                    const source = ctx.createMediaStreamSource(stream);
                    source.connect(analyser); // Do not connect to destination (feedback loop)

                    audioContextRef.current = ctx;
                    analyserRef.current = analyser;
                    sourceRef.current = source;

                    animate();
                } catch (err) {
                    console.error('Mic access denied, falling back to simulation', err);
                    // Fallback could go here used simulation logic
                }
            };
            initMic();
        } else {
            animate();
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            sourceRef.current?.disconnect();
            audioContextRef.current?.close();
        };
    }, [isPlaying, fftSize, mode, smoothingTimeConstant]);

    return frequencyData;
}
