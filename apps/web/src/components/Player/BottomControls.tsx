'use client';

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, Mic2, Disc, VolumeX } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';
import { triggerAudioUnlock } from './YouTubePlayer';

export const BottomControls = memo(function BottomControls() {
    const { currentSong, isPlaying, isHost, collaborativeControls, volume, setVolume } = useRoomStore();
    const { play, pause, skip } = useSocket();
    const [isDragging, setIsDragging] = useState(false);
    const volumeTrackRef = useRef<HTMLDivElement>(null);

    const canControl = isHost || collaborativeControls;

    // Handle play/pause with audio unlock
    const handlePlayPause = useCallback(() => {
        if (!canControl) return;
        
        // CRITICAL: Unlock audio on user gesture
        triggerAudioUnlock();
        
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [canControl, isPlaying, play, pause]);

    // Handle Volume Drag
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !volumeTrackRef.current) return;
            const rect = volumeTrackRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const newVol = x / rect.width;
            setVolume(newVol);
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, setVolume]);

    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeTrackRef.current) return;
        const rect = volumeTrackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const newVol = x / rect.width;
        setVolume(newVol);
    };

    if (!currentSong) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="fixed bottom-12 left-1/2 z-[100] -translate-x-1/2"
        >
            {/* Outer Glass Pill */}
            <motion.div
                className="flex h-20 items-center gap-8 rounded-full border border-white/10 bg-white/5 px-8 shadow-2xl backdrop-blur-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {/* Left: Transport Controls */}
                <div className="flex items-center gap-6 text-white">
                    <button className="text-white/50 transition-colors hover:text-white">
                        <SkipBack className="h-5 w-5 fill-current" />
                    </button>

                    <button
                        onClick={handlePlayPause}
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 ${!canControl && 'opacity-50 cursor-not-allowed'}`}
                    >
                        {isPlaying ? (
                            <Pause className="h-5 w-5 fill-current" />
                        ) : (
                            <Play className="ml-1 h-5 w-5 fill-current" />
                        )}
                    </button>

                    <button
                        onClick={canControl ? skip : undefined}
                        className={`text-white/50 transition-colors hover:text-white ${!canControl && 'opacity-50 cursor-not-allowed'}`}
                    >
                        <SkipForward className="h-5 w-5 fill-current" />
                    </button>
                </div>

                {/* Center: Song Island (Nested Glass Pill) */}
                <div className="flex w-80 items-center gap-4 rounded-full bg-black/20 px-3 py-2 border border-white/5">
                    <motion.div
                        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-white/10"
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                    >
                        <img
                            src={currentSong.thumbnail}
                            alt={currentSong.title}
                            className="h-full w-full object-cover"
                        />
                        {/* Center hole for vinyl look */}
                        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/80" />
                    </motion.div>

                    <div className="flex min-w-0 flex-col pr-4">
                        <span className="truncate font-sans text-sm font-medium text-white">
                            {currentSong.title}
                        </span>
                        <span className="truncate font-sans text-xs text-zinc-400">
                            {currentSong.artist}
                        </span>
                    </div>
                </div>

                {/* Right: Utility Controls */}
                <div className="flex items-center gap-5">
                    <div className="flex gap-2">
                        <button className="rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                            <Mic2 className="h-4 w-4" />
                        </button>
                        <button className="rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                            <ListMusic className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Volume Slider (Custom) */}
                    <div className="group flex items-center gap-3">
                        <button onClick={() => setVolume(volume > 0 ? 0 : 1)}>
                            {volume === 0 ? (
                                <VolumeX className="h-4 w-4 text-white/40 transition-colors group-hover:text-white" />
                            ) : (
                                <Volume2 className="h-4 w-4 text-white/40 transition-colors group-hover:text-white" />
                            )}
                        </button>

                        <div
                            className="relative h-6 w-24 cursor-pointer flex items-center"
                            ref={volumeTrackRef}
                            onMouseDown={() => setIsDragging(true)}
                            onClick={handleVolumeClick}
                        >
                            {/* Track */}
                            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full bg-white rounded-full"
                                    style={{ width: `${volume * 100}%` }}
                                />
                            </div>

                            {/* Thumb */}
                            <div
                                className="absolute h-3 w-3 rounded-full bg-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                                style={{
                                    left: `${volume * 100}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});
