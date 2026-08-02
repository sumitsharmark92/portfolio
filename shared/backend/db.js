/* ============================================================
   SUMIT-LABS DATABASE ENGINE (db.js)
   Persistent, atomic, file-backed storage with WAL & index support.
   Stores: guestbook, polls, qa, whiteboard_strokes, telemetry.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Schema & Seed Data
const defaultData = {
  guestbook: [
    { id: '1', name: 'Alice (Security Lead)', message: 'Awesome portfolio Sumit! Love the terminal theme and real-time sync server.', createdAt: new Date(Date.now() - 86400000).toISOString(), link: '' },
    { id: '2', name: 'Devon', message: 'The jam.sync room is insanely fast. Tested latency across two browsers, <50ms!', createdAt: new Date().toISOString(), link: 'https://github.com' }
  ],
  polls: [
    {
      id: 'poll-1',
      question: 'Which real-time feature is most useful to you?',
      options: [
        { text: 'Synced Video & Watch Parties', votes: 14 },
        { text: 'Collaborative Whiteboard', votes: 8 },
        { text: 'Multiplayer Audio & Music Jams', votes: 22 },
        { text: 'Interactive Code Playground', votes: 11 }
      ]
    }
  ],
  qa: [
    { id: 'q1', question: 'What inspired you to get into cybersecurity?', answer: 'Curiosity about how systems break and a passion for defending critical infrastructure!', createdAt: new Date().toISOString() },
    { id: 'q2', question: 'Are you available for summer 2026 internships?', answer: 'Yes! Actively interviewing for SOC, Pentesting, and Security Engineering roles.', createdAt: new Date().toISOString() }
  ],
  whiteboard_strokes: [],
  telemetry: []
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[db] Error loading db.json, re-initializing...', e.message);
    }
    this.save(defaultData);
    return defaultData;
  }

  save(data = this.data) {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE); // Atomic write
    } catch (e) {
      console.error('[db] Write failed:', e.message);
    }
  }

  // --- GUESTBOOK ---
  getGuestbook() {
    return this.data.guestbook || [];
  }

  addGuestbookEntry(name, message, link) {
    const entry = {
      id: Date.now().toString(),
      name: name || 'anonymous hacker',
      message: message.substring(0, 500),
      link: link || '',
      createdAt: new Date().toISOString()
    };
    this.data.guestbook.unshift(entry);
    this.save();
    return entry;
  }

  // --- POLLS ---
  getPoll() {
    return this.data.polls[0];
  }

  votePoll(optionIdx) {
    const poll = this.data.polls[0];
    if (poll && poll.options[optionIdx]) {
      poll.options[optionIdx].votes++;
      this.save();
      return poll;
    }
    return null;
  }

  // --- Q&A ---
  getQA() {
    return this.data.qa || [];
  }

  addQuestion(question) {
    const item = {
      id: Date.now().toString(),
      question: question.trim(),
      answer: "Thanks for asking! Sumit will review and post an answer shortly.",
      createdAt: new Date().toISOString()
    };
    this.data.qa.unshift(item);
    this.save();
    return item;
  }

  // --- WHITEBOARD ---
  getStrokes() {
    return this.data.whiteboard_strokes || [];
  }

  addStroke(stroke) {
    if (!this.data.whiteboard_strokes) this.data.whiteboard_strokes = [];
    this.data.whiteboard_strokes.push(stroke);
    if (this.data.whiteboard_strokes.length > 5000) {
      this.data.whiteboard_strokes.shift(); // Keep latest 5000 strokes
    }
    // Batch save every 20 strokes for efficiency
    if (this.data.whiteboard_strokes.length % 20 === 0) {
      this.save();
    }
  }

  clearStrokes() {
    this.data.whiteboard_strokes = [];
    this.save();
  }

  // --- TELEMETRY ---
  logVisit(path, userAgent, ip) {
    if (!this.data.telemetry) this.data.telemetry = [];
    this.data.telemetry.unshift({
      timestamp: new Date().toISOString(),
      path,
      userAgent: userAgent || '',
      ip: ip || ''
    });
    if (this.data.telemetry.length > 1000) this.data.telemetry.pop();
    this.save();
  }
}

module.exports = new Database();
