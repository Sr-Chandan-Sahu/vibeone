export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  roomId: string;
  sender: User;
  text: string;
  timestamp: number;
  type: 'text' | 'system' | 'ai';
  isStreaming?: boolean; // For AI streaming responses
}

export interface Room {
  id: string;
  name: string;
  createdAt: number;
  participants: User[]; // In a real app, this would be synced. Here we simulate.
}

export interface ChatState {
  user: User | null;
  currentRoom: Room | null;
  messages: Message[];
  isAiEnabled: boolean;
}

export interface MusicTrack {
  id: string; // YouTube Video ID
  title: string;
  addedBy: string;
  duration?: string;
  thumbnail?: string;
}

export interface MusicState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  queue: MusicTrack[];
  startedAt: number; // Timestamp when current track started playing (for sync)
  pausedAt: number; // Seek position when paused
}