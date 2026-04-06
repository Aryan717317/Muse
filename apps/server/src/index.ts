import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// --- Types ---
interface RoomState {
    id: string;
    hostId: string;
    isPlaying: boolean;
    currentTrack: string | null;
    seekTime: number;
    lastUpdated: number;
    participants: string[];
}

// --- In-Memory State (Map) ---
const rooms = new Map<string, RoomState>();

io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // --- Handshake / Room Management ---

    socket.on('room:create', (callback) => {
        const roomId = uuidv4().slice(0, 6).toUpperCase(); // Short ID
        const newRoom: RoomState = {
            id: roomId,
            hostId: socket.id,
            isPlaying: false,
            currentTrack: null,
            seekTime: 0,
            lastUpdated: Date.now(),
            participants: [socket.id]
        };
        rooms.set(roomId, newRoom);

        socket.join(roomId);
        callback({ roomId, isHost: true });
        console.log(`Room created: ${roomId} by ${socket.id}`);
    });

    socket.on('room:join', (roomId: string, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            if (callback) callback({ error: 'Room not found' });
            return;
        }

        if (!room.participants.includes(socket.id)) {
            room.participants.push(socket.id);
        }
        socket.join(roomId);

        // Return current state for sync
        if (callback) {
            callback({
                success: true,
                isHost: room.hostId === socket.id,
                state: room
            });
        }

        // Notify others
        socket.to(roomId).emit('room:participant_joined', { userId: socket.id });
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // --- Playback Sync (Basic) ---

    socket.on('player:update', (data: { roomId: string, isPlaying: boolean, seekTime: number }) => {
        const room = rooms.get(data.roomId);
        if (!room) return;

        // Only host can control in MVP to prevent ping-pong update loops
        if (room.hostId !== socket.id) return; 

        // Throttle updates: avoid broadcasting more than once every 100ms
        // If state changed (play/pause), we update immediately
        const now = Date.now();
        if (room.isPlaying === data.isPlaying && (now - room.lastUpdated < 100)) {
            return;
        }

        room.isPlaying = data.isPlaying;
        room.seekTime = data.seekTime;
        room.lastUpdated = now;

        // Broadcast to everyone else in the room
        socket.to(data.roomId).emit('player:sync', {
            isPlaying: room.isPlaying,
            seekTime: room.seekTime,
            lastUpdated: room.lastUpdated
        });
    });

    socket.on('disconnecting', () => {
        // Clean up rooms the user was in to prevent memory leaks and infinite growth
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                const room = rooms.get(roomId);
                if (room) {
                    room.participants = room.participants.filter(id => id !== socket.id);
                    if (room.participants.length === 0) {
                        rooms.delete(roomId);
                    } else if (room.hostId === socket.id) {
                        // Reassign host to the next participant
                        room.hostId = room.participants[0];
                    }
                    socket.to(roomId).emit('room:participant_left', { userId: socket.id });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
