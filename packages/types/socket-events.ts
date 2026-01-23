// Shared TypeScript interfaces for Socket.io events

export interface RoomState {
  roomId: string;
  hostId: string;
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  seekTime: number;
  collaborativeControls: boolean;
  participants: Participant[];
}

export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  addedBy: string;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

// Client -> Server Events
export interface ClientToServerEvents {
  'room:create': (data: { userName: string }) => void;
  'room:join': (data: { roomId: string; userName: string }) => void;
  'room:leave': () => void;
  
  'playback:play': () => void;
  'playback:pause': () => void;
  'playback:seek': (data: { time: number }) => void;
  'playback:sync': (data: { currentTime: number }) => void;
  
  'queue:add': (data: { song: Omit<Song, 'id' | 'addedBy'> }) => void;
  'queue:remove': (data: { songId: string }) => void;
  'queue:reorder': (data: { fromIndex: number; toIndex: number }) => void;
  'queue:skip': () => void;
  
  'controls:toggle': (data: { enabled: boolean }) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; roomState: RoomState }) => void;
  'room:joined': (data: { roomState: RoomState }) => void;
  'room:error': (data: { message: string }) => void;
  'room:participant_joined': (data: { participant: Participant }) => void;
  'room:participant_left': (data: { participantId: string }) => void;
  
  'playback:state': (data: { isPlaying: boolean; seekTime: number }) => void;
  'playback:sync_request': (data: { hostTime: number; timestamp: number }) => void;
  'playback:song_changed': (data: { song: Song | null }) => void;
  
  'queue:updated': (data: { queue: Song[] }) => void;
  
  'controls:updated': (data: { collaborativeControls: boolean }) => void;
}

// Inter-Server Events (for scaling)
export interface InterServerEvents {
  ping: () => void;
}

// Socket Data
export interface SocketData {
  roomId: string;
  participantId: string;
  isHost: boolean;
}
