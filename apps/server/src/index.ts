import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { roomHandler } from './handlers/roomHandler';
import { playbackHandler } from './handlers/playbackHandler';
import { redisHealthCheck, isRedisEnabled, redis } from './utils/redisClient';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
    const redisStatus = await redisHealthCheck();
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        redis: isRedisEnabled() ? (redisStatus ? 'connected' : 'error') : 'disabled'
    });
});

// Room state storage (in-memory for now, can be replaced with Redis)
export const rooms = new Map<string, RoomState>();

interface RoomState {
    roomId: string;
    hostId: string;
    currentSong: Song | null;
    queue: Song[];
    isPlaying: boolean;
    seekTime: number;
    collaborativeControls: boolean;
    participants: Map<string, Participant>;
}

interface Song {
    id: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    addedBy: string;
}

interface Participant {
    id: string;
    name: string;
    isHost: boolean;
    joinedAt: number;
}

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Register handlers
    roomHandler(io, socket, rooms);
    playbackHandler(io, socket, rooms);

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Find and remove from any room
        rooms.forEach((room, roomId) => {
            if (room.participants.has(socket.id)) {
                room.participants.delete(socket.id);

                // Notify other participants
                socket.to(roomId).emit('room:participant_left', { participantId: socket.id });

                // If host left, assign new host or delete room
                if (room.hostId === socket.id) {
                    const remainingParticipants = Array.from(room.participants.values());
                    if (remainingParticipants.length > 0) {
                        room.hostId = remainingParticipants[0].id;
                        remainingParticipants[0].isHost = true;
                        io.to(roomId).emit('room:host_changed', { newHostId: room.hostId });
                    } else {
                        rooms.delete(roomId);
                    }
                }
            }
        });
    });
});

// Health check ping every 30 seconds to keep connection alive
setInterval(() => {
    io.emit('ping');
}, 30000);

const PORT = process.env.PORT || 3001;

const server = httpServer.listen(PORT, () => {
    console.log(`🎵 Muse Server running on port ${PORT}`);
    if (isRedisEnabled()) {
        console.log('🔌 Redis enabled');
    } else {
        console.log('⚠️  Redis disabled (In-Memory Fallback)');
    }
});

// Graceful Shutdown
const gracefulShutdown = async () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');

    server.close(() => {
        console.log('HTTP server closed.');
    });

    if (redis) {
        // Redis client connection close if needed
    }

    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
