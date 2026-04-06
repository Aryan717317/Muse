'use client';

import { useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '@/store/useRoomStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });
        setupListeners(socket);
    }
    return socket;
};

const setupListeners = (s: Socket) => {
    const store = useRoomStore.getState();

    s.on('connect', () => {
        console.log('Connected to server');
        store.setConnected(true);
    });

    s.on('disconnect', () => {
        console.log('Disconnected from server');
        store.setConnected(false);
    });

    // Room events
    s.on('room:created', ({ roomId, roomState }) => {
        store.setJoining(false);
        store.setRoomState({
            roomId,
            hostId: roomState.hostId,
            isHost: true,
            participants: roomState.participants,
            collaborativeControls: roomState.collaborativeControls,
            currentSong: roomState.currentSong,
            queue: roomState.queue,
            isPlaying: roomState.isPlaying,
            seekTime: roomState.seekTime,
        });
    });

    s.on('room:joined', ({ roomState }) => {
        store.setJoining(false);
        store.setRoomState({
            roomId: roomState.roomId,
            hostId: roomState.hostId,
            isHost: false,
            participants: roomState.participants,
            collaborativeControls: roomState.collaborativeControls,
            currentSong: roomState.currentSong,
            queue: roomState.queue,
            isPlaying: roomState.isPlaying,
            seekTime: roomState.seekTime,
        });
    });

    s.on('room:error', ({ message }) => {
        store.setJoining(false);
        store.setError(message);
    });

    s.on('room:participant_joined', ({ participant }) => {
        store.addParticipant(participant);
    });

    s.on('room:participant_left', ({ participantId }) => {
        store.removeParticipant(participantId);
    });

    // Playback events
    s.on('playback:state', ({ isPlaying, seekTime }) => {
        store.setPlaybackState(isPlaying, seekTime);
    });

    s.on('playback:song_changed', ({ song, seekTime, isPlaying }) => {
        store.setCurrentSong(song);
        if (typeof seekTime === 'number' && typeof isPlaying === 'boolean') {
            store.setPlaybackState(isPlaying, seekTime);
        }
    });

    // Host sync request (guest side handled by hook via custom event)
    s.on('playback:sync_request', ({ hostTime, timestamp }) => {
        // Dispatch event for usePlayerSync to consume
        window.dispatchEvent(new CustomEvent('playback:sync', {
            detail: { hostTime, timestamp }
        }));
    });

    // Queue events
    s.on('queue:updated', ({ queue }) => {
        store.setQueue(queue);
    });

    // Controls events
    s.on('controls:updated', ({ collaborativeControls }) => {
        store.setCollaborativeControls(collaborativeControls);
    });
};

export function useSocket() {
    // Ensure socket is initialized when hook is used
    const socketInstance = getSocket();

    const createRoom = useCallback((userName: string) => {
        const s = getSocket();
        useRoomStore.getState().setJoining(true); // Using Store Actions directly
        useRoomStore.getState().setError(null);
        s.emit('room:create', { userName });
    }, []);

    const joinRoom = useCallback((roomId: string, userName: string) => {
        const s = getSocket();
        useRoomStore.getState().setJoining(true);
        useRoomStore.getState().setError(null);
        s.emit('room:join', { roomId, userName });
    }, []);

    const leaveRoom = useCallback(() => {
        const s = getSocket();
        s.emit('room:leave');
        useRoomStore.getState().reset();
    }, []);

    const play = useCallback(() => {
        getSocket().emit('playback:play');
    }, []);

    const pause = useCallback(() => {
        getSocket().emit('playback:pause');
    }, []);

    const seek = useCallback((time: number) => {
        getSocket().emit('playback:seek', { time });
    }, []);

    const syncTime = useCallback((currentTime: number) => {
        getSocket().emit('playback:sync', { currentTime });
    }, []);

    const addToQueue = useCallback((song: { videoId: string; title: string; artist: string; thumbnail: string; duration: number }) => {
        getSocket().emit('queue:add', { song });
    }, []);

    const removeFromQueue = useCallback((songId: string) => {
        getSocket().emit('queue:remove', { songId });
    }, []);

    const skip = useCallback(() => {
        getSocket().emit('queue:skip');
    }, []);

    const toggleControls = useCallback((enabled: boolean) => {
        getSocket().emit('controls:toggle', { enabled });
    }, []);

    const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
        getSocket().emit('queue:reorder', { fromIndex, toIndex });
    }, []);

    return {
        socket: socketInstance,
        createRoom,
        joinRoom,
        leaveRoom,
        play,
        pause,
        seek,
        syncTime,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        skip,
        toggleControls,
    };
}
