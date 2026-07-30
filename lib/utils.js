const { performance } = require('perf_hooks');

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

const ANIMAL_NAMES = ['Ghost', 'Cipher', 'Shadow', 'Neon', 'Valkyrie', 'Phoenix', 'Nexus', 'Apex', 'Spectre', 'Zero'];
const COLORS = ['#00ff41', '#00d4ff', '#ff0055', '#ffcc00', '#a855f7'];

function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomUsername() {
  const { ADJECTIVES } = require('./game-data.js');
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}_${num}`;
}

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

const rateLimitStore = new Map();
function rateLimit(ip, maxReqs, windowMs) {
  const now = Date.now();
  if (!rateLimitStore.has(ip)) rateLimitStore.set(ip, []);
  const timestamps = rateLimitStore.get(ip).filter(t => now - t < windowMs);
  if (timestamps.length >= maxReqs) return false;
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  return true;
}

const WS_SCHEMAS = {
  'play': { trackId: 1, position: 0 },
  'pause': {},
  'seek': { position: 1 },
  'load-track': { trackId: 1 },
  'queue-add': { track: 1 },
  'queue-remove': { videoId: 1 },
  'skip': {},
  'chat': { text: 1 },
  'typing': {},
  'reaction': { emoji: 1, messageId: 1 },
  'create-room': {},
  'join-room': { code: 1 },
  'leave-room': {},
  'request-state': {},
  'game-start': { gameType: 1 },
  'game-answer': { answer: 1 },
  'game-typing-progress': { progress: 1, wpm: 0 },
  'game-typing-finish': { wpm: 0, accuracy: 0, timeTaken: 0 },
  'game-charades-emoji': { emoji: 1 },
  'game-charades-guess': { guess: 1 },
  'game-vote': { vote: 1 },
  'game-stop': {},
  'draw-init': {},
  'draw-stroke': { x0: 1, y0: 1, x1: 1, y1: 1, color: 1, size: 1 },
  'draw-clear': {},
  'presence-join': {},
  'presence-move': { x: 1, y: 1 },
  'presence-chat': { text: 1 },
  'ping': { pingId: 1 },
};

function validateWSMessage(msg) {
  if (!msg || typeof msg !== 'object' || !msg.type) return false;
  const schema = WS_SCHEMAS[msg.type];
  if (!schema) return false;
  for (const [key, required] of Object.entries(schema)) {
    if (required && (msg[key] === undefined || msg[key] === null)) return false;
  }
  return true;
}

function pickRandom(arr, usedIndices) {
  const available = arr.map((_, i) => i).filter(i => !usedIndices.includes(i));
  if (available.length === 0) {
    usedIndices.length = 0;
    return Math.floor(Math.random() * arr.length);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);
  return idx;
}

function initGameState(gameType) {
  return {
    gameType,
    active: false,
    scores: {},
    currentRound: 0,
    totalRounds: 10,
    roundActive: false,
    roundTimer: null,
    roundData: null,
    roundAnswers: {},
    usedIndices: [],
  };
}

module.exports = {
  MIME_TYPES,
  ANIMAL_NAMES,
  COLORS,
  getRandomElement,
  randomUsername,
  generateCode,
  serverNow,
  sendTo,
  broadcast,
  rateLimit,
  WS_SCHEMAS,
  validateWSMessage,
  pickRandom,
  initGameState,
};
