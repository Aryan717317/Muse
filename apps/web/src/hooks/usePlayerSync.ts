'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from './useSocket';

const SYNC_INTERVAL = 5000; // Host broadcasts every 5 seconds
const SYNC_THRESHOLD = 0.3; // Perfect sync: 300ms threshold (HUM-level)
const SYNC_COOLDOWN = 1000; // 1 second cooldown after sync

export function usePlayerSync(playerRef: React.RefObject<any>, isReady: boolean = false) {
    const { isHost, isPlaying, seekTime } = useRoomStore();
    const { syncTime } = useSocket();
    const lastSyncTimeRef = useRef<number>(0);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const syncCooldownRef = useRef<boolean>(false);
    const isRemoteUpdateRef = useRef<boolean>(false);
    const isSeekingFromSyncRef = useRef<boolean>(false);

    // Host broadcasts their current time periodically (backward compatibility)
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

    // Guest receives sync requests and corrects if needed (Perfect Sync)
    const handleSyncRequest = useCallback((hostTime: number, timestamp: number, isRemote: boolean = false) => {
        if (isHost || !playerRef.current || syncCooldownRef.current) return;

        // Flag to prevent broadcast loop
        if (isRemote) {
            isRemoteUpdateRef.current = true;
        }

        // Calculate network latency (simplified)
        const networkDelay = (Date.now() - timestamp) / 1000;
        const adjustedHostTime = hostTime + networkDelay;

        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const delta = Math.abs(currentTime - adjustedHostTime);

        // Perfect sync: 300ms threshold
        if (delta > SYNC_THRESHOLD) {
            console.log(`[Perfect Sync] Correcting ${delta.toFixed(2)}s drift → seeking to ${adjustedHostTime.toFixed(2)}s`);
            
            // Set sync flags
            syncCooldownRef.current = true;
            isSeekingFromSyncRef.current = true;
            
            playerRef.current.seekTo?.(adjustedHostTime, 'seconds');
            
            // Reset flags after delays
            setTimeout(() => {
                isSeekingFromSyncRef.current = false;
            }, 500);
            
            setTimeout(() => {
                syncCooldownRef.current = false;
            }, SYNC_COOLDOWN);
        }

        // Reset remote update flag
        setTimeout(() => {
            isRemoteUpdateRef.current = false;
        }, 300);
    }, [isHost, playerRef]);

    // Seek to a specific time (with loop prevention)
    const seekTo = useCallback((time: number) => {
        if (playerRef.current && !isSeekingFromSyncRef.current) {
            playerRef.current.seekTo?.(time, 'seconds');
        }
    }, [playerRef]);

    // Get current playback time
    const getCurrentTime = useCallback(() => {
        return playerRef.current?.getCurrentTime?.() || 0;
    }, [playerRef]);

    // Apply initial seek when joining (Smart Resume)
    useEffect(() => {
        if (isReady && seekTime > 0 && playerRef.current && !isHost) {
            console.log(`[Smart Resume] Seeking to ${seekTime}s`);
            isSeekingFromSyncRef.current = true;
            playerRef.current.seekTo?.(seekTime, 'seconds');
            setTimeout(() => {
                isSeekingFromSyncRef.current = false;
            }, 500);
        }
    }, [seekTime, isHost, playerRef, isReady]);

    return {
        handleSyncRequest,
        seekTo,
        getCurrentTime,
        isRemoteUpdate: () => isRemoteUpdateRef.current,
        isSeekingFromSync: () => isSeekingFromSyncRef.current,
    };
}
