'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioVisualizer } from './AudioVisualizer';
import { User, Radio } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function BigPlayer() {
    const { currentSong, isPlaying, seekTime, participants } = useRoomStore();
    const { seek } = useSocket();

    // Internal progress state (syncs with store, but independent during drag)
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Sync with store when NOT dragging
    useEffect(() => {
        if (!isDragging && currentSong) {
            // If just loaded or seeking finished, sync to store time
            // But we also simulate local progression for smoothness in between updates
            setProgress(seekTime);
        }
    }, [seekTime, isDragging, currentSong]);

    // Simulated ticking
    useEffect(() => {
        if (!isPlaying || !currentSong || isDragging) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= currentSong.duration) return prev;
                return prev + 0.1;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, currentSong, isDragging]);

    // Drag Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !progressBarRef.current || !currentSong) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            setProgress(percentage * currentSong.duration);
        };

        const handleMouseUp = () => {
            if (isDragging && currentSong) {
                setIsDragging(false);
                seek(progress);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, currentSong, progress, seek]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !currentSong) return;
        setIsDragging(true);
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        setProgress(percentage * currentSong.duration);
    };

    if (!currentSong) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-white/20">
                <div className="h-32 w-32 rounded-full border-2 border-dashed border-white/10" />
                <p className="mt-4">No track playing</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center p-8">
            {/* Status Indicator */}
            <div className="absolute top-0 flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs font-medium text-white/60">
                    {participants.length} listening
                </span>
            </div>

            {/* Visualizer Area */}
            <div className="mb-12 mt-20 w-full max-w-md">
                <AudioVisualizer isPlaying={isPlaying && !isDragging} />
            </div>

            {/* Metadata */}
            <div className="z-10 text-center">
                <motion.h1
                    layoutId="title"
                    className="mb-2 text-4xl font-bold leading-tight text-white drop-shadow-2xl"
                >
                    {currentSong.title}
                </motion.h1>
                <motion.p
                    layoutId="artist"
                    className="text-lg font-medium uppercase tracking-[0.2em] text-zinc-400"
                >
                    {currentSong.artist}
                </motion.p>
            </div>

            {/* Play Status */}
            <div className="mt-8 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                <span className="text-xs font-bold tracking-widest text-white/40">
                    {isPlaying ? 'NOW PLAYING' : 'PAUSED'}
                </span>
            </div>

            {/* Progress Bar (Liquid Spring) */}
            <div className="mt-12 w-full max-w-2xl select-none">
                {/* Time Labels */}
                <div className="mb-3 flex w-full items-center justify-between font-mono text-xs tracking-widest text-zinc-500">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(currentSong.duration)}</span>
                </div>

                {/* Slider Track Container */}
                <div
                    className="group relative h-8 w-full cursor-pointer flex items-center"
                    ref={progressBarRef}
                    onMouseDown={handleMouseDown}
                >
                    {/* Background Track */}
                    <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm">
                        {/* Progress Fill */}
                        <motion.div
                            className="h-full bg-white"
                            style={{ width: `${(progress / currentSong.duration) * 100}%` }}
                            layoutId="progressFill"
                            transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                        />
                    </div>

                    {/* Interactive Thumb */}
                    <motion.div
                        className="absolute h-3 w-3 rounded-full bg-white z-20"
                        style={{
                            left: `${(progress / currentSong.duration) * 100}%`,
                            x: "-50%",
                            boxShadow: "0 0 15px rgba(255,255,255,0.6)"
                        }}
                        whileHover={{ scale: 1.5 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />

                    {/* Hover Glow Area (Invisible hit area expansion) */}
                    <div
                        className="absolute h-8 w-8 rounded-full -translate-x-1/2 left-[var(--progress)] cursor-pointer"
                        style={{
                            left: `${(progress / currentSong.duration) * 100}%`,
                            transform: 'translateX(-50%)'
                        } as any}
                    />
                </div>
            </div>

            {/* Personal Control Button */}
            <button className="mt-12 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white">
                <User className="h-4 w-4" />
                <span>Personal Control</span>
            </button>
        </div>
    );
}
