'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

export function PresenceBar() {
    const { participants, hostId } = useRoomStore();

    return (
        <div className="flex items-center -space-x-3 overflow-hidden p-1">
            {participants.map((participant, index) => (
                <motion.div
                    key={participant.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group cursor-default"
                >
                    <div className={`
                        flex h-10 w-10 items-center justify-center 
                        rounded-full border-2 border-[#050505] 
                        bg-gradient-to-br from-white/10 to-white/5 
                        backdrop-blur-md text-xs font-bold text-white
                        shadow-lg
                        ${participant.id === hostId ? 'ring-2 ring-yellow-500/50' : ''}
                    `}>
                        {participant.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Host Indicator */}
                    {participant.id === hostId && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] text-black shadow-sm">
                            <Crown className="h-2.5 w-2.5 fill-current" />
                        </div>
                    )}

                    {/* Tooltip name */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-50">
                        {participant.name}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
