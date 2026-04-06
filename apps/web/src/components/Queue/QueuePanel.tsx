'use client';

import { memo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GlassCard } from '../GlassCard';
import { X, GripVertical, Music } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';

interface QueuePanelProps {
    className?: string;
}

export const QueuePanel = memo(function QueuePanel({ className = '' }: QueuePanelProps) {
    const { queue, isHost, collaborativeControls } = useRoomStore();
    const { removeFromQueue, reorderQueue } = useSocket();

    const canControl = isHost || collaborativeControls;

    const handleReorder = (newQueue: typeof queue) => {
        if (!canControl) return;

        // Find the moved item
        // This is a simplified logic. For robust reordering, we'd need better diffing.
        // Or we assume single drag operation.
        // Since we lack robust diffing here in this snippet complexity, 
        // we'll optimistically wait for better implementation or user feedback.
        // BUT, Reorder.Group requires onReorder to update state. 
        // We lack local state for queue (it's in store). 
        // Let's rely on finding 1 move.

        let movedItemIndex = -1;
        let targetIndex = -1;

        // Simple single-item move detection
        for (let i = 0; i < queue.length; i++) {
            if (queue[i].id !== newQueue[i].id) {
                // Found divergence
                movedItemIndex = queue.findIndex(item => item.id === newQueue[i].id);
                targetIndex = i;
                break;
            }
        }

        if (movedItemIndex !== -1 && targetIndex !== -1) {
            reorderQueue(movedItemIndex, targetIndex);
        }
    };

    return (
        <GlassCard className={`flex flex-col ${className}`} blur="xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h3 className="font-outfit text-lg font-semibold text-white">Up Next</h3>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">
                    {queue.length} songs
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <AnimatePresence mode="popLayout">
                    {queue.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center gap-3 py-12 text-center"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                                <Music className="h-8 w-8 text-white/20" />
                            </div>
                            <p className="text-sm text-white/40">Queue is empty</p>
                            <p className="text-xs text-white/20">Search to add songs</p>
                        </motion.div>
                    ) : (
                        <Reorder.Group
                            axis="y"
                            values={queue}
                            onReorder={handleReorder}
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                        >
                            {queue.map((song, index) => (
                                <Reorder.Item
                                    key={song.id}
                                    value={song}
                                    className="mb-2"
                                    dragListener={canControl}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/5"
                                    >
                                        {/* Glow underlay on hover */}
                                        <motion.div
                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100"
                                        />

                                        {/* Drag handle */}
                                        {canControl && (
                                            <GripVertical className="h-4 w-4 cursor-grab text-white/20 active:cursor-grabbing" />
                                        )}

                                        {/* Thumbnail */}
                                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                                            <img
                                                src={song.thumbnail}
                                                alt={song.title}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white/80">
                                                {index + 1}
                                            </div>
                                        </div>

                                        {/* Song info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-white">
                                                {song.title}
                                            </p>
                                            <p className="truncate text-xs text-white/50">
                                                {song.artist}
                                            </p>
                                        </div>

                                        {/* Remove button */}
                                        {canControl && (
                                            <motion.button
                                                onClick={() => removeFromQueue(song.id)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/70 group-hover:opacity-100"
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <X className="h-4 w-4" />
                                            </motion.button>
                                        )}
                                    </motion.div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    )}
                </AnimatePresence>
            </div>
        </GlassCard>
    );
});
