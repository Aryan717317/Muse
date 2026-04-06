'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface RouteAnnouncerProps {
    isVisible: boolean;
    status?: 'connecting' | 'syncing' | 'entering';
}

const statusMessages = {
    connecting: 'Connecting to the Jam...',
    syncing: 'Syncing with Host...',
    entering: 'Entering the Vibe...',
};

export function RouteAnnouncer({ isVisible, status = 'connecting' }: RouteAnnouncerProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-3xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex flex-col items-center gap-8">
                        {/* Pulsing Glow Ring */}
                        <div className="relative">
                            <motion.div
                                className="h-24 w-24 rounded-full border-2 border-cyan-400/50"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 0, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                            <motion.div
                                className="absolute inset-0 h-24 w-24 rounded-full border-2 border-cyan-400"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    boxShadow: [
                                        '0 0 20px rgba(0, 255, 255, 0.3)',
                                        '0 0 40px rgba(0, 255, 255, 0.5)',
                                        '0 0 20px rgba(0, 255, 255, 0.3)',
                                    ],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                            <motion.div
                                className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400"
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        </div>

                        {/* Status Text */}
                        <motion.p
                            key={status}
                            className="font-outfit text-lg font-medium tracking-wide text-white/80"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {statusMessages[status]}
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
