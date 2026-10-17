# JamSync — Real-Time Collaborative Music Sharing Application

> A production-ready, ultra-responsive collaborative music listening application built with **Next.js 14**, **Node.js**, **Express**, **Socket.io**, and **Glassmorphism UI**. Synchronize audio playback across unlimited devices in real-time with zero YouTube API keys required.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-white?style=for-the-badge&logo=socket.io)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

---

## 🌟 Architecture & Core Features

### 1. Glassmorphism Design System
- Modern, multi-layered Glassmorphism with deep obsidian background (`#08070d`) and ambient glowing orbs.
- Frosted translucent glass panels (`backdrop-filter: blur(20px)`, `bg-white/[0.04]`).
- Subtle glossy borders (`border: 1px solid rgba(255, 255, 255, 0.12)`) and vibrant violet/pink gradient accents.
- Responsive 3-column desktop dashboard and intuitive mobile tab bar.

### 2. Instant Room Management & Joining
- 1-click room creation with unique **4-digit room codes** (e.g., `#7842`).
- Shareable direct URLs (e.g. `http://localhost:3000/jam/7842` or `?room=7842`).
- Seamless guest onboarding with custom nicknames and avatar selectors.
- 1-click invite link copying with clipboard confirmation.

### 3. Integrated Music Search (Zero YouTube API Keys Required)
- Built-in search bar querying a high-speed public YouTube scraper (`yt-search`) via `/api/search?q=...`.
- Instant search results with thumbnails, durations, titles, and channel metadata.
- "Play Now" and "Add to Queue" actions.
- Direct YouTube URL paste fallback parser.

### 4. Real-Time Audio Synchronization & Controls
- Low-latency WebSocket synchronization powered by Socket.io.
- Automatic drift compensation: newcomer clients calculate exact current timestamp `currentTime + ((Date.now() - updatedAt)/1000)`.
- Global controls (Play, Pause, Seek, Skip, Next) synced immediately to all room listeners.
- Consensus Vote to Skip system requiring majority agreement.

### 5. Persistent Background Playback
- YouTube iFrame embedded in a persistent top-level context layout.
- Music plays uninterruptedly in the background while switching between Search, Queue, Chat, and User profiles.

### 6. Real-Time Chat & Media Sharing
- Live chat drawer with instant message delivery.
- System notifications for track transitions, user arrivals, and skip votes.
- Inline Image/GIF media sharing with automatic preview render.
- Quick emoji reaction picker (`🔥`, `❤️`, `⚡`, `🎉`, `💃`, `🙌`, `🤯`, `💯`).

---

## 🔌 WebSocket Event Schema & State Architecture

### Client-to-Server Events (`Emit`)
| Event | Payload | Description |
|---|---|---|
| `room:join` | `{ roomId, nickname, avatar }` | Join or create room with specified profile |
| `music:play` | `{ currentTime }` | Resume playback across all connected listeners |
| `music:pause` | `{ currentTime }` | Pause playback across all connected listeners |
| `music:seek` | `{ time }` | Seek all listeners to exact playback timestamp |
| `music:next` | *none* | Skip current track or trigger next track in queue |
| `queue:add` | `{ track, playNow }` | Add song to room queue or play immediately |
| `queue:remove`| `{ trackId }` | Remove specific track from room queue |
| `queue:reorder`| `{ newQueue }` | Update order of songs in queue |
| `queue:vote_skip`| *none* | Cast vote to skip current playing track |
| `chat:send` | `{ text, mediaUrl }` | Send text message or image attachment |
| `user:update` | `{ nickname, avatar }` | Update user nickname or avatar in room |
| `sync:request` | *none* | Request current accurate playback state from server |

### Server-to-Client Events (`Listen`)
| Event | Payload | Description |
|---|---|---|
| `room:state` | `RoomState` | Full initial room state (users, queue, currentTrack, playback, messages) |
| `room:user_joined` | `{ user, users }` | Broadcast when a new participant joins |
| `room:user_left` | `{ userId, nickname, users }` | Broadcast when a participant leaves |
| `music:sync_play` | `{ currentTime, updatedAt, triggeredBy }` | Sync play command with drift timestamp |
| `music:sync_pause` | `{ currentTime, triggeredBy }` | Sync pause command with timestamp |
| `music:sync_seek` | `{ time, isPlaying, triggeredBy }` | Sync scrub seek to all players |
| `music:sync_track` | `{ currentTrack, queue, playback }` | Transition to new track |
| `queue:updated` | `{ queue, currentTrack }` | Broadcast updated queue state |
| `queue:skip_progress` | `{ currentVotes, requiredVotes }` | Update vote-to-skip consensus counter |
| `chat:message` | `ChatMessage` | Broadcast new chat message or system alert |

---

## 🚀 Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Build Next.js application
npm run build

# 3. Start unified Node.js + Express + Socket.io server
npm run dev
# or
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
