'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RouteAnnouncer } from '@/components/RouteAnnouncer';
import { YouTubePlayer } from '@/components/Player/YouTubePlayer';
import { QueuePanel } from '@/components/Queue/QueuePanel';
import { SearchBar } from '@/components/Queue/SearchBar';
import { VibePanel } from '@/components/VibePanel';
import { useSocket } from '@/hooks/useSocket';
import { useRoomStore } from '@/store/useRoomStore';
import { Lock, Unlock, Copy, Check, LogOut } from 'lucide-react';
import { PresenceBar } from '@/components/PresenceBar';
import { BottomControls } from '@/components/Player/BottomControls';
import LoadingScreen from '@/components/LoadingScreen';
import { SearchModal } from '@/components/SearchModal';
import { BigPlayer } from '@/components/Player/BigPlayer';
import { DynamicBackground } from '@/components/Player/DynamicBackground';
import { GrainOverlay } from '@/components/GrainOverlay';
import { VoiceControls } from '@/components/VoiceControls';
import { useRouter } from 'next/navigation';

export function RoomView() {
    const router = useRouter();
    const { toggleControls, leaveRoom: socketLeaveRoom } = useSocket();
    const {
        roomId,
        isHost,
        collaborativeControls,
        isJoining,
    } = useRoomStore();

    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopyRoomId = () => {
        if (roomId) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeave = () => {
        socketLeaveRoom();
        router.push('/');
    };

    return (
        <>
            <AnimatePresence>
                {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
            </AnimatePresence>

            <RouteAnnouncer isVisible={isJoining} status="entering" />

            {/* Audio Engine - Component positions itself offscreen */}
            <YouTubePlayer />

            <DynamicBackground />
            <GrainOverlay />
            <SearchModal />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 min-h-screen p-4 pb-32 lg:p-8"
            >
                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-6 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="Muse" className="h-8 object-contain" />

                        {/* Room ID */}
                        <button
                            onClick={handleCopyRoomId}
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        >
                            Room: {roomId}
                            {copied ? (
                                <Check className="h-4 w-4 text-green-400" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Voice Controls */}
                        <VoiceControls />

                        {/* Participants */}
                        <PresenceBar />

                        {/* Host Controls */}
                        {isHost && (
                            <button
                                onClick={() => toggleControls(!collaborativeControls)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${collaborativeControls
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                    }`}
                            >
                                {collaborativeControls ? (
                                    <><Unlock className="h-4 w-4" /> Controls Open</>
                                ) : (
                                    <><Lock className="h-4 w-4" /> Controls Locked</>
                                )}
                            </button>
                        )}

                        {/* Leave Room */}
                        <button
                            onClick={handleLeave}
                            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-all hover:bg-red-500/20 hover:text-red-400"
                        >
                            <LogOut className="h-4 w-4" />
                            Leave
                        </button>
                    </div>
                </motion.header>

                {/* Main Content */}
                <div className="grid min-h-[calc(100vh-300px)] gap-6 lg:grid-cols-[300px_1fr_300px]">
                    {/* Left - Queue */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="hidden flex-col gap-4 lg:flex"
                    >
                        <SearchBar />
                        <QueuePanel className="h-full" />
                    </motion.div>

                    {/* Center - Player */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center justify-center"
                    >
                        <BigPlayer />

                        {/* Mobile Queue Shortcut */}
                        <div className="mt-8 lg:hidden w-full px-4">
                            <SearchBar className="mb-4" />
                            <QueuePanel className="h-[300px]" />
                        </div>
                    </motion.div>

                    {/* Right - Vibe Panel */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="hidden lg:block h-full"
                    >
                        <VibePanel className="h-full" />
                    </motion.div>
                </div>
                <BottomControls />
            </motion.div >
        </>
    );
}
