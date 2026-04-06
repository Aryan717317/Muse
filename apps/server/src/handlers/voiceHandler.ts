import { Server, Socket } from 'socket.io';

// Track which users have voice enabled per room
const voiceEnabledUsers = new Map<string, Map<string, string>>(); // roomId -> Map<socketId, userName>

export function voiceHandler(io: Server, socket: Socket, rooms: Map<string, any>) {
    // Enable voice chat - notify other users in the room
    socket.on('voice:enable', () => {
        const roomId = (socket as any).roomId;
        if (!roomId) return;

        const room = rooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(socket.id);
        if (!participant) return;

        // Track this user as voice-enabled
        if (!voiceEnabledUsers.has(roomId)) {
            voiceEnabledUsers.set(roomId, new Map());
        }
        const roomVoiceUsers = voiceEnabledUsers.get(roomId)!;
        roomVoiceUsers.set(socket.id, participant.name);

        // Send current voice peers to the new voice user
        const existingPeers = Array.from(roomVoiceUsers.entries())
            .filter(([id]) => id !== socket.id)
            .map(([id, name]) => ({ id, name }));
        
        socket.emit('voice:peers', { peers: existingPeers });

        // Notify others that this user enabled voice
        socket.to(roomId).emit('voice:peer_enabled', {
            peerId: socket.id,
            peerName: participant.name,
        });

        console.log(`[Voice] ${participant.name} enabled voice in room ${roomId}`);
    });

    // Disable voice chat
    socket.on('voice:disable', () => {
        const roomId = (socket as any).roomId;
        if (!roomId) return;

        const roomVoiceUsers = voiceEnabledUsers.get(roomId);
        if (roomVoiceUsers) {
            roomVoiceUsers.delete(socket.id);
            if (roomVoiceUsers.size === 0) {
                voiceEnabledUsers.delete(roomId);
            }
        }

        // Notify others
        socket.to(roomId).emit('voice:peer_disabled', { peerId: socket.id });
        console.log(`[Voice] User ${socket.id} disabled voice in room ${roomId}`);
    });

    // Relay WebRTC offer to target peer
    socket.on('voice:offer', ({ targetId, offer }) => {
        io.to(targetId).emit('voice:offer', {
            fromId: socket.id,
            offer,
        });
    });

    // Relay WebRTC answer to target peer
    socket.on('voice:answer', ({ targetId, answer }) => {
        io.to(targetId).emit('voice:answer', {
            fromId: socket.id,
            answer,
        });
    });

    // Relay ICE candidate to target peer
    socket.on('voice:ice-candidate', ({ targetId, candidate }) => {
        io.to(targetId).emit('voice:ice-candidate', {
            fromId: socket.id,
            candidate,
        });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        const roomId = (socket as any).roomId;
        if (!roomId) return;

        const roomVoiceUsers = voiceEnabledUsers.get(roomId);
        if (roomVoiceUsers) {
            roomVoiceUsers.delete(socket.id);
            if (roomVoiceUsers.size === 0) {
                voiceEnabledUsers.delete(roomId);
            }
        }

        // Notify others (room:participant_left is already emitted by roomHandler)
        socket.to(roomId).emit('voice:peer_disabled', { peerId: socket.id });
    });
}
