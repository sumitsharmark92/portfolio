export interface Track {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationSec: number;
  author: string;
  addedBy: string;
  addedByAvatar?: string;
  votes?: number;
}

export interface RoomUser {
  id: string;
  socketId: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  sender: {
    id: string;
    nickname: string;
    avatar: string;
  };
  text: string;
  mediaUrl?: string | null;
  timestamp: string;
  isSystem?: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
}

export interface RoomState {
  roomId: string;
  users: RoomUser[];
  queue: Track[];
  currentTrack: Track | null;
  playback: PlaybackState;
  messages: ChatMessage[];
  voteSkips: string[];
}
