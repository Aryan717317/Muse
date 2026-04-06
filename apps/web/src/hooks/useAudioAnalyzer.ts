'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioAnalyzerOptions {
    fftSize?: number;
    smoothingTimeConstant?: number;
    mode?: 'simulation' | 'microphone';
}

export function useAudioAnalyzer(isPlaying: boolean, options: AudioAnalyzerOptions = {}, onUpdate?: (data: Uint8Array) => void) {
    const { fftSize = 64, smoothingTimeConstant = 0.8, mode = 'simulation' } = options;
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Initialize Audio Context
    useEffect(() => {
        if (!isPlaying) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (onUpdate) onUpdate(new Uint8Array(fftSize / 2).fill(0));
            return;
        }

        const animate = () => {
            const now = Date.now();
            
            if (mode === 'simulation') {
                // Synthetic Generator (Simulates FFT physics)
                const data = new Uint8Array(fftSize / 2);
                const time = (now - startTimeRef.current) / 1000;

                for (let i = 0; i < data.length; i++) {
                    const x = i / data.length;
                    const bass = Math.sin(time * 2 + i * 0.5) * 100 * (1 - x);
                    const mids = Math.cos(time * 5 + i * 2) * 50 * Math.sin(x * Math.PI);
                    const noise = Math.random() * 30;
                    data[i] = Math.max(0, Math.min(255, 50 + bass + mids + noise));
                }
                if (onUpdate) onUpdate(data);
            } else if (mode === 'microphone' && analyserRef.current) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                if (onUpdate) onUpdate(data);
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
                    source.connect(analyser);

                    audioContextRef.current = ctx;
                    analyserRef.current = analyser;
                    sourceRef.current = source;

                    animate();
                } catch (err) {
                    console.error('Mic access denied', err);
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
    }, [isPlaying, fftSize, mode, smoothingTimeConstant, onUpdate]);
}
