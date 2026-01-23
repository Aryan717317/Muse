'use client';

import { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { useRoomStore } from '@/store/useRoomStore';
import { useSocket } from '@/hooks/useSocket';
import { usePlayerSync } from '@/hooks/usePlayerSync';

// Dynamic import for SSR safety
const ReactPlayer = dynamic(() => import('react-player/youtube'), {
    ssr: false,
}) as any;

export interface YouTubePlayerRef {
    seekTo: (seconds: number) => void;
    getCurrentTime: () => number;
    triggerPlay: () => void;
}

interface YouTubePlayerProps {
    /** Whether to show as ambient background (blurred, low opacity) */
    ambient?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Called when video ends */
    onEnded?: () => void;
}

// Global ref for direct access from overlay
let globalPlayerRef: any = null;
let globalSetAudioUnlocked: ((value: boolean) => void) | null = null;

// Export function for overlay to call directly
export function triggerAudioUnlock() {
    console.log('[YouTubePlayer] triggerAudioUnlock called');
    if (globalSetAudioUnlocked) {
        globalSetAudioUnlocked(true);
    }
    // Directly trigger play on the YouTube player
    if (globalPlayerRef?.getInternalPlayer) {
        const internalPlayer = globalPlayerRef.getInternalPlayer();
        if (internalPlayer?.playVideo) {
            console.log('[YouTubePlayer] Calling playVideo directly');
            internalPlayer.playVideo();
        }
    }
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
    ({ ambient = false, className = '', onEnded }, ref) => {
        const playerRef = useRef<any>(null);
        const { currentSong, isPlaying, isHost, collaborativeControls, volume } = useRoomStore();
        const { play, pause, skip } = useSocket();
        const [isReady, setIsReady] = useState(false);
        const { handleSyncRequest } = usePlayerSync(playerRef, isReady);

        const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

        // Store refs globally for overlay access
        useEffect(() => {
            globalPlayerRef = playerRef.current;
            globalSetAudioUnlocked = setIsAudioUnlocked;
            return () => {
                globalPlayerRef = null;
                globalSetAudioUnlocked = null;
            };
        }, [playerRef.current]);

        useEffect(() => {
            const handleUnlock = () => {
                console.log('[YouTubePlayer] Audio unlocked event received');
                setIsAudioUnlocked(true);
            };

            window.addEventListener('audio:unlocked', handleUnlock);
            return () => window.removeEventListener('audio:unlocked', handleUnlock);
        }, []);

        // Expose imperative methods
        useImperativeHandle(ref, () => ({
            seekTo: (seconds: number) => {
                playerRef.current?.seekTo(seconds, 'seconds');
            },
            getCurrentTime: () => {
                return playerRef.current?.getCurrentTime() || 0;
            },
            triggerPlay: () => {
                playerRef.current?.getInternalPlayer()?.playVideo();
            },
        }));

        const videoUrl = currentSong ? `https://www.youtube.com/watch?v=${currentSong.videoId}` : '';

        const handleReady = useCallback(() => {
            console.log('[YouTubePlayer] Player ready');
            setIsReady(true);
            // Update global ref when player is ready
            globalPlayerRef = playerRef.current;
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

        // Debug: Log when currentSong or isPlaying changes
        useEffect(() => {
            console.log('[YouTubePlayer] State:', {
                videoUrl,
                isPlaying,
                isReady,
                isAudioUnlocked,
                volume,
                currentSongId: currentSong?.videoId
            });
        }, [videoUrl, isPlaying, isReady, isAudioUnlocked, volume, currentSong]);

        // Don't render if no song
        if (!currentSong) {
            return null;
        }

        return (
            // Audio Player - positioned on-screen but visually hidden
            // Must be in viewport for browsers to allow audio playback
            <div
                className={`fixed ${className}`}
                style={{
                    bottom: 0,
                    right: 0,
                    width: 2,
                    height: 2,
                    opacity: 0.001,
                    pointerEvents: 'none',
                    zIndex: -1,
                    overflow: 'hidden'
                }}
            >
                <ReactPlayer
                    ref={playerRef}
                    url={videoUrl}
                    playing={isPlaying && isAudioUnlocked}
                    controls={false}
                    width="2px"
                    height="2px"
                    onReady={handleReady}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onError={handleError}
                    onBuffer={() => console.log('[YouTubePlayer] Buffering...')}
                    onBufferEnd={() => console.log('[YouTubePlayer] Buffer ended, playing')}
                    progressInterval={500}
                    volume={volume}
                    muted={false}
                    playsinline={true}
                    pip={false}
                    config={{
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
                    }}
                />
            </div>
        );
    }
);

YouTubePlayer.displayName = 'YouTubePlayer';
