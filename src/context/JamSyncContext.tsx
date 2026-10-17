"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { Track, RoomUser, ChatMessage, RoomState } from "@/types/jamsync";

interface JamSyncContextType {
  socket: Socket | null;
  roomId: string | null;
  currentUser: RoomUser | null;
  users: RoomUser[];
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  messages: ChatMessage[];
  voteSkips: string[];
  isConnected: boolean;
  isPlayerReady: boolean;
  activePanel: "player" | "queue" | "search" | "chat" | "users";
  setActivePanel: (panel: "player" | "queue" | "search" | "chat" | "users") => void;
  joinRoom: (roomId: string, nickname?: string, avatar?: string) => void;
  leaveRoom: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
  seekMusic: (time: number) => void;
  nextTrack: () => void;
  addToQueue: (track: Track, playNow?: boolean) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (newQueue: Track[]) => void;
  voteSkip: () => void;
  sendChatMessage: (text: string, mediaUrl?: string) => void;
  setVolumeLevel: (val: number) => void;
  toggleMute: () => void;
  updateUser: (nickname: string, avatar: string) => void;
}

const JamSyncContext = createContext<JamSyncContextType | null>(null);

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number } | string) => void;
  cueVideoById: (options: { videoId: string; startSeconds?: number } | string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
}

export const JamSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voteSkips, setVoteSkips] = useState<string[]>([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [activePanel, setActivePanel] = useState<"player" | "queue" | "search" | "chat" | "users">("player");

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;

  // 1. Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io({
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Full room state sync from server
    newSocket.on("room:state", (state: RoomState) => {
      setRoomId(state.roomId);
      setUsers(state.users);
      setQueue(state.queue);
      setCurrentTrack(state.currentTrack);
      setMessages(state.messages || []);
      setVoteSkips(state.voteSkips || []);

      const myUser = state.users.find((u) => u.id === newSocket.id) || null;
      if (myUser) setCurrentUser(myUser);

      // Align playback state with calculated drift
      if (state.currentTrack) {
        let targetTime = state.playback.currentTime;
        if (state.playback.isPlaying) {
          const elapsed = (Date.now() - state.playback.updatedAt) / 1000;
          targetTime += elapsed;
        }

        if (playerRef.current) {
          playerRef.current.loadVideoById({
            videoId: state.currentTrack.videoId,
            startSeconds: Math.max(0, targetTime),
          });
          if (state.playback.isPlaying) {
            playerRef.current.playVideo();
          } else {
            playerRef.current.pauseVideo();
          }
        }
      }
      setIsPlaying(state.playback.isPlaying);
      setCurrentTime(state.playback.currentTime);
    });

    // User updates
    newSocket.on("room:user_joined", ({ users: updatedUsers }) => {
      setUsers(updatedUsers);
    });

    newSocket.on("room:user_left", ({ users: updatedUsers }) => {
      setUsers(updatedUsers);
    });

    newSocket.on("room:users_updated", (updatedUsers: RoomUser[]) => {
      setUsers(updatedUsers);
    });

    // Real-Time Playback events
    newSocket.on("music:sync_play", ({ currentTime: targetTime, updatedAt }) => {
      setIsPlaying(true);
      if (playerRef.current) {
        const drift = (Date.now() - updatedAt) / 1000;
        const exactTime = targetTime + drift;
        const currentLocal = playerRef.current.getCurrentTime();
        if (Math.abs(currentLocal - exactTime) > 1.5) {
          playerRef.current.seekTo(exactTime, true);
        }
        playerRef.current.playVideo();
      }
    });

    newSocket.on("music:sync_pause", ({ currentTime: targetTime }) => {
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.pauseVideo();
        if (typeof targetTime === "number") {
          playerRef.current.seekTo(targetTime, true);
        }
      }
    });

    newSocket.on("music:sync_seek", ({ time, isPlaying: shouldPlay }) => {
      setCurrentTime(time);
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
        if (shouldPlay) playerRef.current.playVideo();
        else playerRef.current.pauseVideo();
      }
    });

    newSocket.on("music:sync_track", ({ currentTrack: newTrack, queue: newQueue, playback }) => {
      setCurrentTrack(newTrack);
      setQueue(newQueue);
      setIsPlaying(playback ? playback.isPlaying : true);
      setVoteSkips([]);

      if (newTrack && playerRef.current) {
        playerRef.current.loadVideoById({
          videoId: newTrack.videoId,
          startSeconds: 0,
        });
        playerRef.current.playVideo();
      } else if (!newTrack && playerRef.current) {
        playerRef.current.pauseVideo();
      }
    });

    newSocket.on("queue:updated", ({ queue: newQueue, currentTrack: activeTrack }) => {
      setQueue(newQueue);
      if (activeTrack !== undefined) setCurrentTrack(activeTrack);
    });

    newSocket.on("queue:skip_progress", () => {
      // Progress updated
    });

    newSocket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Load YouTube iFrame API Script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        try {
          playerRef.current = new window.YT.Player("jamsync-persistent-player", {
            height: "100%",
            width: "100%",
            videoId: "",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: (event) => {
                setIsPlayerReady(true);
                event.target.setVolume(volume);
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.ENDED) {
                  // Notify server track finished naturally
                  if (socket && roomId) {
                    socket.emit("music:next");
                  }
                } else if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  if (playerRef.current) {
                    setDuration(playerRef.current.getDuration() || 0);
                  }
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                }
              },
            },
          });
        } catch (e) {
          console.error("Error creating YouTube player:", e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [socket, roomId, volume]);

  // 3. Periodic Progress Bar Poller (500ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof cur === "number") setCurrentTime(cur);
          if (typeof dur === "number" && dur > 0) setDuration(dur);
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Actions
  const joinRoom = useCallback(
    (targetRoomId: string, nickname?: string, avatar?: string) => {
      if (!socket || !targetRoomId) return;
      setRoomId(targetRoomId);

      const savedNick = nickname || localStorage.getItem("jamsync_nickname") || `Viber_${Math.floor(100 + Math.random() * 900)}`;
      const savedAvatar = avatar || localStorage.getItem("jamsync_avatar") || "🎧";

      localStorage.setItem("jamsync_nickname", savedNick);
      localStorage.setItem("jamsync_avatar", savedAvatar);

      socket.emit("room:join", {
        roomId: targetRoomId,
        nickname: savedNick,
        avatar: savedAvatar,
      });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.disconnect();
      socket.connect();
      setRoomId(null);
      setCurrentTrack(null);
      setQueue([]);
      setMessages([]);
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    }
  }, [socket, roomId]);

  const playMusic = useCallback(() => {
    if (!socket || !roomId) return;
    const cur = playerRef.current ? playerRef.current.getCurrentTime() : currentTime;
    socket.emit("music:play", { currentTime: cur });
  }, [socket, roomId, currentTime]);

  const pauseMusic = useCallback(() => {
    if (!socket || !roomId) return;
    const cur = playerRef.current ? playerRef.current.getCurrentTime() : currentTime;
    socket.emit("music:pause", { currentTime: cur });
  }, [socket, roomId, currentTime]);

  const seekMusic = useCallback(
    (time: number) => {
      if (!socket || !roomId) return;
      setCurrentTime(time);
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
      }
      socket.emit("music:seek", { time });
    },
    [socket, roomId]
  );

  const nextTrack = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("music:next");
  }, [socket, roomId]);

  const addToQueue = useCallback(
    (track: Track, playNow = false) => {
      if (!socket || !roomId) return;
      socket.emit("queue:add", { track, playNow });
    },
    [socket, roomId]
  );

  const removeFromQueue = useCallback(
    (trackId: string) => {
      if (!socket || !roomId) return;
      socket.emit("queue:remove", { trackId });
    },
    [socket, roomId]
  );

  const reorderQueue = useCallback(
    (newQueue: Track[]) => {
      if (!socket || !roomId) return;
      setQueue(newQueue);
      socket.emit("queue:reorder", { newQueue });
    },
    [socket, roomId]
  );

  const voteSkip = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit("queue:vote_skip");
  }, [socket, roomId]);

  const sendChatMessage = useCallback(
    (text: string, mediaUrl?: string) => {
      if (!socket || !roomId) return;
      socket.emit("chat:send", { text, mediaUrl });
    },
    [socket, roomId]
  );

  const setVolumeLevel = useCallback((val: number) => {
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  }, [isMuted]);

  const updateUser = useCallback(
    (nickname: string, avatar: string) => {
      if (!socket || !roomId) return;
      localStorage.setItem("jamsync_nickname", nickname);
      localStorage.setItem("jamsync_avatar", avatar);
      if (currentUser) {
        setCurrentUser({ ...currentUser, nickname, avatar });
      }
      socket.emit("user:update", { nickname, avatar });
    },
    [socket, roomId, currentUser]
  );

  return (
    <JamSyncContext.Provider
      value={{
        socket,
        roomId,
        currentUser,
        users,
        currentTrack,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        messages,
        voteSkips,
        isConnected,
        isPlayerReady,
        activePanel,
        setActivePanel,
        joinRoom,
        leaveRoom,
        playMusic,
        pauseMusic,
        seekMusic,
        nextTrack,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        voteSkip,
        sendChatMessage,
        setVolumeLevel,
        toggleMute,
        updateUser,
      }}
    >
      {/* 
        Persistent Hidden / Background YouTube iFrame Container
        Guarantees uninterrupted audio playback across all tab switches and panel navigations!
      */}
      <div
        className="fixed -bottom-[9999px] -left-[9999px] w-[320px] h-[180px] pointer-events-none opacity-0 overflow-hidden"
        aria-hidden="true"
      >
        <div id="jamsync-persistent-player" />
      </div>

      {children}
    </JamSyncContext.Provider>
  );
};

export const useJamSync = () => {
  const context = useContext(JamSyncContext);
  if (!context) {
    throw new Error("useJamSync must be used within a JamSyncProvider");
  }
  return context;
};
