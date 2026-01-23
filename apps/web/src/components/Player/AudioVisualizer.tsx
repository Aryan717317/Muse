'use client';

import { motion } from 'framer-motion';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

export function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
    // 64 FFT size = 32 bins. We'll use 20 bars.
    // Mode 'simulation' uses synthetic physics. Mode 'microphone' is available if implemented.
    const frequencyData = useAudioAnalyzer(isPlaying, { fftSize: 64, mode: 'simulation' });

    // Map 32 bins to 20 bars (simple subsets)
    // We'll just take the first 20 as they are the bass-heavy/most active ones usually
    const bars = Array.from(frequencyData).slice(0, 20);

    return (
        <div className="flex items-end justify-center gap-1.5 h-32 w-full">
            {bars.map((value, i) => (
                <VisualizerBar key={i} value={value} index={i} />
            ))}
        </div>
    );
}

function VisualizerBar({ value, index }: { value: number; index: number }) {
    // Normalize 0-255 to height pixels (10px min, 120px max)
    const height = Math.max(8, (value / 255) * 128);

    return (
        <motion.div
            className="w-2 rounded-full bg-white/80"
            animate={{
                height,
                opacity: 0.3 + (value / 255) * 0.7
            }}
            transition={{
                duration: 0.1, // Fast reaction
                ease: "linear"
            }}
        />
    );
}
