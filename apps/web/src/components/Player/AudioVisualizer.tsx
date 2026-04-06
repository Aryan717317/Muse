'use client';

import { useRef } from 'react';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

export function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useAudioAnalyzer(isPlaying, { fftSize: 64, mode: 'simulation' }, (data) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Map 32 bins to 20 bars
        const bars = Array.from(data).slice(0, 20);
        
        const barWidth = Math.max(2, (width / bars.length) - 2);
        const gap = 2;
        const totalWidth = (barWidth + gap) * bars.length - gap;
        const startX = (width - totalWidth) / 2;

        bars.forEach((value, i) => {
            const heightMultiplier = value / 255;
            const barHeight = Math.max(8, heightMultiplier * height * 0.9);
            const x = startX + i * (barWidth + gap);
            const y = height - barHeight;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + heightMultiplier * 0.7})`;
            
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
            ctx.fill();
        });
    });

    return (
        <div className="flex h-32 w-full items-end justify-center">
            <canvas 
                ref={canvasRef} 
                width={200} 
                height={128} 
                className="h-full w-full max-w-[200px]" 
            />
        </div>
    );
}
