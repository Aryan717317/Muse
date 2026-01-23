'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X, Plus, Play, CornerDownLeft, Command } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useRoomStore } from '@/store/useRoomStore';

interface SearchResult {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    duration: number;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SearchModal() {
    const { isSearchOpen, setSearchOpen } = useRoomStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const { addToQueue } = useSocket();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-focus when opened
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isSearchOpen]);

    // Handle ESC to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSearchOpen) {
                setSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, setSearchOpen]);

    // Debounced search
    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim()) {
            debounceRef.current = setTimeout(() => {
                handleSearch(query);
            }, 300);
        } else {
            setResults([]);
        }
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, handleSearch]);

    const handleAddToQueue = (result: SearchResult) => {
        addToQueue({
            videoId: result.videoId,
            title: result.title,
            artist: result.channelTitle,
            thumbnail: result.thumbnail,
            duration: result.duration,
        });

        setAddedIds((prev) => new Set(prev).add(result.videoId));
        setTimeout(() => {
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(result.videoId);
                return next;
            });
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isSearchOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSearchOpen(false)}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed left-1/2 top-[20%] z-[210] w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-2xl"
                    >
                        {/* Header / Input */}
                        <div className="flex items-center gap-3 border-b border-white/10 p-4">
                            <Search className="h-5 w-5 text-white/40" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for music..."
                                className="flex-1 bg-transparent text-lg text-white placeholder:text-white/20 focus:outline-none"
                            />
                            {isSearching ? (
                                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                            ) : (
                                <button
                                    onClick={() => setSearchOpen(false)}
                                    className="rounded p-1 text-xs font-medium text-white/40 hover:bg-white/10 hover:text-white"
                                >
                                    ESC
                                </button>
                            )}
                        </div>

                        {/* Results Body */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {results.length === 0 && !query && (
                                <div className="flex h-40 flex-col items-center justify-center text-white/30">
                                    <p>Type to search for music</p>
                                </div>
                            )}

                            {results.length === 0 && query && !isSearching && (
                                <div className="flex h-40 items-center justify-center text-white/30">
                                    <p>No results found</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                {results.map((result) => (
                                    <motion.button
                                        key={result.videoId}
                                        layout
                                        onClick={() => handleAddToQueue(result)}
                                        className="group w-full flex items-center gap-4 rounded-xl p-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                                    >
                                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                                            <img src={result.thumbnail} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="truncate font-medium text-white">{result.title}</h4>
                                            <p className="truncate text-sm text-white/50">{result.channelTitle}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pr-2">
                                            <span className="text-xs text-white/30">{formatDuration(result.duration)}</span>
                                            {addedIds.has(result.videoId) ? (
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white opacity-0 group-hover:opacity-100 group-hover:bg-cyan-500 group-hover:border-cyan-500 group-hover:text-black transition-all">
                                                    <Plus className="h-4 w-4" />
                                                </span>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40">
                            <span>Select a track to play for everyone</span>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><kbd className="rounded bg-white/10 px-1 font-sans">↵</kbd> select</span>
                                <span className="flex items-center gap-1"><kbd className="rounded bg-white/10 px-1 font-sans">esc</kbd> close</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
