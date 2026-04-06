'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useRoomStore } from '@/store/useRoomStore';

interface SearchResult {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    duration: number;
}

interface SearchBarProps {
    className?: string;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SearchBar({ className = '' }: SearchBarProps) {
    const { setSearchOpen } = useRoomStore();

    return (
        <button
            onClick={() => setSearchOpen(true)}
            className={`flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.99] ${className}`}
        >
            <Search className="h-5 w-5 flex-shrink-0 text-white/40" />
            <span className="text-white/30">Search for songs...</span>
            <div className="ml-auto flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/30">
                <span className="text-[10px]">⌘</span> K
            </div>
        </button>
    );
}
