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
          host?: string;
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
  const pendingTrackRef = useRef<Track | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);

  // 1. Cross-tab Broadcast Channel synchronization
  useEffect(() => {
    if (typeof window === "undefined" || !roomId) return;

    try {
      const channel = new BroadcastChannel(`jamsync_room_${roomId}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === "SYNC_STATE") {
          if (payload.currentTrack) setCurrentTrack(payload.currentTrack);
          if (payload.queue) setQueue(payload.queue);
          if (typeof payload.isPlaying === "boolean") setIsPlaying(payload.isPlaying);
          if (payload.messages) setMessages(payload.messages);
        } else if (type === "PLAY") {
          setIsPlaying(true);
          if (playerRef.current) {
            if (typeof payload.time === "number") playerRef.current.seekTo(payload.time, true);
            playerRef.current.playVideo();
          }
        } else if (type === "PAUSE") {
          setIsPlaying(false);
          if (playerRef.current) playerRef.current.pauseVideo();
        } else if (type === "SEEK") {
          if (playerRef.current && typeof payload.time === "number") {
            playerRef.current.seekTo(payload.time, true);
            setCurrentTime(payload.time);
          }
        } else if (type === "TRACK_CHANGE") {
          setCurrentTrack(payload.track);
          setQueue(payload.queue || []);
          setIsPlaying(true);
          if (playerRef.current && payload.track) {
            playerRef.current.loadVideoById({ videoId: payload.track.videoId, startSeconds: 0 });
            playerRef.current.playVideo();
          }
        } else if (type === "CHAT") {
          setMessages((prev) => [...prev.slice(-99), payload.message]);
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported:", e);
    }
  }, [roomId]);

  // Helper to broadcast event to other tabs
  const broadcast = (type: string, payload: unknown) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type, payload });
      }
    } catch {}
  };

  // 2. Initialize Socket.io connection (works on localhost or persistent server, fails safely on serverless)
  useEffect(() => {
    let s: Socket | null = null;
    try {
      s = io({
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        timeout: 5000,
        autoConnect: true,
      });

      s.on("connect", () => {
        setIsConnected(true);
      });

      s.on("connect_error", () => {
        setIsConnected(false);
      });

      s.on("disconnect", () => {
        setIsConnected(false);
      });

      // Full room state sync from server
      s.on("room:state", (state: RoomState) => {
        setRoomId(state.roomId);
        setUsers(state.users);
        setQueue(state.queue);
        setCurrentTrack(state.currentTrack);
        setMessages(state.messages || []);
        setVoteSkips(state.voteSkips || []);

        const myUser = state.users.find((u) => u.id === s?.id) || null;
        if (myUser) setCurrentUser(myUser);

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

      s.on("room:user_joined", ({ users: updatedUsers }) => {
        setUsers(updatedUsers);
      });

      s.on("room:user_left", ({ users: updatedUsers }) => {
        setUsers(updatedUsers);
      });

      s.on("room:users_updated", (updatedUsers: RoomUser[]) => {
        setUsers(updatedUsers);
      });

      s.on("music:sync_play", ({ currentTime: targetTime, updatedAt }) => {
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

      s.on("music:sync_pause", ({ currentTime: targetTime }) => {
        setIsPlaying(false);
        if (playerRef.current) {
          playerRef.current.pauseVideo();
          if (typeof targetTime === "number") {
            playerRef.current.seekTo(targetTime, true);
          }
        }
      });

      s.on("music:sync_seek", ({ currentTime: targetTime }) => {
        setCurrentTime(targetTime);
        if (playerRef.current) {
          playerRef.current.seekTo(targetTime, true);
        }
      });

      s.on("music:sync_track", ({ currentTrack: newTrack, queue: newQueue }) => {
        setCurrentTrack(newTrack);
        setQueue(newQueue);
        setIsPlaying(true);
        if (playerRef.current && newTrack) {
          playerRef.current.loadVideoById({
            videoId: newTrack.videoId,
            startSeconds: 0,
          });
          playerRef.current.playVideo();
        }
      });

      s.on("queue:sync", ({ queue: newQueue }) => {
        setQueue(newQueue);
      });

      s.on("queue:vote_update", ({ voteSkips: updatedVotes }) => {
        setVoteSkips(updatedVotes);
      });

      s.on("chat:message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev.slice(-99), msg]);
      });

      setSocket(s);
    } catch (e) {
      console.warn("Socket.io init skipped:", e);
    }

    return () => {
      s?.disconnect();
    };
  }, []);

  // 3. Load YouTube iFrame API Script
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
            host: "https://www.youtube-nocookie.com",
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
                if (pendingTrackRef.current) {
                  event.target.loadVideoById({
                    videoId: pendingTrackRef.current.videoId,
                    startSeconds: 0,
                  });
                  event.target.playVideo();
                  pendingTrackRef.current = null;
                }
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.ENDED) {
                  // Track finished naturally -> advance
                  nextTrack();
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
  }, [volume]);

  // 4. Periodic Progress Bar Poller (500ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof cur === "number" && !isNaN(cur)) setCurrentTime(cur);
          if (typeof dur === "number" && dur > 0 && !isNaN(dur)) setDuration(dur);
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Actions
  const joinRoom = useCallback(
    (targetRoomId: string, nickname?: string, avatar?: string) => {
      if (!targetRoomId) return;
      const cleanId = targetRoomId.trim().toUpperCase();
      setRoomId(cleanId);

      const savedNick =
        nickname ||
        (typeof window !== "undefined" && localStorage.getItem("jamsync_nickname")) ||
        `Viber_${Math.floor(100 + Math.random() * 900)}`;
      const savedAvatar =
        avatar ||
        (typeof window !== "undefined" && localStorage.getItem("jamsync_avatar")) ||
        "🎧";

      if (typeof window !== "undefined") {
        localStorage.setItem("jamsync_nickname", savedNick);
        localStorage.setItem("jamsync_avatar", savedAvatar);
      }

      const localUser: RoomUser = {
        id: socket?.id || `user_${Date.now()}`,
        socketId: socket?.id || `sock_${Date.now()}`,
        nickname: savedNick,
        avatar: savedAvatar,
        isHost: true,
        joinedAt: Date.now(),
      };

      setCurrentUser(localUser);
      setUsers([localUser]);

      const welcomeMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: { id: "system", nickname: "JamSync System", avatar: "⚡" },
        text: `Welcome to JamSync Room #${cleanId}! Search any song, paste a link, and start playing together.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSystem: true,
      };
      setMessages([welcomeMsg]);

      // If socket is connected to backend, join room
      if (socket && socket.connected) {
        socket.emit("room:join", {
          roomId: cleanId,
          nickname: savedNick,
          avatar: savedAvatar,
        });
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (socket && socket.connected && roomId) {
      socket.emit("room:leave", { roomId });
    }
    setRoomId(null);
    setCurrentTrack(null);
    setQueue([]);
    setMessages([]);
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, [socket, roomId]);

  const playMusic = useCallback(() => {
    setIsPlaying(true);
    const cur = playerRef.current ? playerRef.current.getCurrentTime() : currentTime;

    if (playerRef.current) {
      playerRef.current.playVideo();
    }

    if (socket && socket.connected && roomId) {
      socket.emit("music:play", { currentTime: cur });
    }

    broadcast("PLAY", { time: cur });
  }, [socket, roomId, currentTime]);

  const pauseMusic = useCallback(() => {
    setIsPlaying(false);
    const cur = playerRef.current ? playerRef.current.getCurrentTime() : currentTime;

    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }

    if (socket && socket.connected && roomId) {
      socket.emit("music:pause", { currentTime: cur });
    }

    broadcast("PAUSE", {});
  }, [socket, roomId, currentTime]);

  const seekMusic = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
      }
      if (socket && socket.connected && roomId) {
        socket.emit("music:seek", { time });
      }
      broadcast("SEEK", { time });
    },
    [socket, roomId]
  );

  const nextTrack = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length > 0) {
        const [next, ...rest] = prevQueue;
        setCurrentTrack(next);
        setIsPlaying(true);

        if (playerRef.current) {
          playerRef.current.loadVideoById({ videoId: next.videoId, startSeconds: 0 });
          playerRef.current.playVideo();
        } else {
          pendingTrackRef.current = next;
        }

        broadcast("TRACK_CHANGE", { track: next, queue: rest });

        if (socket && socket.connected && roomId) {
          socket.emit("music:next");
        }
        return rest;
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
        broadcast("TRACK_CHANGE", { track: null, queue: [] });
        return [];
      }
    });
  }, [socket, roomId]);

  const addToQueue = useCallback(
    (track: Track, playNow = false) => {
      if (playNow || !currentTrackRef.current) {
        setCurrentTrack(track);
        setIsPlaying(true);

        if (playerRef.current) {
          playerRef.current.loadVideoById({ videoId: track.videoId, startSeconds: 0 });
          playerRef.current.playVideo();
        } else {
          pendingTrackRef.current = track;
        }

        broadcast("TRACK_CHANGE", { track, queue });
      } else {
        setQueue((prev) => {
          const updated = [...prev, track];
          broadcast("SYNC_STATE", { queue: updated });
          return updated;
        });
      }

      if (socket && socket.connected && roomId) {
        socket.emit("queue:add", { track, playNow });
      }
    },
    [socket, roomId, queue]
  );

  const removeFromQueue = useCallback(
    (trackId: string) => {
      setQueue((prev) => {
        const updated = prev.filter((t) => t.id !== trackId);
        broadcast("SYNC_STATE", { queue: updated });
        return updated;
      });

      if (socket && socket.connected && roomId) {
        socket.emit("queue:remove", { trackId });
      }
    },
    [socket, roomId]
  );

  const reorderQueue = useCallback(
    (newQueue: Track[]) => {
      setQueue(newQueue);
      broadcast("SYNC_STATE", { queue: newQueue });

      if (socket && socket.connected && roomId) {
        socket.emit("queue:reorder", { newQueue });
      }
    },
    [socket, roomId]
  );

  const voteSkip = useCallback(() => {
    if (socket && socket.connected && roomId) {
      socket.emit("queue:vote_skip");
    } else {
      nextTrack();
    }
  }, [socket, roomId, nextTrack]);

  const sendChatMessage = useCallback(
    (text: string, mediaUrl?: string) => {
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: {
          id: currentUser?.id || "anon",
          nickname: currentUser?.nickname || "Listener",
          avatar: currentUser?.avatar || "🎧",
        },
        text: text.slice(0, 500),
        mediaUrl: mediaUrl || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev.slice(-99), newMsg]);
      broadcast("CHAT", { message: newMsg });

      if (socket && socket.connected && roomId) {
        socket.emit("chat:send", { text, mediaUrl });
      }
    },
    [socket, roomId, currentUser]
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
      if (typeof window !== "undefined") {
        localStorage.setItem("jamsync_nickname", nickname);
        localStorage.setItem("jamsync_avatar", avatar);
      }
      if (currentUser) {
        const updated = { ...currentUser, nickname, avatar };
        setCurrentUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
      }
      if (socket && socket.connected && roomId) {
        socket.emit("user:update", { nickname, avatar });
      }
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
        Persistent Background YouTube iFrame Container
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
