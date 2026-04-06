import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { getCurrentPlaybackTime } from '../index';

export function roomHandler(io: Server, socket: Socket, rooms: Map<string, any>) {
    // Create a new room
    socket.on('room:create', ({ userName }: { userName: string }) => {
        const roomId = nanoid(8);

        const participant = {
            id: socket.id,
            name: userName,
            isHost: true,
            joinedAt: Date.now(),
        };

        const roomState = {
            roomId,
            hostId: socket.id,
            currentSong: null,
            queue: [],
            isPlaying: false,
            seekTime: 0,
            collaborativeControls: true,
            participants: new Map([[socket.id, participant]]),
            // Initialize perfect sync fields
            lastActionTime: Date.now(),
            timestampAtLastAction: 0,
        };

        rooms.set(roomId, roomState);
        socket.join(roomId);

        // Store room info in socket data
        (socket as any).roomId = roomId;
        (socket as any).isHost = true;

        socket.emit('room:created', {
            roomId,
            roomState: {
                ...roomState,
                participants: [participant],
                currentSeconds: 0,        // Room just created, start at 0
                serverTime: Date.now(),
            },
        });

        console.log(`Room created: ${roomId} by ${userName}`);
    });

    // Join an existing room
    socket.on('room:join', ({ roomId, userName }: { roomId: string; userName: string }) => {
        const room = rooms.get(roomId);

        if (!room) {
            socket.emit('room:error', { message: 'Room not found' });
            return;
        }

        const participant = {
            id: socket.id,
            name: userName,
            isHost: false,
            joinedAt: Date.now(),
        };

        room.participants.set(socket.id, participant);
        socket.join(roomId);

        // Store room info in socket data
        (socket as any).roomId = roomId;
        (socket as any).isHost = false;

        // Perfect sync: Calculate current position for late joiner
        const currentSeconds = getCurrentPlaybackTime(room);

        // Send current room state to the joining user
        socket.emit('room:joined', {
            roomState: {
                ...room,
                participants: Array.from(room.participants.values()),
                currentSeconds,           // Calculated position RIGHT NOW
                serverTime: Date.now(),   // For latency compensation
            },
        });

        // Notify other participants
        socket.to(roomId).emit('room:participant_joined', { participant });

        console.log(`${userName} joined room: ${roomId}`);
    });

    // Leave room
    socket.on('room:leave', () => {
        const roomId = (socket as any).roomId;
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        room.participants.delete(socket.id);
        socket.leave(roomId);

        socket.to(roomId).emit('room:participant_left', { participantId: socket.id });

        // Clean up socket data
        delete (socket as any).roomId;
        delete (socket as any).isHost;
    });

    // Toggle collaborative controls
    socket.on('controls:toggle', ({ enabled }: { enabled: boolean }) => {
        const roomId = (socket as any).roomId;
        const isHost = (socket as any).isHost;

        if (!roomId || !isHost) return;

        const room = rooms.get(roomId);
        if (!room) return;

        room.collaborativeControls = enabled;
        io.to(roomId).emit('controls:updated', { collaborativeControls: enabled });
    });
}
