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
    /** Whether to show as ambient background (blurred, low opacity) */
    ambient?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Called when video ends */
    onEnded?: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
    ({ ambient = false, className = '', onEnded }, ref) => {
        const playerRef = useRef<any>(null);
        const { currentSong, isPlaying, isHost, collaborativeControls, volume } = useRoomStore();
        const { play, pause, skip } = useSocket();
        const [isReady, setIsReady] = useState(false);
        const { handleSyncRequest } = usePlayerSync(playerRef, isReady);

        const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

        useEffect(() => {
            // No initial check from storage - mandatory interaction required per session load


            const handleUnlock = () => {
                console.log('[YouTubePlayer] Audio unlocked event received');
                setIsAudioUnlocked(true);
                // Force a re-sync or play attempt
                if (isPlaying) {
                    playerRef.current?.getInternalPlayer()?.playVideo();
                }
            };

            window.addEventListener('audio:unlocked', handleUnlock);
            return () => window.removeEventListener('audio:unlocked', handleUnlock);
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

        // Debug: Log when currentSong or isPlaying changes
        useEffect(() => {
            console.log('[YouTubePlayer] State:', {
                videoUrl,
                isPlaying,
                isReady,
                volume,
                currentSongId: currentSong?.videoId
            });
        }, [videoUrl, isPlaying, isReady, volume, currentSong]);

        if (!currentSong) {
            return null;
        }

        return (
            // Audio Player - positioned offscreen with minimum size for audio to work
            // Browsers throttle/mute audio for tiny (1x1) players, need at least 200x200
            <div
                className={`fixed pointer-events-none ${className}`}
                style={{
                    left: '-9999px',
                    top: '-9999px',
                    width: 200,
                    height: 200,
                    overflow: 'hidden'
                }}
            >
                <ReactPlayer
                    ref={playerRef}
                    url={videoUrl}
                    playing={isPlaying && isAudioUnlocked}
                    controls={false}
                    width="200px"
                    height="200px"
                    onReady={handleReady}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onError={handleError}
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
