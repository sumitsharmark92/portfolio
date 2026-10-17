const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const next = require("next");
const cors = require("cors");
const yts = require("yt-search");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// In-Memory Room Store
// roomId -> RoomState
const rooms = new Map();

/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} videoId
 * @property {string} title
 * @property {string} thumbnail
 * @property {string} duration
 * @property {number} durationSec
 * @property {string} author
 * @property {string} addedBy
 * @property {string} [addedByAvatar]
 */

/**
 * Get or initialize room state
 */
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      created: Date.now(),
      users: new Map(), // socketId -> User
      queue: [],        // Track[]
      currentTrack: null, // Track | null
      playback: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now(),
      },
      voteSkips: new Set(), // Set<userId>
      messages: [
        {
          id: `sys-${Date.now()}`,
          sender: { id: "system", nickname: "JamSync System", avatar: "⚡" },
          text: `Welcome to JamSync Room #${roomId}! Search any song, paste a link, or invite friends to listen together in sync.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true,
        },
      ],
    });
  }
  return rooms.get(roomId);
}

/**
 * Compute current accurate playback time with drift
 */
function getAccurateCurrentTime(playback) {
  if (!playback.isPlaying) {
    return playback.currentTime;
  }
  const elapsed = (Date.now() - playback.updatedAt) / 1000;
  return Math.max(0, playback.currentTime + elapsed);
}

/**
 * Extract YouTube Video ID from raw URL or ID string
 */
function extractVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  // Standard video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // URL matching
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);

  app.use(cors());
  app.use(express.json());

  // Search API (Zero YouTube API Key required, utilizes yt-search)
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q;
      if (!q || typeof q !== "string" || !q.trim()) {
        return res.json({ success: true, results: [] });
      }

      const trimmed = q.trim();

      // Check if user pasted direct YouTube link
      const directId = extractVideoId(trimmed);
      if (directId) {
        try {
          const detail = await yts({ videoId: directId });
          if (detail) {
            return res.json({
              success: true,
              results: [
                {
                  id: directId,
                  videoId: directId,
                  title: detail.title || "YouTube Video",
                  thumbnail: detail.thumbnail || `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
                  duration: detail.timestamp || "3:30",
                  durationSec: detail.seconds || 210,
                  author: detail.author ? detail.author.name : "YouTube Creator",
                  views: detail.views || 0,
                },
              ],
            });
          }
        } catch {
          // Fallback to default direct structure
          return res.json({
            success: true,
            results: [
              {
                id: directId,
                videoId: directId,
                title: `YouTube Video (${directId})`,
                thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
                duration: "Live / Stream",
                durationSec: 300,
                author: "Direct Link",
                views: 0,
              },
            ],
          });
        }
      }

      // Keyword Search
      const searchResult = await yts(trimmed);
      const videos = (searchResult.videos || []).slice(0, 12).map((v) => ({
        id: v.videoId,
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        duration: v.timestamp || "3:30",
        durationSec: v.seconds || 210,
        author: v.author ? v.author.name : "Artist",
        views: v.views || 0,
      }));

      return res.json({ success: true, results: videos });
    } catch (err) {
      console.error("Search error:", err);
      return res.status(500).json({ success: false, error: err.message, results: [] });
    }
  });

  // Room Info API
  app.get("/api/room/:roomId", (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.json({ exists: false });
    }
    return res.json({
      exists: true,
      usersCount: room.users.size,
      currentTrack: room.currentTrack,
      queueLength: room.queue.length,
    });
  });

  // Socket.io Real-Time Synchronization Engine
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let currentUser = null;

    // Join room
    socket.on("room:join", ({ roomId, nickname, avatar }) => {
      if (!roomId) return;
      currentRoomId = roomId;

      const room = getOrCreateRoom(roomId);
      socket.join(roomId);

      const isFirstUser = room.users.size === 0;
      currentUser = {
        socketId: socket.id,
        id: socket.id,
        nickname: (nickname || `Guest_${Math.floor(100 + Math.random() * 900)}`).slice(0, 25),
        avatar: avatar || "🎧",
        isHost: isFirstUser,
        joinedAt: Date.now(),
      };

      room.users.set(socket.id, currentUser);

      // Send initial state to the newcomer with accurate timestamp
      const accurateTime = getAccurateCurrentTime(room.playback);
      socket.emit("room:state", {
        roomId: room.id,
        users: Array.from(room.users.values()),
        queue: room.queue,
        currentTrack: room.currentTrack,
        playback: {
          isPlaying: room.playback.isPlaying,
          currentTime: accurateTime,
          updatedAt: room.playback.updatedAt,
        },
        messages: room.messages.slice(-50),
        voteSkips: Array.from(room.voteSkips),
      });

      // System alert message
      const joinMsg = {
        id: `sys-${Date.now()}-${Math.random()}`,
        sender: { id: "system", nickname: "System", avatar: "👋" },
        text: `${currentUser.nickname} joined the session.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSystem: true,
      };
      room.messages.push(joinMsg);

      // Broadcast user joined to other room members
      socket.to(roomId).emit("room:user_joined", {
        user: currentUser,
        users: Array.from(room.users.values()),
      });
      io.to(roomId).emit("chat:message", joinMsg);
    });

    // Play action
    socket.on("music:play", ({ currentTime }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.playback.isPlaying = true;
      room.playback.currentTime = typeof currentTime === "number" ? currentTime : room.playback.currentTime;
      room.playback.updatedAt = Date.now();

      io.to(currentRoomId).emit("music:sync_play", {
        currentTime: room.playback.currentTime,
        updatedAt: room.playback.updatedAt,
        triggeredBy: currentUser ? currentUser.nickname : "User",
      });
    });

    // Pause action
    socket.on("music:pause", ({ currentTime }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.playback.isPlaying = false;
      room.playback.currentTime = typeof currentTime === "number" ? currentTime : getAccurateCurrentTime(room.playback);
      room.playback.updatedAt = Date.now();

      io.to(currentRoomId).emit("music:sync_pause", {
        currentTime: room.playback.currentTime,
        triggeredBy: currentUser ? currentUser.nickname : "User",
      });
    });

    // Seek action
    socket.on("music:seek", ({ time }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || typeof time !== "number") return;

      room.playback.currentTime = time;
      room.playback.updatedAt = Date.now();

      io.to(currentRoomId).emit("music:sync_seek", {
        time,
        isPlaying: room.playback.isPlaying,
        triggeredBy: currentUser ? currentUser.nickname : "User",
      });
    });

    // Add to Queue / Play Now
    socket.on("queue:add", ({ track, playNow }) => {
      if (!currentRoomId || !track) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const newTrack = {
        ...track,
        id: `trk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        addedBy: currentUser ? currentUser.nickname : "Guest",
        addedByAvatar: currentUser ? currentUser.avatar : "🎵",
        votes: 0,
      };

      if (playNow || !room.currentTrack) {
        room.currentTrack = newTrack;
        room.playback.isPlaying = true;
        room.playback.currentTime = 0;
        room.playback.updatedAt = Date.now();
        room.voteSkips.clear();

        io.to(currentRoomId).emit("music:sync_track", {
          currentTrack: room.currentTrack,
          queue: room.queue,
          playback: room.playback,
        });

        const sysMsg = {
          id: `sys-${Date.now()}`,
          sender: { id: "system", nickname: "Now Playing", avatar: "🎶" },
          text: `Now playing: "${newTrack.title}" (added by ${newTrack.addedBy})`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true,
        };
        room.messages.push(sysMsg);
        io.to(currentRoomId).emit("chat:message", sysMsg);
      } else {
        room.queue.push(newTrack);
        io.to(currentRoomId).emit("queue:updated", {
          queue: room.queue,
          currentTrack: room.currentTrack,
        });

        const sysMsg = {
          id: `sys-${Date.now()}`,
          sender: { id: "system", nickname: "Queue", avatar: "📥" },
          text: `${newTrack.addedBy} added "${newTrack.title}" to the queue.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true,
        };
        room.messages.push(sysMsg);
        io.to(currentRoomId).emit("chat:message", sysMsg);
      }
    });

    // Remove from queue
    socket.on("queue:remove", ({ trackId }) => {
      if (!currentRoomId || !trackId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.queue = room.queue.filter((t) => t.id !== trackId);
      io.to(currentRoomId).emit("queue:updated", {
        queue: room.queue,
        currentTrack: room.currentTrack,
      });
    });

    // Reorder queue
    socket.on("queue:reorder", ({ newQueue }) => {
      if (!currentRoomId || !Array.isArray(newQueue)) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.queue = newQueue;
      io.to(currentRoomId).emit("queue:updated", {
        queue: room.queue,
        currentTrack: room.currentTrack,
      });
    });

    // Song ended or manual Next / Skip
    socket.on("music:next", () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.voteSkips.clear();

      if (room.queue.length > 0) {
        const nextTrack = room.queue.shift();
        room.currentTrack = nextTrack;
        room.playback.isPlaying = true;
        room.playback.currentTime = 0;
        room.playback.updatedAt = Date.now();

        io.to(currentRoomId).emit("music:sync_track", {
          currentTrack: room.currentTrack,
          queue: room.queue,
          playback: room.playback,
        });

        const sysMsg = {
          id: `sys-${Date.now()}`,
          sender: { id: "system", nickname: "Now Playing", avatar: "🎶" },
          text: `Now playing: "${nextTrack.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true,
        };
        room.messages.push(sysMsg);
        io.to(currentRoomId).emit("chat:message", sysMsg);
      } else {
        room.currentTrack = null;
        room.playback.isPlaying = false;
        room.playback.currentTime = 0;
        room.playback.updatedAt = Date.now();

        io.to(currentRoomId).emit("music:sync_track", {
          currentTrack: null,
          queue: [],
          playback: room.playback,
        });
      }
    });

    // Vote to Skip
    socket.on("queue:vote_skip", () => {
      if (!currentRoomId || !currentUser) return;
      const room = rooms.get(currentRoomId);
      if (!room || !room.currentTrack) return;

      room.voteSkips.add(currentUser.id);

      const totalUsers = Math.max(1, room.users.size);
      const required = Math.ceil(totalUsers / 2);
      const currentVotes = room.voteSkips.size;

      io.to(currentRoomId).emit("queue:skip_progress", {
        currentVotes,
        requiredVotes: required,
      });

      if (currentVotes >= required) {
        // Skip track
        room.voteSkips.clear();
        if (room.queue.length > 0) {
          const nextTrack = room.queue.shift();
          room.currentTrack = nextTrack;
          room.playback.isPlaying = true;
          room.playback.currentTime = 0;
          room.playback.updatedAt = Date.now();

          io.to(currentRoomId).emit("music:sync_track", {
            currentTrack: room.currentTrack,
            queue: room.queue,
            playback: room.playback,
          });
        } else {
          room.currentTrack = null;
          room.playback.isPlaying = false;
          room.playback.currentTime = 0;
          io.to(currentRoomId).emit("music:sync_track", {
            currentTrack: null,
            queue: [],
            playback: room.playback,
          });
        }

        const sysMsg = {
          id: `sys-${Date.now()}`,
          sender: { id: "system", nickname: "Vote Skip", avatar: "⏭️" },
          text: `Track skipped by consensus vote (${currentVotes}/${required} votes).`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true,
        };
        room.messages.push(sysMsg);
        io.to(currentRoomId).emit("chat:message", sysMsg);
      }
    });

    // Chat Message Send
    socket.on("chat:send", ({ text, mediaUrl }) => {
      if (!currentRoomId || !currentUser) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if ((!text || !text.trim()) && !mediaUrl) return;

      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: {
          id: currentUser.id,
          nickname: currentUser.nickname,
          avatar: currentUser.avatar,
        },
        text: (text || "").slice(0, 500),
        mediaUrl: mediaUrl || null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSystem: false,
      };

      room.messages.push(newMsg);
      if (room.messages.length > 100) {
        room.messages.shift();
      }

      io.to(currentRoomId).emit("chat:message", newMsg);
    });

    // User Profile Update
    socket.on("user:update", ({ nickname, avatar }) => {
      if (!currentRoomId || !currentUser) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (nickname) currentUser.nickname = nickname.slice(0, 25);
      if (avatar) currentUser.avatar = avatar;

      room.users.set(socket.id, currentUser);
      io.to(currentRoomId).emit("room:users_updated", Array.from(room.users.values()));
    });

    // Request active sync state
    socket.on("sync:request", () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const accurateTime = getAccurateCurrentTime(room.playback);
      socket.emit("music:sync_state", {
        currentTime: accurateTime,
        isPlaying: room.playback.isPlaying,
        updatedAt: room.playback.updatedAt,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (currentRoomId && currentUser) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.users.delete(socket.id);
          room.voteSkips.delete(currentUser.id);

          // If host left and users remain, elect new host
          if (currentUser.isHost && room.users.size > 0) {
            const nextUser = room.users.values().next().value;
            if (nextUser) {
              nextUser.isHost = true;
            }
          }

          const leaveMsg = {
            id: `sys-${Date.now()}`,
            sender: { id: "system", nickname: "System", avatar: "👋" },
            text: `${currentUser.nickname} left the session.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isSystem: true,
          };
          room.messages.push(leaveMsg);

          socket.to(currentRoomId).emit("room:user_left", {
            userId: socket.id,
            nickname: currentUser.nickname,
            users: Array.from(room.users.values()),
          });
          socket.to(currentRoomId).emit("chat:message", leaveMsg);

          // If room empty, clean up after 15 minutes of inactivity
          if (room.users.size === 0) {
            setTimeout(() => {
              if (rooms.get(currentRoomId) && rooms.get(currentRoomId).users.size === 0) {
                rooms.delete(currentRoomId);
              }
            }, 15 * 60 * 1000);
          }
        }
      }
    });
  });

  // Delegate all other routes to Next.js App Router
  app.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> JamSync Server ready on http://localhost:${port}`);
  });
});
