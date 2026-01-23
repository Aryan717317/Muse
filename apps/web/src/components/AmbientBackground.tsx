'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { motion } from 'framer-motion';

export function AmbientBackground() {
    const themeColor = useRoomStore(state => state.themeColor);

    return (
        <div className="fixed inset-0 z-[-20] overflow-hidden pointer-events-none select-none bg-[#050505]">
            <motion.div
                className="absolute -inset-[50%] opacity-40 blur-3xl saturate-150"
                animate={{
                    background: `
                        radial-gradient(circle at 50% 50%, ${themeColor}, transparent 70%),
                        radial-gradient(circle at 0% 0%, ${themeColor}, transparent 50%)
                    `
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* Mesh overlay */}
            <div
                className="absolute inset-0 opacity-20 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        </div>
    );
}
