/* ============================================================
   SYNC SERVER — Authoritative WebSocket & HTTP Server
   Serves static web files & status dashboard on HTTP,
   and handles authoritative room sync on WebSockets.
   
   Supports: jam.sync, watch.party, anonymous chat,
   and party games (trivia, typing race, charades, WYR)
   ============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { performance } = require('perf_hooks');

const PORT = process.env.PORT || 3000;
const SCHEDULED_START_BUFFER_MS = 300;
const MAX_ROOMS = 1000;
const MAX_WS_MSG_PER_SEC = 100;

const db = require('./db.js');
const {
  rateLimit, validateWSMessage, randomUsername, generateCode, serverNow,
  sendTo, broadcast, getRandomElement, MIME_TYPES, ANIMAL_NAMES, COLORS,
  pickRandom, initGameState,
} = require('./lib/utils.js');
const { startGameRound, endTriviaRound, endTypingRound, endCharadesRound, endWYRRound, endGame } = require('./lib/game-logic.js');

function sanitizeText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

function sanitizeLink(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

// ========== State ==========
const rooms = new Map();       // code → room
const clientRooms = new Map(); // ws → code
const presenceClients = new Map(); // ws -> { id, name, color, page, x, y }

function getRoom(ws) {
  const code = clientRooms.get(ws);
  return code ? rooms.get(code) : null;
}

function getMember(room, ws) {
  return room ? room.members.find(m => m.ws === ws) : null;
}

function removeMember(ws) {
  const code = clientRooms.get(ws);
  if (!code) return;

  const room = rooms.get(code);
  if (!room) { clientRooms.delete(ws); return; }

  const idx = room.members.findIndex(m => m.ws === ws);
  if (idx < 0) { clientRooms.delete(ws); return; }

  const member = room.members[idx];
  room.members.splice(idx, 1);
  clientRooms.delete(ws);

  // Announce departure
  broadcast(room, { type: 'member-left', username: member.username });

  // Host migration
  if (member.isHost && room.members.length > 0) {
    room.members[0].isHost = true;
    sendTo(room.members[0].ws, { type: 'host-changed', newHost: room.members[0].username, isYou: true });
    broadcast(room, {
      type: 'host-changed',
      newHost: room.members[0].username,
    }, room.members[0].ws);
  }

  // Cleanup empty rooms
  if (room.members.length === 0) {
    room.chatHistory = [];
    rooms.delete(code);
    console.log(`[room] ${code} destroyed (empty)`);
  }
}



// ========== HTTP SERVER ==========
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // Security headers for all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=(), screen-wake-lock=(), clipboard-write=(self), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://www.youtube.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; connect-src 'self' ws: wss: https://api.sumit-labs.me; img-src 'self' data: https://i.ytimg.com https://img.youtube.com; font-src 'self' https://fonts.gstatic.com; frame-src https://www.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:",
  };

  // CORS headers for cross-origin requests from GitHub Pages
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...securityHeaders,
  };

  // Wrap writeHead to inject security headers on every response
  const origWriteHead = res.writeHead.bind(res);
  res.writeHead = function (statusCode, headers, ...args) {
    if (headers) Object.assign(headers, securityHeaders);
    return origWriteHead(statusCode, headers, ...args);
  };

  // Handle CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // Helper for JSON response
  const jsonRes = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify(data));
  };

  // --- REST API ENDPOINTS ---
  if (reqPath.startsWith('/api/')) {
    // 1. Guestbook API
    if (reqPath === '/api/guestbook') {
      if (req.method === 'GET') {
        return jsonRes(200, db.getGuestbook());
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const message = sanitizeText(data.message, 500);
            if (!message) return jsonRes(400, { error: 'Message required' });
            const name = sanitizeText(data.name, 50);
            const link = sanitizeLink(data.link);
            const entry = db.addGuestbookEntry(name, message, link);
            return jsonRes(201, entry);
          } catch (e) {
            return jsonRes(400, { error: 'Invalid JSON' });
          }
        });
        return;
      }
    }

    // 2. Polls API
    if (reqPath === '/api/polls') {
      return jsonRes(200, db.getPoll());
    }
    if (reqPath === '/api/polls/vote' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { optionIdx } = JSON.parse(body);
          const updated = db.votePoll(optionIdx);
          if (updated) return jsonRes(200, updated);
          return jsonRes(400, { error: 'Invalid option' });
        } catch (e) {
          return jsonRes(400, { error: 'Invalid payload' });
        }
      });
      return;
    }

    // 3. Q&A API
    if (reqPath === '/api/qa') {
      if (req.method === 'GET') return jsonRes(200, db.getQA());
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { question } = JSON.parse(body);
            const sanitizedQuestion = sanitizeText(question, 300);
            if (!sanitizedQuestion) return jsonRes(400, { error: 'Question required' });
            const item = db.addQuestion(sanitizedQuestion);
            return jsonRes(201, item);
          } catch (e) { return jsonRes(400, { error: 'Invalid payload' }); }
        });
        return;
      }
    }

    // Rate limiting for all API POST requests
    if (req.method === 'POST') {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      if (!rateLimit(clientIp, 30, 60000)) {
        return jsonRes(429, { error: 'Too many requests. Please slow down.' });
      }
    }

    // 4. AI Chatbot Resume Grounded API
    if (reqPath === '/api/ai-chat' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { message } = JSON.parse(body);
          const q = (message || '').toLowerCase();
          let reply = "Sumit is a B.Tech Cybersecurity student at Sanskriti University with experience in SOC operations, penetration testing, and real-time backend engineering. Feel free to ask about his skills, projects, or experience!";

          if (q.includes('skill') || q.includes('stack') || q.includes('language')) {
            reply = "Sumit's core skills include: Cybersecurity (SOC, Wireshark, Nmap, Metasploit, Burp Suite), Languages (Node.js, JavaScript, Python, C++, Go, SQL), Cloud (AWS, GCP, Docker, Linux), and WebSockets/Real-time systems.";
          } else if (q.includes('project') || q.includes('syncverse') || q.includes('build')) {
            reply = "Key projects: 1) SYNCVERSE (authoritative real-time sync engine for music & video), 2) sumit.sh portfolio with secret terminal & live widgets, 3) Network Traffic Analyzer in Go, 4) Custom SIEM Dashboard.";
          } else if (q.includes('job') || q.includes('intern') || q.includes('hire') || q.includes('contact')) {
            reply = "Sumit is actively available for Cybersecurity & Software Engineering internships for 2026. You can reach out via LinkedIn, GitHub, or email directly at sumit@sumit.sh!";
          } else if (q.includes('education') || q.includes('college') || q.includes('degree')) {
            reply = "Sumit is pursuing a B.Tech in Cybersecurity at Sanskriti University, Mathura (expected graduation 2027).";
          }

          return jsonRes(200, { reply });
        } catch (e) { return jsonRes(400, { error: 'Invalid request' }); }
      });
      return;
    }
  }

  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);
  const resolvedPath = path.resolve(filePath);


  // Security check — prevent directory traversal
  if (!resolvedPath.startsWith(__dirname + path.sep) && resolvedPath !== __dirname) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if requested file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If endpoint is /status or /health, return server telemetry JSON
      if (reqPath === '/status' || reqPath === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'online',
          uptime: process.uptime(),
          roomsCount: rooms.size,
          clientsCount: clientRooms.size,
          rooms: Array.from(rooms.values()).map(r => ({
            code: r.code,
            type: r.type,
            members: r.members.length,
            isPlaying: r.playback.isPlaying,
            trackId: r.playback.trackId,
          })),
        }));
        return;
      }

      // Serve 404 page
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 — sumit.sh sync server</title>
          <style>
            body { background: #0a0a0a; color: #00ff41; font-family: monospace; padding: 2rem; }
            a { color: #00d4ff; text-decoration: none; }
          </style>
        </head>
        <body>
          <h2>[ 404 ] File Not Found</h2>
          <p>The requested path <code>${reqPath}</code> was not found.</p>
          <p><a href="/">← Return to sumit.sh portfolio</a></p>
        </body>
        </html>
      `);
      return;
    }

    // Serve static file
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache control — HTML gets short TTL, assets get longer
    const cacheMaxAge = ext === '.html' ? '600' : '2592000';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${cacheMaxAge}, immutable`,
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

// ========== WEBSOCKET SERVER ==========
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).slice(2, 10);

  let wsMsgCount = 0;
  let wsMsgResetAt = Date.now() + 1000;

  ws.on('message', (raw) => {
    // WS rate limiting
    const now = Date.now();
    if (now > wsMsgResetAt) { wsMsgCount = 0; wsMsgResetAt = now + 1000; }
    wsMsgCount++;
    if (wsMsgCount > MAX_WS_MSG_PER_SEC) return;

    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // Validate message shape against schema
    if (!validateWSMessage(msg)) {
      sendTo(ws, { type: 'error', message: 'Invalid message format' });
      return;
    }

    switch (msg.type) {

      // ---- Presence / Multiplayer Cursors ----
      case 'presence-join': {
        const id = clientId;
        const color = getRandomElement(COLORS);
        const name = getRandomElement(ANIMAL_NAMES);
        presenceClients.set(ws, { id, color, name, page: msg.page || '/', x: 0.5, y: 0.5 });
        sendTo(ws, { type: 'presence-init', id, color, name });
        break;
      }

      case 'presence-move': {
        const p = presenceClients.get(ws);
        if (p) {
          p.x = msg.x;
          p.y = msg.y;
          const payload = JSON.stringify({ type: 'presence-update', id: p.id, color: p.color, name: p.name, x: p.x, y: p.y });
          const room = getRoom(ws);
          if (room) {
            broadcast(room, { type: 'presence-update', id: p.id, color: p.color, name: p.name, x: p.x, y: p.y }, ws);
          } else {
            for (const [clientWs] of presenceClients) {
              if (clientWs !== ws && clientWs.readyState === 1 && !clientRooms.has(clientWs)) {
                clientWs.send(payload);
              }
            }
          }
        }
        break;
      }

      case 'presence-chat': {
        const p = presenceClients.get(ws);
        if (p) {
          const payload = JSON.stringify({ type: 'presence-chat', id: p.id, text: msg.text });
          const room = getRoom(ws);
          if (room) {
            broadcast(room, { type: 'presence-chat', id: p.id, text: msg.text }, ws);
          } else {
            for (const [clientWs] of presenceClients) {
              if (clientWs !== ws && clientWs.readyState === 1 && !clientRooms.has(clientWs)) {
                clientWs.send(payload);
              }
            }
          }
        }
        break;
      }

      // ---- Shared Whiteboard ----
      case 'draw-init': {
        const room = getRoom(ws);
        if (room) {
          if (!room.strokes) room.strokes = [];
          sendTo(ws, { type: 'draw-history', strokes: room.strokes });
        } else {
          sendTo(ws, { type: 'draw-history', strokes: db.getStrokes() });
        }
        break;
      }

      case 'draw-stroke': {
        const stroke = { x0: msg.x0, y0: msg.y0, x1: msg.x1, y1: msg.y1, color: msg.color, size: msg.size };
        const room = getRoom(ws);
        if (room) {
          if (!room.strokes) room.strokes = [];
          room.strokes.push(stroke);
          if (room.strokes.length > 5000) room.strokes.shift();
          broadcast(room, { type: 'draw-stroke', ...stroke }, ws);
        } else {
          db.addStroke(stroke);
          const payload = JSON.stringify({ type: 'draw-stroke', ...stroke });
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === 1 && !clientRooms.has(client)) {
              client.send(payload);
            }
          });
        }
        break;
      }

      case 'draw-clear': {
        const room = getRoom(ws);
        if (room) {
          room.strokes = [];
          broadcast(room, { type: 'draw-clear' });
        } else {
          db.clearStrokes();
          const payload = JSON.stringify({ type: 'draw-clear' });
          wss.clients.forEach(client => {
            if (client.readyState === 1 && !clientRooms.has(client)) {
              client.send(payload);
            }
          });
        }
        break;
      }

      // ---- Group Polls ----
      case 'poll-create': {
        const room = getRoom(ws);
        if (!room) {
          sendTo(ws, { type: 'error', message: 'You are not in a room' });
          break;
        }
        const member = getMember(room, ws);
        if (!member || !member.isHost) {
          sendTo(ws, { type: 'error', message: 'Only the host can create a poll' });
          break;
        }
        room.poll = {
          question: msg.question,
          options: msg.options.map(text => ({ text, votes: 0 })),
          votesMap: {}
        };
        broadcast(room, { type: 'poll-update', question: room.poll.question, options: room.poll.options, votesMap: room.poll.votesMap });
        break;
      }

      case 'poll-vote': {
        const room = getRoom(ws);
        if (!room || !room.poll) {
          sendTo(ws, { type: 'error', message: 'No active poll in this room' });
          break;
        }
        const member = getMember(room, ws);
        if (!member) break;
        const username = member.username;
        const optionIdx = parseInt(msg.optionIdx);
        if (isNaN(optionIdx) || optionIdx < 0 || optionIdx >= room.poll.options.length) {
          sendTo(ws, { type: 'error', message: 'Invalid option selected' });
          break;
        }
        const previousVote = room.poll.votesMap[username];
        if (previousVote === optionIdx) {
          break;
        }
        if (previousVote !== undefined) {
          room.poll.options[previousVote].votes = Math.max(0, room.poll.options[previousVote].votes - 1);
        }
        room.poll.options[optionIdx].votes++;
        room.poll.votesMap[username] = optionIdx;
        broadcast(room, { type: 'poll-update', question: room.poll.question, options: room.poll.options, votesMap: room.poll.votesMap });
        break;
      }

      // ---- Group Guestbook ----
      case 'guestbook-post': {
        const room = getRoom(ws);
        if (!room) {
          sendTo(ws, { type: 'error', message: 'You are not in a room' });
          break;
        }
        if (!room.guestbook) room.guestbook = [];
        const entry = {
          id: Date.now().toString(),
          name: sanitizeText(msg.name, 50) || 'anonymous',
          message: sanitizeText(msg.message, 500),
          link: sanitizeLink(msg.link),
          createdAt: new Date().toISOString()
        };
        if (!entry.message) {
          sendTo(ws, { type: 'error', message: 'Message is required' });
          break;
        }
        room.guestbook.unshift(entry);
        if (room.guestbook.length > 100) room.guestbook.pop();
        broadcast(room, { type: 'guestbook-update', guestbook: room.guestbook });
        break;
      }

      // ---- Clock Sync ----
      case 'ping': {
        sendTo(ws, {
          type: 'pong',
          serverTime: serverNow(),
          pingId: msg.pingId,
        });
        break;
      }

      // ---- Create Room ----
      case 'create-room': {
        if (rooms.size >= MAX_ROOMS) {
          sendTo(ws, { type: 'error', message: 'Server at capacity. Try again later.' });
          break;
        }
        removeMember(ws);

        const code = generateCode();
        const username = msg.username || randomUsername();
        const room = {
          code,
          type: msg.roomType || 'jam',
          members: [{
            ws, id: clientId, username, isHost: true, lastChatAt: 0,
          }],
          playback: {
            trackId: null,
            isPlaying: false,
            positionAtOrigin: 0,
            originServerTime: serverNow(),
          },
          queue: [],
          game: null,
          chatHistory: [],
        };

        rooms.set(code, room);
        clientRooms.set(ws, code);

        sendTo(ws, {
          type: 'room-created',
          code,
          isHost: true,
          username,
        });

        console.log(`[room] ${code} created (${room.type}) by ${username}`);
        break;
      }

      // ---- Join Room ----
      case 'join-room': {
        const code = String(msg.code || '').toLowerCase().trim();
        if (code.length < 4 || code.length > 12) {
          sendTo(ws, { type: 'error', message: 'Invalid room code' });
          break;
        }
        const room = rooms.get(code);

        if (!room) {
          sendTo(ws, { type: 'error', message: 'Room not found' });
          break;
        }

        removeMember(ws);

        const username = msg.username || randomUsername();
        room.members.push({
          ws, id: clientId, username, isHost: false, lastChatAt: 0,
        });
        clientRooms.set(ws, code);

        // Initialize game score if game is active
        if (room.game && room.game.active) {
          if (!room.game.scores[username]) {
            room.game.scores[username] = 0;
          }
        }

        sendTo(ws, {
          type: 'room-joined',
          code,
          isHost: false,
          username,
          roomType: room.type,
          playback: room.playback,
          queue: room.queue.map(t => ({ videoId: t.videoId, title: t.title })),
          members: room.members.map(m => ({
            username: m.username, isHost: m.isHost,
          })),
          game: room.game ? {
            gameType: room.game.gameType,
            active: room.game.active,
            scores: room.game.scores,
            currentRound: room.game.currentRound,
          } : null,
          chatHistory: room.chatHistory || [],
          poll: room.poll ? {
            question: room.poll.question,
            options: room.poll.options,
            votesMap: room.poll.votesMap
          } : null,
          guestbook: room.guestbook || [],
        });

        broadcast(room, { type: 'member-joined', username }, ws);

        console.log(`[room] ${code} ← ${username} joined (${room.members.length} members)`);
        break;
      }

      // ---- Leave Room ----
      case 'leave-room': {
        removeMember(ws);
        break;
      }

      // ---- Play ----
      case 'play': {
        const room = getRoom(ws);
        if (!room) break;

        const now = serverNow();
        const scheduledStart = now + SCHEDULED_START_BUFFER_MS;

        const position = msg.position !== undefined
          ? msg.position
          : room.playback.positionAtOrigin;

        room.playback = {
          trackId: msg.trackId || room.playback.trackId,
          isPlaying: true,
          positionAtOrigin: position,
          originServerTime: scheduledStart,
        };

        broadcast(room, {
          type: 'play',
          trackId: room.playback.trackId,
          positionAtOrigin: position,
          originServerTime: scheduledStart,
          scheduledStart,
        });
        break;
      }

      // ---- Pause ----
      case 'pause': {
        const room = getRoom(ws);
        if (!room) break;

        const now = serverNow();

        let currentPos = room.playback.positionAtOrigin;
        if (room.playback.isPlaying) {
          currentPos += (now - room.playback.originServerTime) / 1000;
        }

        room.playback = {
          ...room.playback,
          isPlaying: false,
          positionAtOrigin: Math.max(0, currentPos),
          originServerTime: now,
        };

        broadcast(room, {
          type: 'pause',
          positionAtOrigin: room.playback.positionAtOrigin,
          originServerTime: now,
        });
        break;
      }

      // ---- Seek ----
      case 'seek': {
        const room = getRoom(ws);
        if (!room) break;

        const now = serverNow();
        room.playback = {
          ...room.playback,
          positionAtOrigin: msg.position,
          originServerTime: now,
        };

        broadcast(room, {
          type: 'seek',
          positionAtOrigin: msg.position,
          originServerTime: now,
          isPlaying: room.playback.isPlaying,
        });
        break;
      }

      // ---- Load Track ----
      case 'load-track': {
        const room = getRoom(ws);
        if (!room) break;

        const now = serverNow();
        const scheduledStart = now + SCHEDULED_START_BUFFER_MS;

        room.playback = {
          trackId: msg.trackId,
          isPlaying: true,
          positionAtOrigin: 0,
          originServerTime: scheduledStart,
        };

        broadcast(room, {
          type: 'load-track',
          trackId: msg.trackId,
          title: msg.title || `YouTube: ${msg.trackId}`,
          positionAtOrigin: 0,
          originServerTime: scheduledStart,
          scheduledStart,
        });
        break;
      }

      // ---- Queue Add ----
      case 'queue-add': {
        const room = getRoom(ws);
        if (!room || !msg.track) break;

        if (!room.queue.find(t => t.videoId === msg.track.videoId)) {
          room.queue.push({
            videoId: msg.track.videoId,
            title: msg.track.title || `YouTube: ${msg.track.videoId}`,
          });
          broadcast(room, {
            type: 'queue-update',
            queue: room.queue,
          });
        }
        break;
      }

      // ---- Queue Remove ----
      case 'queue-remove': {
        const room = getRoom(ws);
        if (!room) break;

        room.queue = room.queue.filter(t => t.videoId !== msg.videoId);
        broadcast(room, {
          type: 'queue-update',
          queue: room.queue,
        });
        break;
      }

      // ---- Skip ----
      case 'skip': {
        const room = getRoom(ws);
        if (!room || room.queue.length === 0) break;

        const currentIdx = room.queue.findIndex(
          t => t.videoId === room.playback.trackId
        );
        const nextIdx = currentIdx + 1;

        if (nextIdx < room.queue.length) {
          const next = room.queue[nextIdx];
          const now = serverNow();
          const scheduledStart = now + SCHEDULED_START_BUFFER_MS;

          room.playback = {
            trackId: next.videoId,
            isPlaying: true,
            positionAtOrigin: 0,
            originServerTime: scheduledStart,
          };

          broadcast(room, {
            type: 'load-track',
            trackId: next.videoId,
            title: next.title,
            positionAtOrigin: 0,
            originServerTime: scheduledStart,
            scheduledStart,
          });
        } else {
          broadcast(room, { type: 'queue-ended' });
        }
        break;
      }

      // ---- Chat ----
      case 'chat': {
        const roomId = (msg.roomId || '').toLowerCase().trim();
        const room = roomId ? rooms.get(roomId) : getRoom(ws);
        if (!room || !msg.text) break;

        const member = room.members.find(m => m.ws === ws);
        if (!member) break;

        const now = Date.now();
        if (member.lastChatAt && now - member.lastChatAt < 1000) {
          sendTo(ws, { type: 'error', message: 'Please slow down.' });
          break;
        }
        member.lastChatAt = now;

        const payload = {
          type: 'chat',
          roomId: room.code,
          name: msg.name || member.username || 'Guest',
          text: String(msg.text).slice(0, 500),
          ts: now,
        };

        if (!room.chatHistory) room.chatHistory = [];
        room.chatHistory.push(payload);
        if (room.chatHistory.length > 50) room.chatHistory.shift();

        broadcast(room, payload);
        break;
      }

      // ---- Typing Indicator ----
      case 'typing': {
        const room = getRoom(ws);
        if (!room) break;

        const member = getMember(room, ws);
        if (!member) break;

        broadcast(room, {
          type: 'typing',
          user: member.username,
        }, ws);
        break;
      }

      // ---- Reaction ----
      case 'reaction': {
        const room = getRoom(ws);
        if (!room || !msg.emoji || !msg.messageId) break;

        const member = getMember(room, ws);
        if (!member) break;

        broadcast(room, {
          type: 'reaction',
          emoji: msg.emoji,
          messageId: msg.messageId,
          user: member.username,
        });
        break;
      }

      // ---- Game: Start ----
      case 'game-start': {
        const room = getRoom(ws);
        if (!room) break;

        const member = getMember(room, ws);
        if (!member || !member.isHost) {
          sendTo(ws, { type: 'error', message: 'Only the host can start games' });
          break;
        }

        const gameType = msg.gameType; // 'trivia' | 'typingrace' | 'charades' | 'wyr'
        if (!['trivia', 'typingrace', 'charades', 'wyr'].includes(gameType)) {
          sendTo(ws, { type: 'error', message: 'Invalid game type' });
          break;
        }

        // Cleanup old game timer
        if (room.game && room.game.roundTimer) {
          clearTimeout(room.game.roundTimer);
        }

        room.game = initGameState(gameType);
        room.game.active = true;
        room.game.totalRounds = msg.rounds || (gameType === 'wyr' ? 8 : 10);

        // Initialize scores for all members
        for (const m of room.members) {
          room.game.scores[m.username] = 0;
        }

        broadcast(room, {
          type: 'game-started',
          gameType,
          totalRounds: room.game.totalRounds,
          players: room.members.map(m => m.username),
        });

        // Start first round after a brief delay
        setTimeout(() => startGameRound(room), 2000);
        break;
      }

      // ---- Game: Answer (trivia) ----
      case 'game-answer': {
        const room = getRoom(ws);
        if (!room || !room.game || !room.game.roundActive) break;

        const member = getMember(room, ws);
        if (!member) break;

        const game = room.game;

        // Prevent double-answering
        if (game.roundAnswers[member.username] !== undefined) break;

        if (game.gameType === 'trivia') {
          game.roundAnswers[member.username] = msg.answer;
          if (msg.answer === game.roundData.answer) {
            // Faster answers get more points
            const answeredCount = Object.keys(game.roundAnswers).length;
            const bonus = Math.max(0, 5 - answeredCount); // first = +5, second = +4, etc
            game.scores[member.username] = (game.scores[member.username] || 0) + 10 + bonus;
          }

          // Notify all that someone answered
          broadcast(room, {
            type: 'game-player-answered',
            user: member.username,
            totalAnswered: Object.keys(game.roundAnswers).length,
            totalPlayers: room.members.length,
          });

          // If everyone answered, end round early
          if (Object.keys(game.roundAnswers).length >= room.members.length) {
            endTriviaRound(room);
          }
        }
        break;
      }

      // ---- Game: Typing Race Progress ----
      case 'game-typing-progress': {
        const room = getRoom(ws);
        if (!room || !room.game || !room.game.roundActive) break;
        if (room.game.gameType !== 'typingrace') break;

        const member = getMember(room, ws);
        if (!member) break;

        // Broadcast progress to all
        broadcast(room, {
          type: 'game-typing-progress',
          user: member.username,
          progress: msg.progress, // 0-100
          wpm: msg.wpm || 0,
        }, ws);
        break;
      }

      // ---- Game: Typing Race Finish ----
      case 'game-typing-finish': {
        const room = getRoom(ws);
        if (!room || !room.game || !room.game.roundActive) break;
        if (room.game.gameType !== 'typingrace') break;

        const member = getMember(room, ws);
        if (!member) break;
        const game = room.game;

        if (game.roundAnswers[member.username] !== undefined) break;

        const accuracy = msg.accuracy || 100;
        const wpm = msg.wpm || 0;
        const timeTaken = msg.timeTaken || 30000;

        game.roundAnswers[member.username] = { wpm, accuracy, timeTaken };

        // Score: wpm * accuracy_multiplier
        const points = Math.round(wpm * (accuracy / 100));
        game.scores[member.username] = (game.scores[member.username] || 0) + points;

        broadcast(room, {
          type: 'game-typing-finished',
          user: member.username,
          wpm,
          accuracy,
          timeTaken,
          totalFinished: Object.keys(game.roundAnswers).length,
          totalPlayers: room.members.length,
        });

        // If everyone finished, end round early
        if (Object.keys(game.roundAnswers).length >= room.members.length) {
          endTypingRound(room);
        }
        break;
      }

      // ---- Game: Charades Emoji (describer sends emoji) ----
      case 'game-charades-emoji': {
        const room = getRoom(ws);
        if (!room || !room.game || !room.game.roundActive) break;
        if (room.game.gameType !== 'charades') break;

        const member = getMember(room, ws);
        if (!member) break;

        // Only the describer can send emojis
        if (member.username !== room.game.roundData.describer) break;

        broadcast(room, {
          type: 'game-charades-emoji',
          emoji: msg.emoji,
          user: member.username,
        });
        break;
      }

      // ---- Game: Charades Guess ----
      case 'game-charades-guess': {
        const room = getRoom(ws);
        if (!room || !room.game || !room.game.roundActive) break;
        if (room.game.gameType !== 'charades') break;

        const member = getMember(room, ws);
        if (!member) break;

        const game = room.game;
        // Describer can't guess
        if (member.username === game.roundData.describer) break;

        const guess = (msg.guess || '').toLowerCase().trim();
        const word = game.roundData.word.toLowerCase();

        // Broadcast the guess as a chat message
        broadcast(room, {
          type: 'game-charades-guess-msg',
          user: member.username,
          guess: msg.guess,
        });

        if (guess === word) {
          // Guesser gets 10 points, describer gets 5
          game.scores[member.username] = (game.scores[member.username] || 0) + 10;
          game.scores[game.roundData.describer] = (game.scores[game.roundData.describer] || 0) + 5;

          endCharadesRound(room, member.username);
        }
        break;
      }

      // ---- Game: WYR Vote ----
      case 'game-vote': {
        const room = getRoom(ws);
        if (!room || !room.game || !room.game.roundActive) break;
        if (room.game.gameType !== 'wyr') break;

        const member = getMember(room, ws);
        if (!member) break;

        const game = room.game;
        if (game.roundAnswers[member.username] !== undefined) break;

        const vote = msg.vote; // 'a' or 'b'
        if (vote !== 'a' && vote !== 'b') break;

        game.roundAnswers[member.username] = vote;

        broadcast(room, {
          type: 'game-vote-cast',
          user: member.username,
          totalVoted: Object.keys(game.roundAnswers).length,
          totalPlayers: room.members.length,
        });

        // If everyone voted, end round early
        if (Object.keys(game.roundAnswers).length >= room.members.length) {
          endWYRRound(room);
        }
        break;
      }

      // ---- Game: Stop ----
      case 'game-stop': {
        const room = getRoom(ws);
        if (!room || !room.game) break;

        const member = getMember(room, ws);
        if (!member || !member.isHost) break;

        endGame(room);
        break;
      }

      // ---- Request full state ----
      case 'request-state': {
        const room = getRoom(ws);
        if (!room) break;

        sendTo(ws, {
          type: 'full-state',
          playback: room.playback,
          queue: room.queue,
          members: room.members.map(m => ({
            username: m.username, isHost: m.isHost,
          })),
          game: room.game ? {
            gameType: room.game.gameType,
            active: room.game.active,
            scores: room.game.scores,
            currentRound: room.game.currentRound,
          } : null,
        });
        break;
      }
    }
  });

  const cleanupClient = () => {
    removeMember(ws);
    const p = presenceClients.get(ws);
    if (p) {
      presenceClients.delete(ws);
      const payload = JSON.stringify({ type: 'presence-leave', id: p.id });
      for (const [clientWs] of presenceClients) {
        if (clientWs.readyState === 1) clientWs.send(payload);
      }
    }
  };

  ws.on('close', cleanupClient);
  ws.on('error', cleanupClient);
});

// ========== Graceful Shutdown ==========
function shutdown(signal) {
  console.log(`\n[server] ${signal} received — shutting down gracefully...`);
  wss.clients.forEach(client => {
    client.close(1001, 'Server shutting down');
  });
  server.close(() => {
    console.log('[server] HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[server] Forced exit after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   [ sumit.sh ] party hub server       ║
║   http://localhost:${PORT}               ║
║   ws://localhost:${PORT}                 ║
║   jam · watch · chat · games          ║
║   ready for connections               ║
╚═══════════════════════════════════════╝
  `);
});
