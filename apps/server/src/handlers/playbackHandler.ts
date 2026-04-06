import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { getCurrentPlaybackTime } from '../index';

interface Song {
    id: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    addedBy: string;
}

export function playbackHandler(io: Server, socket: Socket, rooms: Map<string, any>) {
    // Play
    socket.on('playback:play', () => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        // Check permissions
        const isHost = socket.id === room.hostId;
        if (!isHost && !room.collaborativeControls) return;

        // Perfect sync: Update server state
        room.isPlaying = true;
        room.lastActionTime = Date.now();
        // Keep timestampAtLastAction (current position)
        
        const currentSeconds = getCurrentPlaybackTime(room);
        
        io.to(roomId).emit('playback:state', {
            isPlaying: true,
            seekTime: room.seekTime,
            currentSeconds,              // Calculated position
            serverTime: Date.now()       // For latency compensation
        });
    });

    // Pause
    socket.on('playback:pause', () => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const isHost = socket.id === room.hostId;
        if (!isHost && !room.collaborativeControls) return;

        // Perfect sync: Update position before pausing
        room.timestampAtLastAction = getCurrentPlaybackTime(room);
        room.isPlaying = false;
        room.lastActionTime = Date.now();

        io.to(roomId).emit('playback:state', {
            isPlaying: false,
            seekTime: room.seekTime,
            currentSeconds: room.timestampAtLastAction,
            serverTime: Date.now()
        });
    });

    // Seek
    socket.on('playback:seek', ({ time }: { time: number }) => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const isHost = socket.id === room.hostId;
        if (!isHost && !room.collaborativeControls) return;

        // Perfect sync: Update position and timestamp
        room.seekTime = time;
        room.timestampAtLastAction = time;
        room.lastActionTime = Date.now();

        io.to(roomId).emit('playback:state', {
            isPlaying: room.isPlaying,
            seekTime: time,
            currentSeconds: time,
            serverTime: Date.now()
        });
    });

    // Sync - Host broadcasts current time
    socket.on('playback:sync', ({ currentTime }: { currentTime: number }) => {
        const roomId = (socket as any).roomId;
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room || socket.id !== room.hostId) return;

        room.seekTime = currentTime;

        // Broadcast to all guests
        socket.to(roomId).emit('playback:sync_request', {
            hostTime: currentTime,
            timestamp: Date.now(),
        });
    });

    // Add to queue
    socket.on('queue:add', ({ song }: { song: Omit<Song, 'id' | 'addedBy'> }) => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const newSong: Song = {
            ...song,
            id: nanoid(12),
            addedBy: socket.id,
        };

        room.queue.push(newSong);

        // If no song is playing, start this one
        if (!room.currentSong) {
            room.currentSong = newSong;
            room.queue.shift();
            io.to(roomId).emit('playback:song_changed', {
                song: room.currentSong,
                seekTime: 0,
                isPlaying: true
            });
        }

        io.to(roomId).emit('queue:updated', { queue: room.queue });
    });

    // Remove from queue
    socket.on('queue:remove', ({ songId }: { songId: string }) => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const isHost = socket.id === room.hostId;
        if (!isHost && !room.collaborativeControls) return;

        room.queue = room.queue.filter((s: Song) => s.id !== songId);
        io.to(roomId).emit('queue:updated', { queue: room.queue });
    });

    // Skip to next song
    socket.on('queue:skip', () => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const isHost = socket.id === room.hostId;
        if (!isHost && !room.collaborativeControls) return;

        if (room.queue.length > 0) {
            room.currentSong = room.queue.shift();
            room.seekTime = 0;
            room.isPlaying = true;
        } else {
            room.currentSong = null;
            room.isPlaying = false;
        }

        io.to(roomId).emit('playback:song_changed', {
            song: room.currentSong,
            seekTime: room.seekTime,
            isPlaying: room.isPlaying
        });
        io.to(roomId).emit('queue:updated', { queue: room.queue });
        // Redundant state emit removed to prevent race
    });

    // Reorder queue
    socket.on('queue:reorder', ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
        const roomId = (socket as any).roomId;
        const room = rooms.get(roomId);

        if (!room) return;

        const isHost = socket.id === room.hostId;
        if (!isHost && !room.collaborativeControls) return;

        const [moved] = room.queue.splice(fromIndex, 1);
        room.queue.splice(toIndex, 0, moved);

        io.to(roomId).emit('queue:updated', { queue: room.queue });
    });
}
