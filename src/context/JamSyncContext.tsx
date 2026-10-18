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
  isMiniPlayerOpen: boolean;
  setIsMiniPlayerOpen: (open: boolean) => void;
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
  needsAudioUnlock: boolean;
  unlockAudio: () => Promise<void>;
  audioErrorNotice: { title: string; reason: string } | null;
  dismissAudioErrorNotice: () => void;
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
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
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
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"player" | "queue" | "search" | "chat" | "users">("player");
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [audioErrorNotice, setAudioErrorNotice] = useState<{ title: string; reason: string } | null>(null);

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;
  const pendingTrackRef = useRef<Track | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const unlockAudio = useCallback(async () => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtxClass();
        }
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }
        // Micro silent tone to wake up browser audio pipeline (iOS/Safari)
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start(0);
        osc.stop(audioCtxRef.current.currentTime + 0.02);
      }
    } catch (e) {
      console.warn("[JamSync] Web Audio unlock error:", e);
    }

    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volumeRef.current);
        if (isPlayingRef.current) {
          playerRef.current.playVideo();
        }
        setIsMuted(false);
      } catch (e) {
        console.warn("[JamSync] YouTube player unMute error:", e);
      }
    }

    setNeedsAudioUnlock(false);
  }, []);

  const dismissAudioErrorNotice = useCallback(() => {
    setAudioErrorNotice(null);
  }, []);

  // Cross-tab Broadcast Channel synchronization
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
            playerRef.current.unMute();
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
            playerRef.current.loadVideoById(payload.track.videoId, 0);
            playerRef.current.unMute();
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

  const broadcast = (type: string, payload: unknown) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type, payload });
      }
    } catch {}
  };

  const socketRef = useRef<Socket | null>(null);
  socketRef.current = socket;

  // Socket.io initialization with WSS/HTTPS enforcement & resilient reconnection
  useEffect(() => {
    let s: Socket | null = null;
    try {
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const customEnvUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      
      let socketEndpoint: string | undefined = undefined;
      if (customEnvUrl) {
        // Enforce WSS/HTTPS on HTTPS origins to prevent mixed-content blocking
        socketEndpoint = isHttps
          ? customEnvUrl.replace(/^http:\/\//i, "https://").replace(/^ws:\/\//i, "wss://")
          : customEnvUrl;
      } else if (typeof window !== "undefined") {
        socketEndpoint = isHttps ? `https://${window.location.host}` : undefined;
      }

      s = io(socketEndpoint, {
        secure: isHttps,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 8000,
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
            targetTime += Math.max(0, elapsed);
          }

          if (playerRef.current) {
            playerRef.current.loadVideoById(state.currentTrack.videoId, Math.max(0, targetTime));
            if (state.playback.isPlaying) {
              try {
                playerRef.current.unMute();
                playerRef.current.setVolume(volumeRef.current);
                playerRef.current.playVideo();
              } catch (err) {
                console.warn("[JamSync] Autoplay blocked on room join; playing muted with unlock gate:", err);
                playerRef.current.mute();
                playerRef.current.playVideo();
                setNeedsAudioUnlock(true);
              }
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
          const exactTime = targetTime + Math.max(0, drift);
          const currentLocal = playerRef.current.getCurrentTime();
          if (Math.abs(currentLocal - exactTime) > 1.2) {
            playerRef.current.seekTo(exactTime, true);
          }
          try {
            playerRef.current.unMute();
            playerRef.current.setVolume(volumeRef.current);
            playerRef.current.playVideo();
          } catch (err) {
            console.warn("[JamSync] Play with audio blocked; playing muted:", err);
            playerRef.current.mute();
            playerRef.current.playVideo();
            setNeedsAudioUnlock(true);
          }
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
          playerRef.current.loadVideoById(newTrack.videoId, 0);
          try {
            playerRef.current.unMute();
            playerRef.current.setVolume(volumeRef.current);
            playerRef.current.playVideo();
          } catch (err) {
            console.warn("[JamSync] Autoplay blocked for new track; playing muted:", err);
            playerRef.current.mute();
            playerRef.current.playVideo();
            setNeedsAudioUnlock(true);
          }
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

      // YouTube restricted/playback error broadcast notification
      s.on("track:error_notice", (errNotice: { videoId: string; title: string; code: number; reason: string }) => {
        setAudioErrorNotice({
          title: errNotice.title,
          reason: errNotice.reason,
        });
      });

      // Authoritative sync state response (used for tab background throttling recovery)
      s.on("music:sync_state", ({ currentTime: targetTime, isPlaying: serverPlaying, updatedAt, serverTime }) => {
        if (!playerRef.current) return;

        const clientNow = Date.now();
        const rttLatency = serverTime ? Math.max(0, (clientNow - serverTime) / 2) / 1000 : 0;
        const elapsed = serverPlaying ? (clientNow - updatedAt) / 1000 + rttLatency : 0;
        const accurateTime = targetTime + elapsed;

        const currentLocal = playerRef.current.getCurrentTime();
        const drift = Math.abs(currentLocal - accurateTime);

        if (drift > 1.2) {
          console.log(`[JamSync] Reconciling background tab drift: local=${currentLocal.toFixed(2)}s, accurate=${accurateTime.toFixed(2)}s`);
          playerRef.current.seekTo(Math.max(0, accurateTime), true);
          setCurrentTime(accurateTime);
        }

        setIsPlaying(serverPlaying);
        if (serverPlaying) {
          const state = playerRef.current.getPlayerState();
          if (state !== 1 && state !== 3) {
            try {
              playerRef.current.unMute();
              playerRef.current.playVideo();
            } catch {
              playerRef.current.mute();
              playerRef.current.playVideo();
              setNeedsAudioUnlock(true);
            }
          }
        } else {
          playerRef.current.pauseVideo();
        }
      });

      setSocket(s);
    } catch (e) {
      console.warn("Socket.io init skipped:", e);
    }

    return () => {
      s?.disconnect();
    };
  }, []);

  // Tab Switching & Background Throttling Resilience:
  // Browser throttles timers when tabs are hidden. Listen to visibilitychange to instantly resync.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log("[JamSync] Tab visible again. Requesting fresh sync state...");
        if (socket && socket.connected) {
          socket.emit("sync:request");
        }
      }
    };

    const handleFocus = () => {
      if (socket && socket.connected) {
        socket.emit("sync:request");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [socket]);

  // Safe and Resilient YouTube iFrame API Script Loader
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load iframe script if not already present
    if (!document.getElementById("yt-iframe-script")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      const container = document.getElementById("jamsync-persistent-player");
      if (!container) return;

      if (window.YT && window.YT.Player && !playerRef.current) {
        try {
          const initialId = pendingTrackRef.current?.videoId || currentTrackRef.current?.videoId || "jfKfPfyJRdk";

          playerRef.current = new window.YT.Player("jamsync-persistent-player", {
            height: "100%",
            width: "100%",
            videoId: initialId,
            host: "https://www.youtube-nocookie.com",
            playerVars: {
              autoplay: 1,
              controls: 1,
              playsinline: 1,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: (event) => {
                setIsPlayerReady(true);
                try {
                  event.target.unMute();
                  event.target.setVolume(volumeRef.current);
                } catch {
                  event.target.mute();
                  setNeedsAudioUnlock(true);
                }

                if (pendingTrackRef.current) {
                  event.target.loadVideoById(pendingTrackRef.current.videoId, 0);
                  try {
                    event.target.unMute();
                    event.target.playVideo();
                  } catch {
                    event.target.mute();
                    event.target.playVideo();
                    setNeedsAudioUnlock(true);
                  }
                  pendingTrackRef.current = null;
                }
              },
              onStateChange: (event) => {
                if (!window.YT || !window.YT.PlayerState) return;
                if (event.data === window.YT.PlayerState.ENDED) {
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
              onError: (event) => {
                const code = event.data;
                console.warn("[JamSync] YouTube player error code:", code);
                const activeTrack = currentTrackRef.current;
                const isEmbedBlocked = code === 101 || code === 150;

                if (isEmbedBlocked) {
                  const reason = "The video owner has disabled third-party embedding (Error 101/150).";
                  setAudioErrorNotice({
                    title: activeTrack?.title || "Current Track",
                    reason,
                  });
                  // Emit to server so server coordinates single advance
                  if (socketRef.current && socketRef.current.connected && activeTrack) {
                    socketRef.current.emit("track:restricted", { videoId: activeTrack.videoId, code });
                  } else {
                    nextTrack();
                  }
                } else if (code === 100) {
                  setAudioErrorNotice({
                    title: activeTrack?.title || "Current Track",
                    reason: "Video not found or has been marked private (Error 100).",
                  });
                  if (socketRef.current && socketRef.current.connected && activeTrack) {
                    socketRef.current.emit("track:restricted", { videoId: activeTrack.videoId, code });
                  } else {
                    nextTrack();
                  }
                } else if (code === 2 || code === 5) {
                  setAudioErrorNotice({
                    title: activeTrack?.title || "Current Track",
                    reason: `Player error (Code ${code}). Please pick another track.`,
                  });
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

    // Safety fallback interval in case onYouTubeIframeAPIReady already fired
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        initPlayer();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [volume]);

  // Periodic Progress Poller (500ms)
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
        text: `Welcome to JamSync Room #${cleanId}! Search any song, paste a link, and listen together in sync.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSystem: true,
      };
      setMessages([welcomeMsg]);

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
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        playerRef.current.playVideo();
      } catch (e) {
        console.error("playVideo error:", e);
      }
    }

    if (socket && socket.connected && roomId) {
      socket.emit("music:play", { currentTime: cur });
    }

    broadcast("PLAY", { time: cur });
  }, [socket, roomId, currentTime, volume]);

  const pauseMusic = useCallback(() => {
    setIsPlaying(false);
    const cur = playerRef.current ? playerRef.current.getCurrentTime() : currentTime;

    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.error("pauseVideo error:", e);
      }
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
        try {
          playerRef.current.seekTo(time, true);
        } catch {}
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
          try {
            playerRef.current.loadVideoById(next.videoId, 0);
            playerRef.current.unMute();
            playerRef.current.playVideo();
          } catch {}
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
          try {
            playerRef.current.pauseVideo();
          } catch {}
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
          try {
            playerRef.current.loadVideoById(track.videoId, 0);
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
            playerRef.current.playVideo();
          } catch (e) {
            console.error("loadVideoById error:", e);
          }
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
    [socket, roomId, queue, volume]
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
      try {
        playerRef.current.setVolume(val);
        if (val > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {}
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      try {
        if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        } else {
          playerRef.current.mute();
          setIsMuted(true);
        }
      } catch {}
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

  // Media Session API for persistent lock-screen controls and tab retention
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.author || "JamSync Session",
        album: `Jam Room #${roomId || "Live"}`,
        artwork: [
          { src: currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" },
        ],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    try {
      navigator.mediaSession.setActionHandler("play", () => playMusic());
      navigator.mediaSession.setActionHandler("pause", () => pauseMusic());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") {
          seekMusic(details.seekTime);
        }
      });
    } catch {}

    return () => {
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("nexttrack", null);
          navigator.mediaSession.setActionHandler("seekto", null);
        } catch {}
      }
    };
  }, [currentTrack, isPlaying, roomId, playMusic, pauseMusic, nextTrack, seekMusic]);

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
        isMiniPlayerOpen,
        setIsMiniPlayerOpen,
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
        needsAudioUnlock,
        unlockAudio,
        audioErrorNotice,
        dismissAudioErrorNotice,
      }}
    >
      {/* Autoplay Gate: Unmute Audio Banner */}
      {needsAudioUnlock && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
          <button
            onClick={unlockAudio}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-purple-900/80 border border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-base">🔊</span>
            <span>Tap to Enable Room Audio</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase">Unmute Gate</span>
          </button>
        </div>
      )}

      {/* Embedding Restriction & Playback Error Notification Banner */}
      {audioErrorNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] w-11/12 max-w-md animate-in slide-in-from-top-4 duration-200">
          <div className="glass-panel p-4 rounded-2xl border border-rose-500/40 shadow-2xl bg-slate-950/95 backdrop-blur-xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 text-base">
              ⚠️
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {audioErrorNotice.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {audioErrorNotice.reason}
              </p>
            </div>
            <button
              onClick={dismissAudioErrorNotice}
              className="text-slate-400 hover:text-white p-1 text-xs"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* 
        Visible, Real-Size Floating YouTube Video Player
        Positioned in the bottom-right corner so browsers NEVER throttle or mute audio!
      */}
      <div
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black ${
          isMiniPlayerOpen
            ? "w-[280px] sm:w-[320px] h-[160px] sm:h-[180px] opacity-100 pointer-events-auto"
            : "w-[120px] h-[36px] bg-slate-900/90 pointer-events-auto flex items-center justify-between px-3"
        }`}
      >
        {isMiniPlayerOpen ? (
          <div className="relative w-full h-full">
            <div id="jamsync-persistent-player" className="w-full h-full" />
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
              <button
                onClick={() => setIsMiniPlayerOpen(false)}
                className="text-[10px] bg-black/75 hover:bg-black text-white/90 px-2 py-0.5 rounded-md border border-white/20 shadow backdrop-blur-sm"
                title="Minimize player"
              >
                ▼ Hide
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="text-[10px] font-mono text-purple-300 truncate">
              {isPlaying ? "▶ Playing" : "⏸ Paused"}
            </span>
            <button
              onClick={() => setIsMiniPlayerOpen(true)}
              className="text-[10px] text-white hover:text-purple-400 font-bold"
            >
              ▲ Show
            </button>
          </>
        )}
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
