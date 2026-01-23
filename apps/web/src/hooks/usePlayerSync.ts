'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from './useSocket';

const SYNC_INTERVAL = 5000; // Host broadcasts every 5 seconds
const SYNC_THRESHOLD = 0.5; // Correct if > 0.5s off

export function usePlayerSync(playerRef: React.RefObject<any>, isReady: boolean = false) {
    const { isHost, isPlaying, seekTime } = useRoomStore();
    const { syncTime } = useSocket();
    const lastSyncTimeRef = useRef<number>(0);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Host broadcasts their current time periodically
    useEffect(() => {
        if (!isHost || !isPlaying) {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
                syncIntervalRef.current = null;
            }
            return;
        }

        syncIntervalRef.current = setInterval(() => {
            if (playerRef.current) {
                const currentTime = playerRef.current.getCurrentTime?.() || 0;
                syncTime(currentTime);
            }
        }, SYNC_INTERVAL);

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [isHost, isPlaying, syncTime, playerRef]);

    // Guest receives sync requests and corrects if needed
    const handleSyncRequest = useCallback((hostTime: number, timestamp: number) => {
        if (isHost || !playerRef.current) return;

        // Calculate network latency (simplified - could be improved with RTT measurement)
        const networkDelay = (Date.now() - timestamp) / 1000;
        const adjustedHostTime = hostTime + networkDelay;

        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const delta = Math.abs(currentTime - adjustedHostTime);

        if (delta > SYNC_THRESHOLD) {
            console.log(`Sync correction: ${delta.toFixed(2)}s delta, seeking to ${adjustedHostTime.toFixed(2)}s`);
            playerRef.current.seekTo?.(adjustedHostTime, 'seconds');
        }
    }, [isHost, playerRef]);

    // Seek to a specific time
    const seekTo = useCallback((time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo?.(time, 'seconds');
        }
    }, [playerRef]);

    // Get current playback time
    const getCurrentTime = useCallback(() => {
        return playerRef.current?.getCurrentTime?.() || 0;
    }, [playerRef]);

    // Apply initial seek when joining
    useEffect(() => {
        if (isReady && seekTime > 0 && playerRef.current && !isHost) {
            console.log(`Smart Resume: Seeking to ${seekTime}s`);
            playerRef.current.seekTo?.(seekTime, 'seconds');
        }
    }, [seekTime, isHost, playerRef, isReady]);

    return {
        handleSyncRequest,
        seekTo,
        getCurrentTime,
    };
}
