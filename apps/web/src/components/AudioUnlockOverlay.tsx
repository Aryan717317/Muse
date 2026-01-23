'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';

export function AudioUnlockOverlay() {
    const { currentSong, isPlaying } = useRoomStore();
    const [isVisible, setIsVisible] = useState(false);
    const [hasUnlocked, setHasUnlocked] = useState(false);

    useEffect(() => {
        // Show overlay when there's a song but user hasn't unlocked audio yet
        if (currentSong && !hasUnlocked) {
            setIsVisible(true);
        }
    }, [currentSong, hasUnlocked]);

    const handleUnlock = useCallback(() => {
        // Create and play a silent audio to unlock AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.resume().then(() => {
            console.log('[AudioUnlock] AudioContext resumed');
        });

        // Also create a dummy audio element and play it
        const audio = document.createElement('audio');
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audio.volume = 0.01;
        audio.play().then(() => {
            console.log('[AudioUnlock] Dummy audio played - browser audio unlocked');
        }).catch(e => {
            console.log('[AudioUnlock] Dummy audio failed, but click event should unlock:', e);
        });

        // Slight delay to ensure browser acknowledges the interaction/audio resume
        setTimeout(() => {
            setIsVisible(false);
            setHasUnlocked(true);

            // Dispatch custom event for player to know audio is unlocked
            window.dispatchEvent(new CustomEvent('audio:unlocked'));
        }, 100);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
                >
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUnlock}
                        className="group flex flex-col items-center gap-4 rounded-3xl bg-white/10 p-8 ring-1 ring-white/20 transition-all hover:bg-white/20"
                    >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40">
                            <Play className="h-8 w-8 fill-black text-black ml-1" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white">Join the Jam</h3>
                            <p className="text-white/60">Click to enable audio sync</p>
                        </div>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
