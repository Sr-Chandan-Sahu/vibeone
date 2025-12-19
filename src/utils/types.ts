export interface User {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  sender: User;
  text: string;
  timestamp: number;
  type: 'text' | 'system' | 'ai';
  isStreaming?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  addedBy: string;
  duration?: string;
}

export interface MusicState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  queue: MusicTrack[];
  startedAt: number;
  pausedAt: number;
}

export interface RoomState {
  roomId: string;
  users: User[];
  currentTrack?: {
    title: string;
    artist: string;
    cover: string;
  };
}

export type ViewState = 'LANDING' | 'AUTH' | 'ROOM';
export type AuthMode = 'CREATE' | 'JOIN';
