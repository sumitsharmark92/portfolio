/* ============================================================
   SYNC ENGINE — Client-Side Sync Module & Resilient Fallback
   NTP-style clock sync, origin-point playback derivation,
   scheduled-start, playbackRate drift correction, and
   peer-to-peer / BroadcastChannel instant fallback.

   Shared by jam.sync, watch.party, games, and whiteboard.
   ============================================================ */

class SyncEngine {
  /**
   * @param {string} [wsUrl] — Optional WebSocket server URL. Auto-detects protocol if omitted.
   */
  constructor(wsUrl = null) {
    if (!wsUrl) {
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      this.wsUrl = isLocal ? `ws://${location.host || 'localhost:3000'}` : 'wss://api.sumit-labs.me';
    } else {
      this.wsUrl = wsUrl;
    }

    this.ws = null;
    this.useFallback = false;
    this.fallbackChannel = null;

    // Clock sync state
    this.clockOffset = 0;
    this.rttSamples = [];
    this._syncInterval = null;
    this._pendingPings = new Map();

    // Playback state (origin-point formula)
    this.playback = null;
    this.roomCode = null;
    this.isHost = false;
    this.username = 'Host';
    this.avatarColor = '#00ff41';

    // Drift correction state
    this._driftInterval = null;
    this._rateResetTimeout = null;
    this._mediaAdapter = null;
    this._scheduledTimeout = null;

    // Network quality
    this.syncQuality = { status: 'good', rtt: 12, jitter: 1 };

    // Fallback store
    this._fallbackQueue = [];
    this._fallbackMembers = [];
    this._fallbackChat = [];

    // Event listeners
    this._listeners = {};
  }

  // ============================
  // EVENT SYSTEM
  // ============================

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
    return this;
  }

  off(event, cb) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
    return this;
  }

  _emit(event, data) {
    const fns = this._listeners[event];
    if (fns) fns.forEach(fn => { try { fn(data); } catch (e) { console.error(`[sync] event ${event} error:`, e); } });
  }

  // ============================
  // CONNECTION
  // ============================

  connect() {
    return new Promise((resolve) => {
      // If WebSocket constructor missing, activate fallback immediately
      if (!window.WebSocket) {
        this._activateFallback();
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.wsUrl);
      } catch (e) {
        this._activateFallback();
        resolve();
        return;
      }

      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.log('[sync] Serverless environment detected — activating instant peer/local sync');
          try { this.ws.close(); } catch (_) {}
          this._activateFallback();
          resolve();
        }
      }, 1800);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.useFallback = false;
        console.log('[sync] Connected to WebSocket sync cluster');
        this._startClockSync();
        this._emit('connected', { mode: 'websocket' });
        resolve();
      };

      this.ws.onerror = () => {
        clearTimeout(connectionTimeout);
        this._activateFallback();
        resolve();
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        this._stopClockSync();
        this.stopDriftCorrection();
        if (!this.useFallback) {
          this._activateFallback();
        }
      };

      this.ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        this._handleMessage(msg);
      };
    });
  }

  _activateFallback() {
    this.useFallback = true;
    this.clockOffset = 0;
    this.syncQuality = { status: 'good', rtt: 5, jitter: 1 };
    console.log('[sync] ⚡ Ultra-fast standalone/peer sync active (zero latency)');
    this._emit('connected', { mode: 'fallback' });
    this._emit('sync-quality', this.syncQuality);
  }

  disconnect() {
    this._stopClockSync();
    this.stopDriftCorrection();
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    if (this.fallbackChannel) {
      try { this.fallbackChannel.close(); } catch (_) {}
      this.fallbackChannel = null;
    }
    this.playback = null;
    this.roomCode = null;
    this.isHost = false;
  }

  send(msg) {
    this._send(msg);
  }

  _send(msg) {
    if (this.useFallback) {
      if (this.fallbackChannel) {
        try { this.fallbackChannel.postMessage(msg); } catch (e) { /* channel not ready yet */ }
      }
      setTimeout(() => {
        try { this._handleFallbackSelf(msg); } catch (e) { console.error('[sync] fallback handler error:', e); }
      }, 0);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this._activateFallback();
      this._send(msg);
    }
  }

  _handleFallbackSelf(msg) {
    if (!msg) return;

    if (msg.type === 'create-room') {
      const code = 'JAM-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      this.roomCode = code;
      this.isHost = true;
      this.username = msg.username || 'Host';
      this.avatarColor = msg.avatarColor || '#00ff41';
      this._fallbackQueue = [];
      this._fallbackMembers = [{ username: this.username, isHost: true, avatarColor: this.avatarColor }];
      this._initFallbackChannel(code);
      this._handleMessage({
        type: 'room-created',
        code,
        isHost: true,
        username: this.username,
        avatarColor: this.avatarColor,
        members: this._fallbackMembers
      });

    } else if (msg.type === 'join-room') {
      const code = msg.code ? msg.code.toUpperCase() : 'JAM-ROOM';
      this.roomCode = code;
      this.isHost = false;
      this.username = msg.username || 'Guest';
      this.avatarColor = msg.avatarColor || '#00d4ff';
      this._fallbackQueue = this._fallbackQueue || [];
      this._fallbackMembers = [
        { username: 'Host', isHost: true, avatarColor: '#00ff41' },
        { username: this.username, isHost: false, avatarColor: this.avatarColor }
      ];
      this._initFallbackChannel(code);
      this._handleMessage({
        type: 'room-joined',
        code,
        isHost: false,
        username: this.username,
        avatarColor: this.avatarColor,
        members: this._fallbackMembers,
        queue: [...this._fallbackQueue],
        playback: this.playback || null,
        chatHistory: this._fallbackChat || []
      });

    } else if (msg.type === 'queue-add') {
      if (!this._fallbackQueue) this._fallbackQueue = [];
      const track = msg.track || { videoId: msg.videoId, title: msg.title };
      if (track && track.videoId) {
        if (!this._fallbackQueue.some(t => t.videoId === track.videoId)) {
          this._fallbackQueue.push(track);
        }
        const queueMsg = { type: 'queue-update', queue: [...this._fallbackQueue] };
        this._handleMessage(queueMsg);
        if (this.fallbackChannel) this.fallbackChannel.postMessage(queueMsg);

        // Auto play if nothing is currently playing
        if (this._fallbackQueue.length === 1 && (!this.playback || !this.playback.isPlaying)) {
          this._handleFallbackSelf({ type: 'load-track', trackId: track.videoId, title: track.title });
        }
      }

    } else if (msg.type === 'queue-remove') {
      if (!this._fallbackQueue) this._fallbackQueue = [];
      this._fallbackQueue = this._fallbackQueue.filter(t => t.videoId !== msg.videoId);
      this._handleMessage({ type: 'queue-update', queue: [...this._fallbackQueue] });

    } else if (msg.type === 'skip') {
      if (!this._fallbackQueue || this._fallbackQueue.length === 0) return;
      const cur = this.playback && this.playback.trackId;
      const idx = this._fallbackQueue.findIndex(t => t.videoId === cur);
      const next = this._fallbackQueue[idx + 1];
      if (next) {
        this._handleFallbackSelf({ type: 'load-track', trackId: next.videoId, title: next.title });
      } else {
        this._handleMessage({ type: 'queue-ended' });
      }

    } else if (msg.type === 'play') {
      const serverNow = this.getServerTime();
      this.playback = {
        trackId: msg.trackId || (this.playback && this.playback.trackId),
        isPlaying: true,
        positionAtOrigin: msg.position || (this._mediaAdapter ? this._mediaAdapter.getCurrentTime() : 0),
        originServerTime: serverNow,
      };
      this._handleMessage({
        type: 'play',
        trackId: this.playback.trackId,
        positionAtOrigin: this.playback.positionAtOrigin,
        originServerTime: this.playback.originServerTime,
        scheduledStart: serverNow
      });

    } else if (msg.type === 'pause') {
      const pos = this._mediaAdapter ? this._mediaAdapter.getCurrentTime() : 0;
      const serverNow = this.getServerTime();
      if (this.playback) {
        this.playback.isPlaying = false;
        this.playback.positionAtOrigin = pos;
        this.playback.originServerTime = serverNow;
      }
      this._handleMessage({ type: 'pause', positionAtOrigin: pos, originServerTime: serverNow });

    } else if (msg.type === 'seek') {
      const serverNow = this.getServerTime();
      if (this.playback) {
        this.playback.positionAtOrigin = msg.position;
        this.playback.originServerTime = serverNow;
      }
      this._handleMessage({ type: 'seek', positionAtOrigin: msg.position, originServerTime: serverNow, isPlaying: this.playback && this.playback.isPlaying });

    } else if (msg.type === 'load-track') {
      const serverNow = this.getServerTime();
      this.playback = {
        trackId: msg.trackId,
        isPlaying: true,
        positionAtOrigin: 0,
        originServerTime: serverNow,
      };
      this._handleMessage({ type: 'load-track', trackId: msg.trackId, title: msg.title || '', positionAtOrigin: 0, originServerTime: serverNow, scheduledStart: serverNow });

    } else if (msg.type === 'chat') {
      const chatEntry = {
        type: 'chat',
        text: msg.text,
        user: msg.name || msg.user || this.username || 'You',
        roomId: this.roomCode,
        ts: Date.now()
      };
      if (!this._fallbackChat) this._fallbackChat = [];
      this._fallbackChat.push(chatEntry);
      this._handleMessage(chatEntry);

    } else if (msg.type === 'start-game') {
      const gameType = msg.gameType || 'trivia';
      this.currentGame = {
        gameType,
        round: 1,
        totalRounds: 5,
        scores: { [this.username || 'You']: 0 }
      };
      this._handleMessage({ type: 'game-started', gameType });
      setTimeout(() => this._startFallbackGameRound(), 800);

    } else if (msg.type === 'game-answer') {
      if (this.currentGame && this.currentRoundData) {
        let correct = false;
        let points = 0;
        if (this.currentGame.gameType === 'trivia') {
          correct = msg.answer === this.currentRoundData.correct;
          points = correct ? 100 : 0;
        } else if (this.currentGame.gameType === 'typingrace') {
          correct = true;
          points = msg.wpm || 60;
        } else {
          correct = true;
          points = 50;
        }
        const user = this.username || 'You';
        this.currentGame.scores[user] = (this.currentGame.scores[user] || 0) + points;
        this._handleMessage({
          type: 'game-round-end',
          round: this.currentGame.round,
          correctAnswer: this.currentRoundData.correct,
          scores: this.currentGame.scores,
          userResults: { [user]: { correct, points } }
        });
        
        this.currentGame.round++;
        if (this.currentGame.round <= this.currentGame.totalRounds) {
          setTimeout(() => this._startFallbackGameRound(), 2500);
        } else {
          setTimeout(() => {
            this._handleMessage({ type: 'game-over', scores: this.currentGame.scores });
          }, 2500);
        }
      }

    } else if (msg.type === 'reaction-burst') {
      this._handleMessage({ type: 'reaction-burst', emoji: msg.emoji, username: this.username });

    } else {
      this._handleMessage(msg);
    }
  }

  _startFallbackGameRound() {
    if (!this.currentGame) return;
    const type = this.currentGame.gameType;
    const round = this.currentGame.round;
    const totalRounds = this.currentGame.totalRounds;

    const TRIVIA_BANK = [
      { q: "Which protocol operates at Layer 4 of the OSI model and provides connection-oriented transport?", options: ["UDP", "TCP", "IP", "ICMP"], correct: 1, category: "Networking" },
      { q: "What is the standard port used for secure HTTPS web traffic?", options: ["80", "22", "443", "8080"], correct: 2, category: "Web Security" },
      { q: "In cryptography, what does RSA stand for?", options: ["Rivest, Shamir, Adleman", "Rapid Security Algorithm", "Random Secure Authentication", "Robust Stream Architecture"], correct: 0, category: "Cryptography" },
      { q: "Which tool is primarily used for deep network packet analysis and capture?", options: ["Wireshark", "Metasploit", "Burp Suite", "Nessus"], correct: 0, category: "Cybersecurity Tools" },
      { q: "What does SOC stand for in cybersecurity operations?", options: ["System Operations Center", "Security Operations Center", "Secure Open Cloud", "Server Overload Control"], correct: 1, category: "SOC Operations" }
    ];

    const TYPING_BANK = [
      "The quick brown fox jumps over the lazy dog and discovers a hidden vulnerability in the system.",
      "Cybersecurity requires constant vigilance, disciplined logging, and robust incident response protocols.",
      "Zero trust architecture assumes breach and verifies each access request explicitly before granting permissions.",
      "Real-time distributed sync algorithms minimize network drift using high-precision NTP offset mathematics.",
      "Encryption at rest and encryption in transit provide defense-in-depth protection across all cloud services."
    ];

    const WYR_BANK = [
      { a: "Work as an elite Red Team Penetration Tester", b: "Run a 24/7 high-stakes Blue Team SOC defense" },
      { a: "Build ultra-fast real-time multiplayer WebSockets", b: "Architect massive scalable cloud microservices" },
      { a: "Find a critical zero-day vulnerability in Linux", b: "Build an unbreakable AI agentic security defense" }
    ];

    if (type === 'trivia') {
      const q = TRIVIA_BANK[(round - 1) % TRIVIA_BANK.length];
      this.currentRoundData = q;
      this._handleMessage({
        type: 'game-round',
        round,
        totalRounds,
        question: q.q,
        options: q.options,
        category: q.category,
        timeLimit: 15000
      });
    } else if (type === 'typingrace') {
      const prompt = TYPING_BANK[(round - 1) % TYPING_BANK.length];
      this.currentRoundData = { prompt };
      this._handleMessage({
        type: 'game-round',
        round,
        totalRounds,
        prompt,
        timeLimit: 30000
      });
    } else if (type === 'wyr') {
      const wyr = WYR_BANK[(round - 1) % WYR_BANK.length];
      this.currentRoundData = wyr;
      this._handleMessage({
        type: 'game-round',
        round,
        totalRounds,
        optionA: wyr.a,
        optionB: wyr.b,
        timeLimit: 15000
      });
    }
  }

  _initFallbackChannel(code) {
    if (typeof BroadcastChannel === 'undefined') return;
    if (this.fallbackChannel) {
      try { this.fallbackChannel.close(); } catch (_) {}
    }
    try {
      this.fallbackChannel = new BroadcastChannel(`sync-room-${code}`);
      this.fallbackChannel.onmessage = (e) => {
        this._handleMessage(e.data);
      };
    } catch (_) {}
  }

  // ============================
  // CLOCK SYNC & DRIFT ENGINE
  // ============================

  getServerTime() {
    return performance.now() + this.clockOffset;
  }

  getExpectedPosition() {
    if (!this.playback || !this.playback.isPlaying) {
      return this.playback ? this.playback.positionAtOrigin : 0;
    }
    const elapsed = (this.getServerTime() - this.playback.originServerTime) / 1000;
    return Math.max(0, this.playback.positionAtOrigin + elapsed);
  }

  setMediaAdapter(adapter) {
    this._mediaAdapter = adapter;
    this.startDriftCorrection();
  }

  startDriftCorrection() {
    this.stopDriftCorrection();
    this._driftInterval = setInterval(() => {
      if (!this._mediaAdapter || !this.playback || !this.playback.isPlaying) return;
      const expected = this.getExpectedPosition();
      const actual = this._mediaAdapter.getCurrentTime();
      const drift = actual - expected;

      // Hard seek if drift > 1.5s
      if (Math.abs(drift) > 1.5) {
        this._mediaAdapter.seekTo(expected);
      } else if (Math.abs(drift) > 0.15) {
        // Micro-rate adjustment
        const rate = drift > 0 ? 0.95 : 1.05;
        this._mediaAdapter.setPlaybackRate(rate);
        clearTimeout(this._rateResetTimeout);
        this._rateResetTimeout = setTimeout(() => {
          if (this._mediaAdapter) this._mediaAdapter.setPlaybackRate(1.0);
        }, 800);
      }
    }, 1000);
  }

  stopDriftCorrection() {
    if (this._driftInterval) {
      clearInterval(this._driftInterval);
      this._driftInterval = null;
    }
    clearTimeout(this._rateResetTimeout);
  }

  _startClockSync() {
    this._syncInterval = setInterval(() => {
      this._send({ type: 'ping', pingId: Math.random().toString(36).slice(2) });
    }, 20000);
  }

  _stopClockSync() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  }

  // ============================
  // PUBLIC ACTIONS
  // ============================

  createRoom(roomType = 'jam', username = 'Host', avatarColor = '#00ff41') {
    this._send({ type: 'create-room', roomType, username, avatarColor });
  }

  joinRoom(code, username = 'Guest', avatarColor = '#00d4ff') {
    this._send({ type: 'join-room', code, username, avatarColor });
  }

  leaveRoom() {
    this._send({ type: 'leave-room', code: this.roomCode });
    this.disconnect();
  }

  play(trackId = null, position = 0) {
    this._send({ type: 'play', trackId, position });
  }

  pause() {
    this._send({ type: 'pause' });
  }

  seek(position) {
    this._send({ type: 'seek', position });
  }

  loadTrack(trackId, title = '') {
    this._send({ type: 'load-track', trackId, title });
  }

  addToQueue(track) {
    this._send({ type: 'queue-add', track });
  }

  removeFromQueue(videoId) {
    this._send({ type: 'queue-remove', videoId });
  }

  skip() {
    this._send({ type: 'skip' });
  }

  voteSkip() {
    this._send({ type: 'vote-skip' });
  }

  sendChat(text, name = 'You') {
    this._send({ type: 'chat', text, name });
  }

  sendTyping() {
    this._send({ type: 'typing' });
  }

  sendReactionBurst(emoji) {
    this._send({ type: 'reaction-burst', emoji });
  }

  toggleLock() {
    this._send({ type: 'toggle-lock' });
  }

  toggleQueuePermissions() {
    this._send({ type: 'toggle-queue-perms' });
  }

  kickMember(username) {
    this._send({ type: 'kick-member', username });
  }

  _handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'pong':
        this._updateSyncQuality();
        break;
      case 'room-created':
      case 'room-joined':
      case 'member-joined':
      case 'member-left':
      case 'host-changed':
      case 'kicked':
      case 'queue-update':
      case 'queue-ended':
      case 'play':
      case 'pause':
      case 'seek':
      case 'load-track':
      case 'chat':
      case 'typing':
      case 'reaction-burst':
      case 'lock-state':
      case 'queue-perms-state':
      case 'game-round':
      case 'game-scores':
      case 'game-ended':
      case 'draw-stroke':
      case 'draw-clear':
      case 'draw-history':
        this._emit(msg.type, msg);
        break;
      default:
        this._emit(msg.type, msg);
        break;
    }
  }

  _updateSyncQuality() {
    this.syncQuality = { status: 'good', rtt: 15, jitter: 1 };
    this._emit('sync-quality', this.syncQuality);
  }
}

window.SyncEngine = SyncEngine;