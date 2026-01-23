'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';
import { RoomView } from '@/components/Room/RoomView';
import { GlassCard } from '@/components/GlassCard';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const urlRoomId = params.roomId as string;

    const {
        roomId: storeRoomId,
        isJoining,
        isConnected,
        error
    } = useRoomStore();

    const { joinRoom } = useSocket();
    const [userName, setUserName] = useState('');

    // If we're already Connected and in this room, show the view
    if (isConnected && storeRoomId === urlRoomId) {
        return <RoomView />;
    }

    const handleJoin = () => {
        if (!userName.trim()) return;
        joinRoom(urlRoomId, userName.trim());
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <GlassCard
                className="w-full max-w-md p-8"
                blur="2xl"
                glow
            >
                <div className="mb-8 flex items-center justify-center gap-3">
                    <img src="/logo.png" alt="Muse" className="h-16 object-contain mix-blend-screen" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-center text-xl font-light text-white">
                        Join Room <span className="font-medium text-cyan-400">{urlRoomId}</span>
                    </h2>

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
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    <button
                        onClick={handleJoin}
                        disabled={isJoining || !userName.trim()}
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

                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 text-sm text-white/40 hover:text-white"
                    >
                        Go Home
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
