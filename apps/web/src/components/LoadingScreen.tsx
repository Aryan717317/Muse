'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    onComplete: () => void;
}

const STEPS = [
    { word: "Seek", sub: "The Inspiration", color: "text-zinc-500" },
    { word: "Find", sub: "The Rhythm", color: "text-zinc-300" },
    { word: "Become", sub: "The Muse", color: "text-white" }
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
    const [index, setIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (index < STEPS.length - 1) {
            const timer = setTimeout(() => setIndex(prev => prev + 1), 1500);
            return () => clearTimeout(timer);
        } else {
            const finalTimer = setTimeout(() => setIsReady(true), 1000);
            return () => clearTimeout(finalTimer);
        }
    }, [index]);

    const handleEnter = () => {
        // Standard Audio Unlock
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            ctx.resume().then(() => {
                console.log('[LoadingScreen] AudioContext resumed');
            }).catch(e => console.error(e));
        }
        onComplete();
    };

    return (
        <motion.div
            className="fixed inset-0 z-[1000] bg-[#030303] flex items-center justify-center overflow-hidden"
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 1 }}
        >
            {/* Ambient background glow that grows with progress */}
            <motion.div
                className="absolute w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px]"
                animate={{
                    scale: [1, 1.2, 1.5],
                    opacity: [0.1, 0.2, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            />

            <div className="relative flex flex-col items-center">
                <div className="h-40 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, letterSpacing: "0.5em", filter: "blur(12px)" }}
                            animate={{ opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -20, filter: "blur(12px)" }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="flex flex-col items-center"
                        >
                            <h1 className={`text-6xl md:text-8xl font-extralight uppercase tracking-[0.2em] ${STEPS[index].color}`}>
                                {STEPS[index].word}
                            </h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                className="mt-6 text-xs tracking-[0.4em] uppercase text-white font-medium"
                            >
                                {STEPS[index].sub}
                            </motion.p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* The Action */}
                <div className="h-24 mt-12 flex items-center justify-center">
                    {isReady && (
                        <motion.button
                            onClick={handleEnter}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-10 py-4 border border-white/20 rounded-full bg-white/5 backdrop-blur-md 
                         text-white text-xs tracking-[0.5em] uppercase hover:bg-white/10 
                         transition-colors duration-500 overflow-hidden group relative"
                        >
                            <span className="relative z-10">Open the Room</span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Progress Line */}
            <div className="absolute bottom-20 w-48 h-[1px] bg-white/5">
                <motion.div
                    className="h-full bg-white/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 1.5 }}
                />
            </div>
        </motion.div>
    );
}
