import { create } from 'zustand';

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

interface VoicePeer {
    id: string;
    name: string;
}

interface RoomState {
    // Connection state
    isConnected: boolean;
    isJoining: boolean;
    error: string | null;

    // Room info
    roomId: string | null;
    hostId: string | null;
    isHost: boolean;
    participants: Participant[];
    collaborativeControls: boolean;

    // Playback state
    currentSong: Song | null;
    queue: Song[];
    isPlaying: boolean;
    seekTime: number;

    // Voice chat state
    voiceEnabled: boolean;
    isMuted: boolean;
    voicePeers: VoicePeer[];

    // Theme
    themeColor: string;
    setThemeColor: (color: string) => void;

    // Actions
    setConnected: (connected: boolean) => void;
    setJoining: (joining: boolean) => void;
    setError: (error: string | null) => void;
    setRoomState: (state: Partial<RoomState>) => void;
    setPlaybackState: (isPlaying: boolean, seekTime: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setQueue: (queue: Song[]) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (participantId: string) => void;
    setCollaborativeControls: (enabled: boolean) => void;
    reset: () => void;
    
    // Voice chat actions
    setVoiceEnabled: (enabled: boolean) => void;
    setMuted: (muted: boolean) => void;
    addVoicePeer: (id: string, name: string) => void;
    removeVoicePeer: (id: string) => void;
    clearVoicePeers: () => void;
    
    // UI State
    isSearchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
    volume: number;
    setVolume: (volume: number) => void;
}

const initialState = {
    isConnected: false,
    isJoining: false,
    error: null,
    roomId: null,
    hostId: null,
    isHost: false,
    participants: [],
    collaborativeControls: true,
    currentSong: null,
    queue: [],
    isPlaying: false,
    seekTime: 0,
    voiceEnabled: false,
    isMuted: false,
    voicePeers: [],
    themeColor: 'rgba(255, 255, 255, 0.15)', // Neutral default
    isSearchOpen: false,
    volume: 1, // Default 100%
};

export const useRoomStore = create<RoomState>((set) => ({
    ...initialState,

    setSearchOpen: (open) => set({ isSearchOpen: open }),
    setVolume: (volume) => set({ volume }),

    setConnected: (connected) => set({ isConnected: connected }),

    setJoining: (joining) => set({ isJoining: joining }),

    setError: (error) => set({ error }),

    setRoomState: (state) => set((prev) => ({ ...prev, ...state })),

    setPlaybackState: (isPlaying, seekTime) => set({ isPlaying, seekTime }),

    setCurrentSong: (song) => set({ currentSong: song }),

    setQueue: (queue) => set({ queue }),

    addParticipant: (participant) => set((state) => ({
        participants: [...state.participants, participant],
    })),

    removeParticipant: (participantId) => set((state) => ({
        participants: state.participants.filter((p) => p.id !== participantId),
    })),

    setCollaborativeControls: (enabled) => set({ collaborativeControls: enabled }),

    setThemeColor: (color) => set({ themeColor: color }),

    // Voice chat actions
    setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
    
    setMuted: (muted) => set({ isMuted: muted }),
    
    addVoicePeer: (id, name) => set((state) => ({
        voicePeers: state.voicePeers.some(p => p.id === id) 
            ? state.voicePeers 
            : [...state.voicePeers, { id, name }],
    })),
    
    removeVoicePeer: (id) => set((state) => ({
        voicePeers: state.voicePeers.filter(p => p.id !== id),
    })),
    
    clearVoicePeers: () => set({ voicePeers: [] }),

    reset: () => set(initialState),
}));
