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

const db = require('./db.js');

// ========== State ==========
const rooms = new Map();       // code → room
const clientRooms = new Map(); // ws → code
const presenceClients = new Map(); // ws -> { id, name, color, page, x, y }

const ANIMAL_NAMES = ['Ghost', 'Cipher', 'Shadow', 'Neon', 'Valkyrie', 'Phoenix', 'Nexus', 'Apex', 'Spectre', 'Zero'];
const COLORS = ['#00ff41', '#00d4ff', '#ff0055', '#ffcc00', '#a855f7'];

function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }


// ========== Utilities ==========
function generateCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function serverNow() {
  return performance.now();
}

function sendTo(ws, msg) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room, msg, excludeWs = null) {
  const data = JSON.stringify(msg);
  for (const member of room.members) {
    if (member.ws !== excludeWs && member.ws.readyState === 1) {
      member.ws.send(data);
    }
  }
}

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
    rooms.delete(code);
    console.log(`[room] ${code} destroyed (empty)`);
  }
}

// ========== Random Username Generator ==========
const ADJECTIVES = [
  'phantom', 'ghost', 'cipher', 'shadow', 'neon', 'cyber', 'stealth',
  'rogue', 'glitch', 'pixel', 'binary', 'crypt', 'nova', 'void',
  'dark', 'silent', 'toxic', 'hyper', 'turbo', 'zero', 'cosmic',
  'quantum', 'astral', 'storm', 'blaze', 'frost', 'venom', 'chaos'
];

function randomUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}_${num}`;
}

// ========== Trivia Question Bank ==========
const TRIVIA_QUESTIONS = [
  // Tech & Cyber
  { q: "What does SQL stand for?", options: ["Structured Query Language", "Simple Question Language", "Structured Question Logic", "System Query Language"], answer: 0, category: "tech" },
  { q: "What port does HTTPS use by default?", options: ["80", "443", "8080", "22"], answer: 1, category: "cyber" },
  { q: "Which tool is used for network packet analysis?", options: ["Nmap", "Wireshark", "Metasploit", "Burp Suite"], answer: 1, category: "cyber" },
  { q: "What does VPN stand for?", options: ["Virtual Private Network", "Virtual Public Network", "Visual Private Network", "Verified Private Network"], answer: 0, category: "tech" },
  { q: "Which protocol is used for sending emails?", options: ["FTP", "HTTP", "SMTP", "SSH"], answer: 2, category: "tech" },
  { q: "What is a 'zero-day' vulnerability?", options: ["A bug found on day zero of development", "An unknown exploit with no patch", "A virus that activates at midnight", "A deleted security log"], answer: 1, category: "cyber" },
  { q: "What does the 'ping' command measure?", options: ["Bandwidth", "Latency", "DNS resolution", "Packet loss only"], answer: 1, category: "tech" },
  { q: "Which language is most associated with web browsers?", options: ["Python", "Java", "JavaScript", "C++"], answer: 2, category: "tech" },
  { q: "What is phishing?", options: ["A type of DDoS attack", "Social engineering via fake emails/sites", "A network scanning method", "A firewall bypass technique"], answer: 1, category: "cyber" },
  { q: "What does RAM stand for?", options: ["Read Access Memory", "Random Access Memory", "Rapid Action Module", "Runtime Application Memory"], answer: 1, category: "tech" },
  { q: "Which Linux command lists directory contents?", options: ["dir", "ls", "show", "list"], answer: 1, category: "tech" },
  { q: "What is the default SSH port?", options: ["21", "22", "23", "25"], answer: 1, category: "cyber" },
  { q: "What does DDoS stand for?", options: ["Direct Denial of Service", "Distributed Denial of Service", "Digital Denial of System", "Dynamic Denial of Server"], answer: 1, category: "cyber" },
  { q: "What is the purpose of a firewall?", options: ["Speed up internet", "Encrypt all data", "Filter network traffic", "Store passwords"], answer: 2, category: "cyber" },
  { q: "What does API stand for?", options: ["Application Programming Interface", "Automated Program Integration", "Advanced Protocol Interface", "Application Process Integration"], answer: 0, category: "tech" },
  // General Knowledge
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1, category: "general" },
  { q: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: 2, category: "general" },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2, category: "general" },
  { q: "What year did the first iPhone release?", options: ["2005", "2006", "2007", "2008"], answer: 2, category: "general" },
  { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Van Gogh"], answer: 1, category: "general" },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3, category: "general" },
  { q: "How many bones are in the adult human body?", options: ["186", "206", "216", "256"], answer: 1, category: "general" },
  { q: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: 2, category: "general" },
  { q: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: 2, category: "general" },
  { q: "What is the speed of light (approx)?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], answer: 0, category: "general" },
  // Movies & Pop Culture
  { q: "Who directed 'Inception'?", options: ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Ridley Scott"], answer: 1, category: "movies" },
  { q: "What is the name of the AI in '2001: A Space Odyssey'?", options: ["ARIA", "JARVIS", "HAL 9000", "WOPR"], answer: 2, category: "movies" },
  { q: "Which movie features the quote 'I'll be back'?", options: ["RoboCop", "Die Hard", "The Terminator", "Predator"], answer: 2, category: "movies" },
  { q: "In 'The Matrix', what color pill does Neo take?", options: ["Blue", "Red", "Green", "Yellow"], answer: 1, category: "movies" },
  { q: "Which fictional company does Iron Man run?", options: ["Wayne Enterprises", "Stark Industries", "Oscorp", "LexCorp"], answer: 1, category: "movies" },
  // Fun & Random
  { q: "What is the most popular programming language (2024)?", options: ["Python", "JavaScript", "Java", "C++"], answer: 0, category: "tech" },
  { q: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "High Tech Transfer Process", "Hyper Terminal Transfer Protocol", "Host Transfer Text Protocol"], answer: 0, category: "tech" },
  { q: "Which company created the Android OS?", options: ["Apple", "Microsoft", "Google", "Samsung"], answer: 2, category: "tech" },
  { q: "What is 'localhost' IP address?", options: ["192.168.1.1", "10.0.0.1", "127.0.0.1", "0.0.0.0"], answer: 2, category: "tech" },
  { q: "What animal is the Linux mascot?", options: ["Fox", "Penguin", "Cat", "Dog"], answer: 1, category: "tech" },
  { q: "How many bits in a byte?", options: ["4", "8", "16", "32"], answer: 1, category: "tech" },
  { q: "What is the hardest natural substance?", options: ["Titanium", "Quartz", "Diamond", "Sapphire"], answer: 2, category: "general" },
  { q: "What year was the World Wide Web invented?", options: ["1985", "1989", "1991", "1995"], answer: 1, category: "tech" },
  { q: "Which country has the most internet users?", options: ["USA", "India", "China", "Brazil"], answer: 2, category: "general" },
  { q: "What does 'GPU' stand for?", options: ["General Processing Unit", "Graphics Processing Unit", "Global Processing Unit", "Graphical Power Unit"], answer: 1, category: "tech" },
  { q: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], answer: 1, category: "general" },
  { q: "Which key combination is 'Undo' on Windows?", options: ["Ctrl+Z", "Ctrl+X", "Ctrl+U", "Ctrl+Y"], answer: 0, category: "tech" },
  { q: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Syntax"], answer: 1, category: "tech" },
  { q: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], answer: 1, category: "general" },
  { q: "What is the binary representation of the number 10?", options: ["1010", "1100", "1001", "1110"], answer: 0, category: "tech" },
  { q: "Who founded SpaceX?", options: ["Jeff Bezos", "Elon Musk", "Richard Branson", "Bill Gates"], answer: 1, category: "general" },
  { q: "What is the most spoken language in the world?", options: ["English", "Spanish", "Hindi", "Mandarin Chinese"], answer: 3, category: "general" },
  { q: "In which year did Bitcoin launch?", options: ["2007", "2008", "2009", "2010"], answer: 2, category: "tech" },
  { q: "What does 'IoT' stand for?", options: ["Internet of Things", "Integration of Tech", "Internal of Terminals", "Internet of Terminals"], answer: 0, category: "tech" },
];

// ========== Speed Type Prompts ==========
const TYPE_PROMPTS = [
  "The quick brown fox jumps over the lazy dog",
  "sudo apt update && sudo apt upgrade -y",
  "console.log('Hello, World!');",
  "SELECT * FROM users WHERE active = true;",
  "git commit -m 'fix: resolve critical security bug'",
  "nmap -sV -sC -oN scan.txt 192.168.1.0/24",
  "All your base are belong to us",
  "import hashlib; print(hashlib.sha256(b'password').hexdigest())",
  "The five boxing wizards jump quickly at dawn",
  "docker run -d -p 3000:3000 --name app my-image",
  "while true; do echo 'hacking...'; sleep 1; done",
  "curl -X POST https://api.example.com/data -H 'Content-Type: application/json'",
  "function encrypt(data, key) { return cipher(data, key); }",
  "Pack my box with five dozen liquor jugs",
  "ssh -i ~/.ssh/id_rsa admin@192.168.1.100",
  "The matrix has you. Follow the white rabbit.",
  "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys",
  "Every great developer was once a beginner who refused to give up",
  "python3 -m http.server 8080 --bind 0.0.0.0",
  "rm -rf node_modules && npm install --legacy-peer-deps",
];

// ========== Emoji Charades Words ==========
const CHARADES_WORDS = [
  "pizza", "rocket", "ghost", "rainbow", "sunset", "dancing", "basketball",
  "sleeping", "swimming", "airplane", "birthday", "wedding", "earthquake",
  "volcano", "snowman", "surfing", "camping", "fishing", "painting",
  "singing", "cooking", "running", "reading", "driving", "shopping",
  "football", "guitar", "diamond", "treasure", "pirate", "zombie",
  "dragon", "unicorn", "wizard", "robot", "alien", "ninja", "samurai",
  "cowboy", "detective", "firefighter", "astronaut", "superhero",
  "thunderstorm", "beach", "mountain", "jungle", "desert", "ocean"
];

// ========== Would You Rather Prompts ==========
const WYR_PROMPTS = [
  { a: "Have super speed", b: "Have super strength" },
  { a: "Be able to fly", b: "Be able to turn invisible" },
  { a: "Live without music", b: "Live without movies" },
  { a: "Always speak the truth", b: "Always detect lies" },
  { a: "Have unlimited WiFi everywhere", b: "Have unlimited battery life" },
  { a: "Be a master hacker", b: "Be a master social engineer" },
  { a: "Know every programming language", b: "Know every spoken language" },
  { a: "Live in the future (2200)", b: "Live in the past (1800)" },
  { a: "Have a photographic memory", b: "Have the ability to forget anything at will" },
  { a: "Be famous but poor", b: "Be unknown but rich" },
  { a: "Debug code for 8 hours", b: "Write documentation for 8 hours" },
  { a: "Only use dark mode forever", b: "Only use light mode forever" },
  { a: "Have no bugs in your code", b: "Have 10x faster coding speed" },
  { a: "Work from anywhere", b: "Work at your dream company" },
  { a: "Know when you will die", b: "Know how you will die" },
  { a: "Travel to space", b: "Travel to the bottom of the ocean" },
  { a: "Have free food for life", b: "Have free travel for life" },
  { a: "Be the smartest person alive", b: "Be the happiest person alive" },
  { a: "Live without internet", b: "Live without air conditioning" },
  { a: "Fight 100 duck-sized horses", b: "Fight 1 horse-sized duck" },
  { a: "Have a rewind button for life", b: "Have a pause button for life" },
  { a: "Speak every language", b: "Play every instrument" },
  { a: "Read minds", b: "Control minds" },
  { a: "Never use a mouse again", b: "Never use a keyboard again" },
  { a: "Be a pentester", b: "Be a threat analyst" },
  { a: "Live in a simulation", b: "Live in the real world knowing it's boring" },
  { a: "Have unlimited storage", b: "Have unlimited RAM" },
  { a: "Master cybersecurity", b: "Master AI/ML" },
  { a: "Always have the latest phone", b: "Always have the fastest laptop" },
  { a: "Be stuck in a time loop", b: "Be stuck in a parallel universe" },
];

// ========== MIME TYPES ==========
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ========== HTTP SERVER ==========
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // CORS headers for cross-origin requests from GitHub Pages
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
            if (!data.message || !data.message.trim()) return jsonRes(400, { error: 'Message required' });
            const entry = db.addGuestbookEntry(data.name, data.message, data.link);
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
            if (!question || !question.trim()) return jsonRes(400, { error: 'Question required' });
            const item = db.addQuestion(question);
            return jsonRes(201, item);
          } catch (e) { return jsonRes(400, { error: 'Invalid payload' }); }
        });
        return;
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


  // Security check — prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if requested file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If endpoint is /status, return server telemetry JSON
      if (reqPath === '/status') {
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

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// ========== GAME HELPERS ==========
function initGameState(gameType) {
  return {
    gameType,
    active: false,
    scores: {},         // username → score
    currentRound: 0,
    totalRounds: 10,
    roundActive: false,
    roundTimer: null,
    roundData: null,    // current question/prompt
    roundAnswers: {},   // username → answer (for dedup)
    usedIndices: [],    // track used questions/prompts
  };
}

function pickRandom(arr, usedIndices) {
  const available = arr.map((_, i) => i).filter(i => !usedIndices.includes(i));
  if (available.length === 0) {
    // Reset if all used
    usedIndices.length = 0;
    return Math.floor(Math.random() * arr.length);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);
  return idx;
}

function startGameRound(room) {
  const game = room.game;
  if (!game || !game.active) return;

  game.currentRound++;
  game.roundActive = true;
  game.roundAnswers = {};

  let roundData;

  switch (game.gameType) {
    case 'trivia': {
      const idx = pickRandom(TRIVIA_QUESTIONS, game.usedIndices);
      const q = TRIVIA_QUESTIONS[idx];
      roundData = {
        question: q.q,
        options: q.options,
        category: q.category,
        answer: q.answer, // kept server-side
        timeLimit: 15000,
      };
      // Send question WITHOUT the answer
      broadcast(room, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        question: q.q,
        options: q.options,
        category: q.category,
        timeLimit: 15000,
      });
      // Auto-end round after time limit
      game.roundTimer = setTimeout(() => endTriviaRound(room), 15500);
      break;
    }

    case 'typingrace': {
      const idx = pickRandom(TYPE_PROMPTS, game.usedIndices);
      const prompt = TYPE_PROMPTS[idx];
      roundData = { prompt, timeLimit: 30000 };
      broadcast(room, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        prompt,
        timeLimit: 30000,
      });
      // Auto-end round after time limit
      game.roundTimer = setTimeout(() => endTypingRound(room), 30500);
      break;
    }

    case 'charades': {
      const idx = pickRandom(CHARADES_WORDS, game.usedIndices);
      const word = CHARADES_WORDS[idx];
      // Pick a describer — rotate through members
      const describerIdx = (game.currentRound - 1) % room.members.length;
      const describer = room.members[describerIdx];
      roundData = { word, describer: describer.username, timeLimit: 45000 };

      // Send word ONLY to describer
      sendTo(describer.ws, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        role: 'describer',
        word,
        timeLimit: 45000,
      });
      // Send to others that they need to guess
      for (const m of room.members) {
        if (m.ws !== describer.ws) {
          sendTo(m.ws, {
            type: 'game-round',
            round: game.currentRound,
            totalRounds: game.totalRounds,
            role: 'guesser',
            describer: describer.username,
            timeLimit: 45000,
          });
        }
      }
      game.roundTimer = setTimeout(() => endCharadesRound(room, null), 45500);
      break;
    }

    case 'wyr': {
      const idx = pickRandom(WYR_PROMPTS, game.usedIndices);
      const prompt = WYR_PROMPTS[idx];
      roundData = { optionA: prompt.a, optionB: prompt.b, timeLimit: 15000 };
      broadcast(room, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        optionA: prompt.a,
        optionB: prompt.b,
        timeLimit: 15000,
      });
      game.roundTimer = setTimeout(() => endWYRRound(room), 15500);
      break;
    }
  }

  game.roundData = roundData;
}

function endTriviaRound(room) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  const correctAnswer = game.roundData.answer;

  broadcast(room, {
    type: 'game-round-end',
    correctAnswer,
    scores: game.scores,
    round: game.currentRound,
  });

  // Next round or end
  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 3500);
  }
}

function endTypingRound(room) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-round-end',
    scores: game.scores,
    round: game.currentRound,
    results: game.roundAnswers,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 3500);
  }
}

function endCharadesRound(room, winner) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-round-end',
    word: game.roundData.word,
    winner: winner || null,
    scores: game.scores,
    round: game.currentRound,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 4000);
  }
}

function endWYRRound(room) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  // Tally votes
  let votesA = 0, votesB = 0;
  for (const v of Object.values(game.roundAnswers)) {
    if (v === 'a') votesA++;
    else if (v === 'b') votesB++;
  }

  broadcast(room, {
    type: 'game-round-end',
    votesA, votesB,
    totalVotes: votesA + votesB,
    round: game.currentRound,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 4000);
  }
}

function endGame(room) {
  const game = room.game;
  if (!game) return;
  game.active = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-over',
    scores: game.scores,
    gameType: game.gameType,
  });
}


// ========== WEBSOCKET SERVER ==========
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).slice(2, 10);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

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
          // Broadcast to all other presence clients
          const payload = JSON.stringify({ type: 'presence-update', id: p.id, color: p.color, name: p.name, x: p.x, y: p.y });
          for (const [clientWs] of presenceClients) {
            if (clientWs !== ws && clientWs.readyState === 1) {
              clientWs.send(payload);
            }
          }
        }
        break;
      }

      case 'presence-chat': {
        const p = presenceClients.get(ws);
        if (p) {
          const payload = JSON.stringify({ type: 'presence-chat', id: p.id, text: msg.text });
          for (const [clientWs] of presenceClients) {
            if (clientWs !== ws && clientWs.readyState === 1) {
              clientWs.send(payload);
            }
          }
        }
        break;
      }

      // ---- Shared Whiteboard ----
      case 'draw-init': {
        sendTo(ws, { type: 'draw-history', strokes: db.getStrokes() });
        break;
      }

      case 'draw-stroke': {
        const stroke = { x0: msg.x0, y0: msg.y0, x1: msg.x1, y1: msg.y1, color: msg.color, size: msg.size };
        db.addStroke(stroke);

        const payload = JSON.stringify({ type: 'draw-stroke', ...stroke });
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(payload);
          }
        });
        break;
      }

      case 'draw-clear': {
        db.clearStrokes();
        const payload = JSON.stringify({ type: 'draw-clear' });
        wss.clients.forEach(client => {
          if (client.readyState === 1) client.send(payload);
        });
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
        removeMember(ws);

        const code = generateCode();
        const username = msg.username || randomUsername();
        const room = {
          code,
          type: msg.roomType || 'jam',
          members: [{
            ws, id: clientId, username, isHost: true,
          }],
          playback: {
            trackId: null,
            isPlaying: false,
            positionAtOrigin: 0,
            originServerTime: serverNow(),
          },
          queue: [],
          game: null,
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
        const code = (msg.code || '').toLowerCase().trim();
        const room = rooms.get(code);

        if (!room) {
          sendTo(ws, { type: 'error', message: 'Room not found' });
          break;
        }

        removeMember(ws);

        const username = msg.username || randomUsername();
        room.members.push({
          ws, id: clientId, username, isHost: false,
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
        const room = getRoom(ws);
        if (!room || !msg.text) break;

        const member = room.members.find(m => m.ws === ws);
        const username = member ? member.username : 'anon';

        broadcast(room, {
          type: 'chat',
          user: username,
          text: msg.text.slice(0, 500), // limit message length
          timestamp: Date.now(),
        });
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
