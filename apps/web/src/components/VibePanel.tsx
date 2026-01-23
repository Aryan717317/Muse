'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { Send, Heart, Flame, Music2, PartyPopper } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useRoomStore } from '@/store/useRoomStore';

interface Message {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
}

interface FloatingReaction {
    id: string;
    emoji: string;
    x: number; // Random horizontal position
}

export function VibePanel({ className = '' }: { className?: string }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [reactions, setReactions] = useState<FloatingReaction[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();
    const { participants } = useRoomStore();

    const currentUserName = participants.find(p => p.id === socket?.id)?.name || 'Guest';

    const REACTION_EMOJIS = [
        { icon: Heart, emoji: '❤️', label: 'Love' },
        { icon: Flame, emoji: '🔥', label: 'Fire' },
        { icon: Music2, emoji: '🎵', label: 'Vibe' },
        { icon: PartyPopper, emoji: '🎉', label: 'Party' },
    ];

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: Message) => {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        };

        const handleReaction = (reaction: { emoji: string }) => {
            const id = Math.random().toString(36).substr(2, 9);
            const x = Math.random() * 80 + 10; // 10% to 90%
            setReactions(prev => [...prev, { id, emoji: reaction.emoji, x }]);

            // Remove after animation
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
            }, 2000);
        };

        socket.on('vibe:message', handleMessage);
        socket.on('vibe:reaction', handleReaction);

        return () => {
            socket.off('vibe:message', handleMessage);
            socket.off('vibe:reaction', handleReaction);
        };
    }, [socket]);

    const sendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !socket) return;

        const msg = {
            id: Math.random().toString(36).substr(2, 9),
            userId: socket.id || 'unknown',
            userName: currentUserName, // Ideally from store
            text: message.trim(),
            timestamp: Date.now(),
        };

        // Optimistic update
        setMessages(prev => [...prev, msg]);
        socket.emit('vibe:message', msg);
        setMessage('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const sendReaction = (emoji: string) => {
        if (!socket) return;

        // Show locally immediately
        const id = Math.random().toString(36).substr(2, 9);
        const x = Math.random() * 80 + 10;
        setReactions(prev => [...prev, { id, emoji, x }]);
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);

        socket.emit('vibe:reaction', { emoji });
    };

    return (
        <GlassCard className={`flex flex-col relative overflow-hidden ${className}`} blur="xl">
            {/* Header */}
            <div className="border-b border-white/10 p-4">
                <h3 className="font-outfit text-lg font-semibold text-white">Vibe Check</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-white/20">
                        <p className="text-sm">No vibes yet</p>
                        <p className="text-xs">Send a message to start the chat</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.userId === socket?.id ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-white/40 px-1">{msg.userName}</span>
                            <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.userId === socket?.id
                                    ? 'bg-cyan-500/20 text-cyan-50 rounded-tr-sm'
                                    : 'bg-white/10 text-white rounded-tl-sm'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Reactions Overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <AnimatePresence>
                    {reactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{ y: '100%', x: `${reaction.x}%`, opacity: 1, scale: 0.5 }}
                            animate={{ y: '0%', opacity: 0, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute bottom-0 text-4xl"
                        >
                            {reaction.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4 bg-black/20">
                {/* Reaction Buttons */}
                <div className="mb-4 flex justify-between gap-2">
                    {REACTION_EMOJIS.map((reaction) => (
                        <button
                            key={reaction.label}
                            onClick={() => sendReaction(reaction.emoji)}
                            className="flex h-10 flex-1 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:scale-105 hover:text-white active:scale-95"
                            title={reaction.label}
                        >
                            <reaction.icon className="h-5 w-5" />
                        </button>
                    ))}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Say something..."
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-black transition-all hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </GlassCard>
    );
}
