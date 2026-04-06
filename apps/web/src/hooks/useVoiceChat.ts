'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '@/store/useRoomStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// ICE servers for NAT traversal (using free public STUN servers)
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

interface PeerConnection {
    connection: RTCPeerConnection;
    stream?: MediaStream;
    audioElement?: HTMLAudioElement;
}

export function useVoiceChat() {
    const { 
        roomId, 
        voiceEnabled, 
        setVoiceEnabled, 
        isMuted, 
        setMuted,
        voicePeers,
        addVoicePeer,
        removeVoicePeer,
        clearVoicePeers,
    } = useRoomStore();
    
    const socketRef = useRef<Socket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Get socket (reuse existing or create)
    const getSocket = useCallback(() => {
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                autoConnect: true,
            });
        }
        return socketRef.current;
    }, []);

    // Create peer connection for a specific peer
    const createPeerConnection = useCallback((peerId: string, peerName: string) => {
        const socket = getSocket();
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local stream tracks to connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle incoming audio stream from peer
        pc.ontrack = (event) => {
            console.log(`[Voice] Received track from ${peerName}`);
            const [remoteStream] = event.streams;
            
            // Create audio element to play the stream
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.autoplay = true;
            (audio as any).playsInline = true; // Safari compatibility
            
            const peerData = peersRef.current.get(peerId);
            if (peerData) {
                peerData.stream = remoteStream;
                peerData.audioElement = audio;
            }
            
            // Update UI
            addVoicePeer(peerId, peerName);
        };

        // Send ICE candidates to peer
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice:ice-candidate', {
                    targetId: peerId,
                    candidate: event.candidate.toJSON(),
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[Voice] Connection state with ${peerName}:`, pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                closePeerConnection(peerId);
            }
        };

        peersRef.current.set(peerId, { connection: pc });
        return pc;
    }, [getSocket, addVoicePeer]);

    // Close peer connection
    const closePeerConnection = useCallback((peerId: string) => {
        const peerData = peersRef.current.get(peerId);
        if (peerData) {
            peerData.audioElement?.pause();
            peerData.stream?.getTracks().forEach(t => t.stop());
            peerData.connection.close();
            peersRef.current.delete(peerId);
            removeVoicePeer(peerId);
        }
    }, [removeVoicePeer]);

    // Enable voice chat
    const enableVoice = useCallback(async () => {
        if (voiceEnabled) return;
        
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            localStreamRef.current = stream;
            
            // Request wake lock to keep screen on during voice
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('[Voice] Wake lock acquired');
                } catch (e) {
                    console.warn('[Voice] Wake lock failed:', e);
                }
            }
            
            const socket = getSocket();
            socket.emit('voice:enable');
            setVoiceEnabled(true);
            console.log('[Voice] Enabled');
        } catch (error) {
            console.error('[Voice] Failed to enable:', error);
            throw error;
        }
    }, [voiceEnabled, getSocket, setVoiceEnabled]);

    // Disable voice chat
    const disableVoice = useCallback(() => {
        if (!voiceEnabled) return;
        
        // Stop local stream
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        
        // Close all peer connections
        peersRef.current.forEach((_, peerId) => closePeerConnection(peerId));
        peersRef.current.clear();
        clearVoicePeers();
        
        // Release wake lock
        wakeLockRef.current?.release();
        wakeLockRef.current = null;
        
        const socket = getSocket();
        socket.emit('voice:disable');
        setVoiceEnabled(false);
        console.log('[Voice] Disabled');
    }, [voiceEnabled, getSocket, closePeerConnection, clearVoicePeers, setVoiceEnabled]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted; // Toggle (currently muted → unmute)
                setMuted(!isMuted);
            }
        }
    }, [isMuted, setMuted]);

    // Setup socket listeners for WebRTC signaling
    useEffect(() => {
        if (!voiceEnabled) return;
        
        const socket = getSocket();

        // Receive list of existing voice peers
        const handlePeers = async ({ peers }: { peers: Array<{ id: string; name: string }> }) => {
            console.log('[Voice] Existing peers:', peers);
            
            // Create offers to connect to each peer
            for (const peer of peers) {
                const pc = createPeerConnection(peer.id, peer.name);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('voice:offer', { targetId: peer.id, offer });
            }
        };

        // New peer enabled voice
        const handlePeerEnabled = async ({ peerId, peerName }: { peerId: string; peerName: string }) => {
            console.log(`[Voice] Peer ${peerName} enabled voice`);
            // Wait for them to send offer (they are the newcomer)
        };

        // Peer disabled voice
        const handlePeerDisabled = ({ peerId }: { peerId: string }) => {
            console.log(`[Voice] Peer ${peerId} disabled voice`);
            closePeerConnection(peerId);
        };

        // Receive offer from peer
        const handleOffer = async ({ fromId, offer }: { fromId: string; offer: RTCSessionDescriptionInit }) => {
            console.log(`[Voice] Received offer from ${fromId}`);
            const pc = createPeerConnection(fromId, `Peer-${fromId.slice(0, 4)}`);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('voice:answer', { targetId: fromId, answer });
        };

        // Receive answer from peer
        const handleAnswer = async ({ fromId, answer }: { fromId: string; answer: RTCSessionDescriptionInit }) => {
            console.log(`[Voice] Received answer from ${fromId}`);
            const peerData = peersRef.current.get(fromId);
            if (peerData) {
                await peerData.connection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        // Receive ICE candidate from peer
        const handleIceCandidate = async ({ fromId, candidate }: { fromId: string; candidate: RTCIceCandidateInit }) => {
            const peerData = peersRef.current.get(fromId);
            if (peerData && candidate) {
                await peerData.connection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        };

        socket.on('voice:peers', handlePeers);
        socket.on('voice:peer_enabled', handlePeerEnabled);
        socket.on('voice:peer_disabled', handlePeerDisabled);
        socket.on('voice:offer', handleOffer);
        socket.on('voice:answer', handleAnswer);
        socket.on('voice:ice-candidate', handleIceCandidate);

        return () => {
            socket.off('voice:peers', handlePeers);
            socket.off('voice:peer_enabled', handlePeerEnabled);
            socket.off('voice:peer_disabled', handlePeerDisabled);
            socket.off('voice:offer', handleOffer);
            socket.off('voice:answer', handleAnswer);
            socket.off('voice:ice-candidate', handleIceCandidate);
        };
    }, [voiceEnabled, getSocket, createPeerConnection, closePeerConnection]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (voiceEnabled) {
                disableVoice();
            }
        };
    }, []);

    return {
        voiceEnabled,
        isMuted,
        voicePeers,
        enableVoice,
        disableVoice,
        toggleMute,
    };
}
