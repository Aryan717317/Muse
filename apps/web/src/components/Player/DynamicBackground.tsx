'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { motion, AnimatePresence } from 'framer-motion';

export function DynamicBackground() {
    const { currentSong } = useRoomStore();

    // Default to a dark fallback if no song
    const currentImage = currentSong?.thumbnail || '/placeholder-dark.jpg';

    return (
        <div className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-black">
            {/* Cross-fading Image Layers */}
            <AnimatePresence mode='popLayout'>
                <motion.div
                    key={currentImage} // Key triggers animation on change
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }} // Smooth 1.5s transition
                    className="absolute inset-0 h-full w-full"
                >
                    {/* The Image Itself */}
                    {currentSong?.thumbnail && (
                        <img
                            src={currentImage}
                            alt=""
                            className="h-full w-full object-cover will-change-transform"
                            style={{
                                filter: 'brightness(0.5) blur(80px)',
                                transform: 'scale(1.1)' // Scale up to prevent blurred edges showing
                            }}
                        />
                    )}
                    {!currentSong?.thumbnail && (
                        <div className="h-full w-full bg-[#121212]" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Vignette Overlay */}
            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%)'
                }}
            />

            {/* Gradient Mesh Overlay (Optional Extra Depth) */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />
        </div>
    );
}
