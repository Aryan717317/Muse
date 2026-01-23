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

        // Sync internal playing state with store
        useEffect(() => {
            console.log('[YouTubePlayer] Syncing internalPlaying with isPlaying:', isPlaying);
            setInternalPlaying(isPlaying);
        }, [isPlaying]);

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
            console.log('[YouTubePlayer] Player ready');
            setIsReady(true);
        }, []);

        const handlePlay = useCallback(() => {
            console.log('[YouTubePlayer] onPlay triggered');
            if (isHost || collaborativeControls) {
                play();
            }
        }, [isHost, collaborativeControls, play]);

        const handlePause = useCallback(() => {
            console.log('[YouTubePlayer] onPause triggered');
            if (isHost || collaborativeControls) {
                pause();
            }
        }, [isHost, collaborativeControls, pause]);

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

        // Don't render if no song
        if (!currentSong) {
            console.log('[YouTubePlayer] No currentSong, not rendering player');
            return null;
        }

        console.log('[YouTubePlayer] Rendering player for:', currentSong.videoId);

        return (
            // Player container - positioned on-screen but visually hidden
            <div
                className={`fixed ${className}`}
                style={{
                    bottom: 16,
                    right: 16,
                    width: 320,
                    height: 180,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    zIndex: 50,
                }}
            >
                <ReactPlayer
                    ref={playerRef}
                    url={videoUrl}
                    playing={internalPlaying}
                    controls={true}
                    width="100%"
                    height="100%"
                    onReady={handleReady}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onError={handleError}
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
