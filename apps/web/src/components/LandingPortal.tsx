'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { useSocket } from '@/hooks/useSocket';
import { useRoomStore } from '@/store/useRoomStore';
import { Music, Users, ArrowRight, Loader2 } from 'lucide-react';

interface LandingPortalProps {
    onEnter?: () => void;
}

export function LandingPortal({ onEnter }: LandingPortalProps) {
    const [mode, setMode] = useState<'initial' | 'create' | 'join'>('initial');
    const [userName, setUserName] = useState('');
    const [roomId, setRoomId] = useState('');
    const { createRoom, joinRoom } = useSocket();
    const { isJoining, error } = useRoomStore();

    const handleCreate = () => {
        if (!userName.trim()) return;
        createRoom(userName.trim());
    };

    const handleJoin = () => {
        if (!userName.trim() || !roomId.trim()) return;
        joinRoom(roomId.trim(), userName.trim());
    };

    return (
        <motion.div
            className="flex min-h-screen items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <GlassCard
                className="w-full max-w-md p-8"
                blur="2xl"
                glow
                layoutId="portal-card"
            >
                {/* Logo */}
                <motion.div
                    className="mb-8 flex items-center justify-center gap-3"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <img src="/logo.png" alt="Muse" className="h-16 object-contain mix-blend-screen" />
                </motion.div>

                <AnimatePresence mode="wait">
                    {mode === 'initial' && (
                        <motion.div
                            key="initial"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <p className="mb-6 text-center text-sm text-white/60">
                                Create a virtual listening room and enjoy music together in perfect sync.
                            </p>

                            <button
                                onClick={() => setMode('create')}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-medium text-black transition-all hover:bg-neutral-200 hover:shadow-lg hover:shadow-white/10"
                            >
                                <Music className="h-5 w-5" />
                                Create a Jam
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>

                            <button
                                onClick={() => setMode('join')}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-4 font-medium text-white transition-all hover:bg-white/10"
                            >
                                <Users className="h-5 w-5" />
                                Join a Room
                            </button>
                        </motion.div>
                    )}

                    {mode === 'create' && (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() => setMode('initial')}
                                className="mb-4 text-sm text-white/60 hover:text-white"
                            >
                                ← Back
                            </button>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/80">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-400">{error}</p>
                            )}

                            <button
                                onClick={handleCreate}
                                disabled={isJoining || !userName.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-medium text-black transition-all hover:bg-neutral-200 disabled:opacity-50"
                            >
                                {isJoining ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Start the Jam
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {mode === 'join' && (
                        <motion.div
                            key="join"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={() => setMode('initial')}
                                className="mb-4 text-sm text-white/60 hover:text-white"
                            >
                                ← Back
                            </button>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/80">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/80">
                                    Room Code
                                </label>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    placeholder="Enter room code"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-400">{error}</p>
                            )}

                            <button
                                onClick={handleJoin}
                                disabled={isJoining || !userName.trim() || !roomId.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-400 px-6 py-4 font-medium text-white transition-all hover:from-purple-400 hover:to-purple-300 disabled:opacity-50"
                            >
                                {isJoining ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Join the Vibe
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    );
}
