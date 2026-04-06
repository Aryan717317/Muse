'use client';

import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';
import { usePlayerSync } from '@/hooks/usePlayerSync';

// Dynamic import for SSR safety
const ReactPlayer = dynamic(() => import('react-player'), {
    ssr: false,
}) as any;

export interface YouTubePlayerRef {
    seekTo: (seconds: number) => void;
    getCurrentTime: () => number;
}

interface YouTubePlayerProps {
    className?: string;
    onEnded?: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
    ({ className = '', onEnded }, ref) => {
        const playerRef = useRef<any>(null);
        const { currentSong, isPlaying, isHost, collaborativeControls, volume } = useRoomStore();
        const { play, pause, skip } = useSocket();
        const [isReady, setIsReady] = useState(false);
        const { handleSyncRequest } = usePlayerSync(playerRef, isReady);

        // Internal playing state - mirrors isPlaying prop (like the working code)
        const [internalPlaying, setInternalPlaying] = useState(false);
        const wakeLockRef = useRef<any>(null);

        // Sync internal playing state with store - BUT only if ready
        useEffect(() => {
            console.log('[YouTubePlayer] Syncing internalPlaying. isPlaying:', isPlaying, 'isReady:', isReady);
            // Only allow playing if the player is ready
            if (isReady) {
                setInternalPlaying(isPlaying);
            } else if (isPlaying) {
                // Store pending play for when ready
                console.log('[YouTubePlayer] Player not ready yet, will play when ready');
            }
        }, [isPlaying, isReady]);

        // Expose imperative methods
        useImperativeHandle(ref, () => ({
            seekTo: (seconds: number) => {
                playerRef.current?.seekTo(seconds, 'seconds');
            },
            getCurrentTime: () => {
                return playerRef.current?.getCurrentTime() || 0;
            },
        }));

        const videoUrl = currentSong ? `https://www.youtube.com/watch?v=${currentSong.videoId}` : '';

        // Wake lock to prevent screen from sleeping (like the working code)
        useEffect(() => {
            (async () => {
                if ('wakeLock' in navigator && internalPlaying) {
                    try {
                        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                        console.log('[WakeLock] Screen wake lock acquired');
                    } catch (e) {
                        console.log('[WakeLock] Failed to acquire:', e);
                    }
                }
            })();
            return () => {
                if (wakeLockRef.current) {
                    wakeLockRef.current.release();
                    wakeLockRef.current = null;
                }
            };
        }, [internalPlaying]);

        // Resume playback when tab becomes visible again (like the working code)
        useEffect(() => {
            const handleVisibilityChange = () => {
                if (document.hidden && internalPlaying && playerRef.current) {
                    const internalPlayer = playerRef.current.getInternalPlayer();
                    if (internalPlayer && internalPlayer.playVideo) {
                        setTimeout(() => internalPlayer.playVideo(), 100);
                    }
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, [internalPlaying]);

        const handleReady = useCallback(() => {
            console.log('[YouTubePlayer] Player ready! isPlaying from store:', isPlaying);
            setIsReady(true);

            // Debug volume/mute state
            const internalPlayer = playerRef.current?.getInternalPlayer();
            if (internalPlayer) {
                console.log('[YouTubePlayer] Ready state - Muted:', internalPlayer.isMuted(), 'Volume:', internalPlayer.getVolume());
            }

            // If the store says we should be playing, start now
            if (isPlaying) {
                console.log('[YouTubePlayer] Starting playback now that player is ready');
                setInternalPlaying(true);
            }
        }, [isPlaying]);

        // Cooldown ref to prevent initial pause events from stopping playback
        const ignorePauseRef = useRef(false);

        // When song changes or play starts, ignore pauses for 2 seconds
        useEffect(() => {
            if (isPlaying) {
                console.log('[YouTubePlayer] Ignoring pauses for 2s (playback start)');
                ignorePauseRef.current = true;
                const timer = setTimeout(() => {
                    ignorePauseRef.current = false;
                    console.log('[YouTubePlayer] Pause protection ended');
                }, 2000);
                return () => clearTimeout(timer);
            }
        }, [isPlaying, currentSong]);

        const handlePlay = useCallback(() => {
            console.log('[YouTubePlayer] onPlay triggered');

            // Force unmute and set volume to ensure audio
            const internalPlayer = playerRef.current?.getInternalPlayer();
            if (internalPlayer) {
                console.log('[YouTubePlayer] onPlay check - Muted:', internalPlayer.isMuted(), 'Volume:', internalPlayer.getVolume());
                if (internalPlayer.isMuted()) {
                    console.log('[YouTubePlayer] Force unmuting...');
                    internalPlayer.unMute();
                }
                if (internalPlayer.getVolume() === 0) {
                    console.log('[YouTubePlayer] Force setting volume to 100...');
                    internalPlayer.setVolume(100);
                }
            }

            if (isHost || collaborativeControls) {
                // If we are already playing in store, don't spam
                if (!isPlaying) {
                    play();
                }
            }
        }, [isHost, collaborativeControls, play, isPlaying]);

        const handlePause = useCallback(() => {
            console.log('[YouTubePlayer] onPause triggered. Ignore?', ignorePauseRef.current);
            if (ignorePauseRef.current) return;

            if (isHost || collaborativeControls) {
                // If we are already paused in store, don't spam
                if (isPlaying) {
                    pause();
                }
            }
        }, [isHost, collaborativeControls, pause, isPlaying]);

        const handleEnded = useCallback(() => {
            console.log('[YouTubePlayer] Video ended');
            if (isHost) {
                skip();
            }
            onEnded?.();
        }, [isHost, skip, onEnded]);

        const handleProgress = useCallback((state: { playedSeconds: number }) => {
            window.dispatchEvent(new CustomEvent('playback:progress', {
                detail: { playedSeconds: state.playedSeconds }
            }));
        }, []);

        const handleDuration = useCallback((duration: number) => {
            console.log('[YouTubePlayer] Duration:', duration);
        }, []);

        const handleError = useCallback((error: any) => {
            console.error('[YouTubePlayer] Error:', error);
        }, []);

        // Listen for sync requests from host (for guests)
        useEffect(() => {
            if (isHost || !playerRef.current) return;

            const handleSync = (event: CustomEvent) => {
                handleSyncRequest(event.detail.hostTime, event.detail.timestamp);
            };

            window.addEventListener('playback:sync' as any, handleSync);
            return () => window.removeEventListener('playback:sync' as any, handleSync);
        }, [isHost, handleSyncRequest]);

        // Debug logging
        useEffect(() => {
            console.log('[YouTubePlayer] State:', {
                videoUrl,
                isPlaying,
                internalPlaying,
                isReady,
                volume,
                currentSongId: currentSong?.videoId
            });
        }, [videoUrl, isPlaying, internalPlaying, isReady, volume, currentSong]);

        // Mount/Unmount logging
        useEffect(() => {
            console.log('[YouTubePlayer] Component MOUNTED');
            return () => console.log('[YouTubePlayer] Component UNMOUNTED');
        }, []);

        // Don't render if no song
        if (!currentSong) {
            console.log('[YouTubePlayer] No currentSong, not rendering player');
            return null;
        }

        console.log('[YouTubePlayer] Rendering player for:', currentSong.videoId);

        return (
            <div
                className={`fixed ${className}`}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '300px',
                    height: '300px',
                    opacity: 0.01, // Must be > 0 to count as "visible"
                    pointerEvents: 'none',
                    zIndex: -50, 
                    overflow: 'hidden',
                }}
            >
                <ReactPlayer
                    ref={playerRef}
                    url={videoUrl}
                    playing={internalPlaying}
                    controls={false}
                    width="100%"
                    height="100%"
                    onReady={handleReady}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onError={(e: any) => console.error('[YouTubePlayer] PLAYER ERROR:', e)}
                    onBuffer={() => console.log('[YouTubePlayer] Buffering...')}
                    onBufferEnd={() => console.log('[YouTubePlayer] Buffer ended')}
                    progressInterval={500}
                    volume={volume}
                    muted={false}
                    playsinline={true}
                    pip={false}
                    config={{
                        youtube: {
                            playerVars: {
                                modestbranding: 1,
                                rel: 0,
                                showinfo: 0,
                                controls: 0,
                                disablekb: 1,
                                fs: 0,
                                iv_load_policy: 3,
                                playsinline: 1,
                                enablejsapi: 1,
                                origin: typeof window !== 'undefined' ? window.location.origin : '',
                            },
                        },
                    }}
                />
            </div>
        );
    }
);

YouTubePlayer.displayName = 'YouTubePlayer';

// Export dummy function for backward compatibility
export function triggerAudioUnlock() {
    console.log('[YouTubePlayer] triggerAudioUnlock called (no-op in new version)');
}
