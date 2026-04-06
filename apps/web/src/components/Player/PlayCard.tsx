'use client';

import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../GlassCard';
import { Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';
import { FastAverageColor } from 'fast-average-color';

interface PlayCardProps {
    className?: string;
}

const fac = new FastAverageColor();

export const PlayCard = memo(function PlayCard({ className = '' }: PlayCardProps) {
    const { currentSong, isPlaying, isHost, collaborativeControls, setThemeColor } = useRoomStore();
    const { play, pause, skip, seek } = useSocket();
    const [dominantColor, setDominantColor] = useState<string>('rgba(0, 255, 255, 0.2)');
    const [progress, setProgress] = useState(0);

    const canControl = isHost || collaborativeControls;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (time: number) => {
        if (!canControl) return;
        setProgress(time); // Optimistic update
        seek(time);
    };

    useEffect(() => {
        const handleProgressUpdate = (e: CustomEvent) => {
            setProgress(e.detail.playedSeconds);
        };

        window.addEventListener('playback:progress' as any, handleProgressUpdate);
        return () => window.removeEventListener('playback:progress' as any, handleProgressUpdate);
    }, []);

    useEffect(() => {
        if (currentSong?.thumbnail) {
            fac.getColorAsync(currentSong.thumbnail)
                .then(color => {
                    setDominantColor(color.rgba);
                    setThemeColor(color.rgba);
                })
                .catch(() => {
                    setDominantColor('rgba(255, 255, 255, 0.1)');
                    setThemeColor('rgba(255, 255, 255, 0.1)');
                });
        }
    }, [currentSong?.thumbnail]);

    const handlePlayPause = () => {
        if (!canControl) return;
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    };

    const handleSkip = () => {
        if (!canControl) return;
        skip();
    };

    if (!currentSong) {
        return (
            <GlassCard className={`p-8 ${className}`} blur="2xl">
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="h-32 w-32 rounded-2xl bg-white/5" />
                    <p className="text-white/40">No song playing</p>
                    <p className="text-sm text-white/20">Search for a song to start the jam</p>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard
            className={`overflow-hidden ${className}`}
            blur="2xl"
            glow={isPlaying}
            glowColor={dominantColor}
        >
            {/* Album Art */}
            <div className="relative aspect-square w-full">
                {/* Jam Pulse Effect */}
                {isPlaying && (
                    <motion.div
                        className="absolute inset-0 z-[-1] rounded-full blur-3xl"
                        style={{ backgroundColor: dominantColor }}
                        animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                )}
                <img
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Song Info */}
            <div className="p-6">
                <motion.h2
                    className="font-outfit text-xl font-semibold text-white"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentSong.id}
                >
                    {currentSong.title}
                </motion.h2>
                <p className="mt-1 text-sm text-white/60">{currentSong.artist}</p>

                {/* Progress Bar */}
                <div className="mt-6 group">
                    <div
                        className={`h-1 w-full overflow-hidden rounded-full bg-white/10 ${canControl ? 'cursor-pointer' : ''}`}
                        onClick={(e) => {
                            if (!canControl || !currentSong) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const percentage = x / rect.width;
                            const newTime = percentage * currentSong.duration;
                            handleSeek(newTime);
                        }}
                    >
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                            animate={{
                                width: `${(progress / (currentSong.duration || 1)) * 100}%`,
                                boxShadow: isPlaying
                                    ? ['0 0 10px rgba(0, 255, 255, 0.5)', '0 0 20px rgba(0, 255, 255, 0.3)', '0 0 10px rgba(0, 255, 255, 0.5)']
                                    : 'none',
                            }}
                            transition={{
                                width: { duration: 0.1, ease: "linear" }, // Smooth linear updates
                                boxShadow: { duration: 1, repeat: Infinity }
                            }}
                        />
                    </div>
                    {/* Time Display */}
                    <div className="mt-1 flex justify-between text-xs text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(currentSong.duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <motion.button
                        onClick={handlePlayPause}
                        disabled={!canControl}
                        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-lg shadow-cyan-500/25 transition-all ${!canControl ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-cyan-500/50'
                            }`}
                        whileTap={canControl ? { scale: 0.95 } : undefined}
                        whileHover={canControl ? { scale: 1.05 } : undefined}
                    >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
                    </motion.button>

                    <motion.button
                        onClick={handleSkip}
                        disabled={!canControl}
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all ${!canControl ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/20'
                            }`}
                        whileTap={canControl ? { scale: 0.95 } : undefined}
                        whileHover={canControl ? { scale: 1.05 } : undefined}
                    >
                        <SkipForward className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Volume2 className="h-5 w-5" />
                    </motion.button>
                </div>

                {!canControl && (
                    <p className="mt-4 text-center text-xs text-white/40">
                        Host has locked controls
                    </p>
                )}
            </div>
        </GlassCard>
    );
});
