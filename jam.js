/* ============================================================
   JAM.SYNC — Music Sync Client
   Uses SyncEngine for server-authoritative playback with
   NTP clock sync, scheduled starts, and drift correction.
   ============================================================ */

(function () {
  'use strict';

  // ========== CONFIG ==========
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const WS_URL = isLocal ? 'ws://localhost:3000' : 'wss://api.sumit-labs.me';

  // ========== STATE ==========
  const state = {
    sync: null,           // SyncEngine instance
    player: null,         // YouTube IFrame player
    playerReady: false,
    playerUnavailable: false,
    queue: [],
    currentTrackId: null,
    isPlaying: false,
    username: `user_${Math.random().toString(36).slice(2, 6)}`,
    reconnectTimer: null,
    reconnectAttempt: 0,
    chatCooldownUntil: 0,
    chatScrollLocked: true,
  };

  // ========== DOM REFS ==========
  const els = {
    lobby: document.getElementById('jamLobby'),
    howItWorks: document.getElementById('jamHowItWorks'),
    room: document.getElementById('jamRoom'),
    createBtn: document.getElementById('createJamBtn'),
    joinBtn: document.getElementById('joinJamBtn'),
    joinCode: document.getElementById('joinJamCode'),
    codeDisplay: document.getElementById('jamCodeDisplay'),
    roomCodeEl: document.getElementById('jamRoomCode'),
    urlInput: document.getElementById('jamUrlInput'),
    addUrlBtn: document.getElementById('jamAddUrl'),
    playPauseBtn: document.getElementById('jamPlayPause'),
    skipBtn: document.getElementById('jamSkip'),
    nowPlaying: document.getElementById('jamNowPlaying'),
    queueList: document.getElementById('jamQueue'),
    leaveBtn: document.getElementById('jamLeave'),
    visualizer: document.getElementById('jamVisualizer'),
    chatPanel: document.getElementById('jamChatPanel'),
    chatToggle: document.getElementById('jamChatToggle'),
    chatMessages: document.getElementById('jamChatMessages'),
    chatInput: document.getElementById('jamChatInput'),
    chatSend: document.getElementById('jamChatSend'),
    // Sync UI
    connectionBanner: document.getElementById('jamConnectionBanner'),
    syncDot: document.getElementById('jamSyncDot'),
    syncLabel: document.getElementById('jamSyncLabel'),
    syncRtt: document.getElementById('jamSyncRtt'),
    retryBanner: document.getElementById('jamRetryBanner'),
    retryBtn: document.getElementById('jamRetryBtn'),
  };

  // ========== UTILITIES ==========
  function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  function showToast(msg) {
    if (window.showToast) window.showToast(msg);
  }

  // ========== YOUTUBE IFRAME API ==========
  function loadYouTubeAPI() {
    return new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) { resolve(); return; }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;

      const timeout = window.setTimeout(() => {
        tag.remove();
        if (window.onYouTubeIframeAPIReady === readyHandler) {
          window.onYouTubeIframeAPIReady = null;
        }
        reject(new Error('YouTube API failed to load'));
      }, 5000);

      const readyHandler = () => {
        window.clearTimeout(timeout);
        if (window.onYouTubeIframeAPIReady === readyHandler) {
          window.onYouTubeIframeAPIReady = null;
        }
        resolve();
      };

      window.onYouTubeIframeAPIReady = readyHandler;
      tag.onerror = () => {
        window.clearTimeout(timeout);
        if (window.onYouTubeIframeAPIReady === readyHandler) {
          window.onYouTubeIframeAPIReady = null;
        }
        reject(new Error('YouTube API blocked'));
      };

      document.head.appendChild(tag);
    });
  }

  async function initPlayer() {
    if (state.playerReady || state.playerUnavailable) return;

    const container = document.getElementById('jamPlayerContainer');
    if (!container) return;

    try {
      await loadYouTubeAPI();
      container.innerHTML = '<div id="jamPlayer"></div>';

      await new Promise((resolve, reject) => {
        const loadTimeout = setTimeout(() => {
          reject(new Error('YouTube player setup timed out'));
        }, 4000);

        try {
          state.player = new YT.Player('jamPlayer', {
            height: '100%',
            width: '100%',
            playerVars: {
              autoplay: 0,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              fs: 1,
            },
            events: {
              onReady: () => {
                clearTimeout(loadTimeout);
                state.playerReady = true;
                state.playerUnavailable = false;
                console.log('[jam] YouTube player ready');

                const adapter = {
                  getCurrentTime: () => state.player.getCurrentTime(),
                  seekTo: (s) => state.player.seekTo(s, true),
                  play: () => state.player.playVideo(),
                  pause: () => state.player.pauseVideo(),
                  setPlaybackRate: (r) => state.player.setPlaybackRate(r),
                  getPlaybackRate: () => state.player.getPlaybackRate(),
                };
                state.sync.setMediaAdapter(adapter);
                resolve();
              },
              onError: () => {
                clearTimeout(loadTimeout);
                reject(new Error('YouTube player error'));
              },
              onStateChange: (event) => {
                handlePlayerState(event.data);
              },
            },
          });
        } catch (err) {
          clearTimeout(loadTimeout);
          reject(err);
        }
      });
    } catch (error) {
      state.playerReady = false;
      state.playerUnavailable = true;
      state.player = null;
      container.innerHTML = '<div class="player-placeholder" style="display:flex;align-items:center;justify-content:center;padding:1rem;text-align:center;color:var(--text-muted);">YouTube player unavailable in this browser. The room still works for chat and queueing.</div>';
      console.warn('[jam] player unavailable:', error);
      showToast('room ready — chat and queueing work while the player is unavailable');
    }
  }

  function handlePlayerState(playerState) {
    switch (playerState) {
      case YT.PlayerState.PLAYING:
        state.isPlaying = true;
        els.playPauseBtn.textContent = '⏸ pause';
        break;
      case YT.PlayerState.PAUSED:
        state.isPlaying = false;
        els.playPauseBtn.textContent = '▶ play';
        break;
      case YT.PlayerState.ENDED:
        state.isPlaying = false;
        els.playPauseBtn.textContent = '▶ play';
        // Auto-skip to next track
        handleAutoSkip();
        break;
    }
  }

  function handleAutoSkip() {
    if (!state.sync) return;
    const currentIdx = state.queue.findIndex(t => t.videoId === state.currentTrackId);
    if (currentIdx >= 0 && currentIdx < state.queue.length - 1) {
      state.sync.skip();
    }
  }

  // ========== SYNC ENGINE SETUP ==========
  function createSyncEngine() {
    state.sync = new SyncEngine(WS_URL);

    // --- Room Events ---
    state.sync.on('room-created', (msg) => {
      console.log('[jam] room-created event received:', msg);
      els.codeDisplay.textContent = msg.code;
      console.log('[jam] calling showRoom()');
      showRoom();
      console.log('[jam] showRoom() done, room classes:', els.room ? els.room.className : 'NO els.room');
      resetReconnectState();
      updateConnectionBanner('connected', 'connected — you are the host');
      showToast(`room created: ${msg.code}`);
      renderChatHistory([]);
    });

    state.sync.on('room-joined', (msg) => {
      els.codeDisplay.textContent = msg.code;
      showRoom();
      resetReconnectState();
      updateConnectionBanner('connected', 'connected — syncing...');
      showToast(`joined room: ${msg.code}`);

      if (msg.chatHistory && msg.chatHistory.length > 0) {
        renderChatHistory(msg.chatHistory);
      } else {
        renderChatHistory([]);
      }

      // Restore queue from server state
      if (msg.queue && msg.queue.length > 0) {
        state.queue = msg.queue;
        updateQueueUI();
      }

      // Handle late join — if track is already playing
      if (msg.playback && msg.playback.trackId && msg.playback.isPlaying) {
        state.currentTrackId = msg.playback.trackId;
        updateNowPlaying();

        // Load video and let drift correction bring us to the right position
        if (state.playerReady) {
          const expectedPos = state.sync.getExpectedPosition();
          state.player.loadVideoById(msg.playback.trackId, expectedPos);
          state.isPlaying = true;
          els.playPauseBtn.textContent = '⏸ pause';
          state.sync.startDriftCorrection();
        }
      } else if (msg.playback && msg.playback.trackId && !msg.playback.isPlaying) {
        state.currentTrackId = msg.playback.trackId;
        updateNowPlaying();
        if (state.playerReady) {
          state.player.cueVideoById(msg.playback.trackId, msg.playback.positionAtOrigin);
        }
      }
    });

    // --- Playback Events ---
    state.sync.on('play', (msg) => {
      state.currentTrackId = msg.trackId;
      state.isPlaying = true;
      els.playPauseBtn.textContent = '⏸ pause';
      updateNowPlaying();
      updateQueueUI();

      // Load video if different
      if (state.playerReady && msg.trackId) {
        const currentVideoUrl = state.player.getVideoUrl && state.player.getVideoUrl();
        const currentId = currentVideoUrl ? extractVideoId(currentVideoUrl) : null;

        if (currentId !== msg.trackId) {
          // New track — load it, then scheduled start will seek+play
          state.player.cueVideoById(msg.trackId, msg.positionAtOrigin);
        }
        // schedulePlayback is called automatically by SyncEngine
      }
    });

    state.sync.on('pause', (msg) => {
      state.isPlaying = false;
      els.playPauseBtn.textContent = '▶ play';
      // SyncEngine already calls adapter.pause()
    });

    state.sync.on('seek', (msg) => {
      // SyncEngine already calls adapter.seekTo()
      updateNowPlaying();
    });

    state.sync.on('load-track', (msg) => {
      state.currentTrackId = msg.trackId;
      state.isPlaying = true;
      els.playPauseBtn.textContent = '⏸ pause';
      updateNowPlaying();
      updateQueueUI();

      // Load the new video
      if (state.playerReady) {
        state.player.cueVideoById(msg.trackId, 0);

        // Schedule playback at the precise server-synced time
        if (msg.scheduledStart) {
          state.sync.schedulePlayback(msg.scheduledStart, 0, msg.trackId);
        }
      }
    });

    // --- Queue Events ---
    state.sync.on('queue-update', (msg) => {
      state.queue = msg.queue || [];
      updateQueueUI();

      // If first track added and nothing playing, auto-play
      if (state.queue.length === 1 && !state.currentTrackId) {
        state.sync.loadTrack(state.queue[0].videoId, state.queue[0].title);
      }
    });

    state.sync.on('queue-ended', () => {
      showToast('queue finished');
    });

    state.sync.on('chat', (msg) => {
      appendChatMessage(msg);
    });

    // --- Member Events ---
    state.sync.on('member-joined', (msg) => {
      showToast(`${msg.username} joined`);
    });

    state.sync.on('member-left', (msg) => {
      showToast(`${msg.username} left`);
    });

    state.sync.on('host-changed', (msg) => {
      if (msg.isYou) {
        showToast('you are now the host');
      } else {
        showToast(`${msg.newHost} is now the host`);
      }
    });

    // --- Sync Quality ---
    state.sync.on('sync-quality', (quality) => {
      updateSyncUI(quality);
    });

    // --- Error / Disconnect ---
    state.sync.on('error', (msg) => {
      showToast(`error: ${msg.message}`);
    });

    state.sync.on('disconnected', () => {
      scheduleReconnect();
    });

    return state.sync;
  }

  function clearReconnectTimer() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }
  }

  function resetReconnectState() {
    clearReconnectTimer();
    state.reconnectAttempt = 0;
    state.chatCooldownUntil = 0;
  }

  function updateConnectionBanner(type, text, showRetry = false) {
    if (!els.connectionBanner) return;
    els.connectionBanner.className = `connection-banner visible ${type}`;
    els.connectionBanner.textContent = text;
    if (els.retryBanner) {
      els.retryBanner.style.display = showRetry ? 'flex' : 'none';
    }
    if (els.retryBtn) {
      els.retryBtn.style.display = showRetry ? 'inline-flex' : 'none';
    }

    if (type === 'connected') {
      setTimeout(() => {
        if (els.connectionBanner) {
          els.connectionBanner.classList.remove('visible');
        }
      }, 3000);
    }
  }

  function scheduleReconnect() {
    if (!state.sync || !state.sync.roomCode) return;
    // Don't reconnect if using local fallback (no server to connect to)
    if (state.sync.useFallback) return;
    clearReconnectTimer();
    const attempt = state.reconnectAttempt + 1;
    state.reconnectAttempt = attempt;
    const delay = Math.min(1000 * (2 ** (attempt - 1)), 8000);
    updateConnectionBanner('connecting', `reconnecting… ${Math.round(delay/1000)}s`, true);
    state.reconnectTimer = setTimeout(() => {
      reconnect();
    }, delay);
  }

  async function reconnect() {
    if (!state.sync || !state.sync.roomCode) {
      updateConnectionBanner('error', 'connection failed — retry', true);
      return;
    }
    // Don't reconnect if using local fallback
    if (state.sync.useFallback) return;
    clearReconnectTimer();
    updateConnectionBanner('connecting', 'reconnecting…', true);
    try {
      await state.sync.connect();
      if (state.sync.roomCode) {
        state.sync.joinRoom(state.sync.roomCode, state.username);
      }
    } catch {
      updateConnectionBanner('error', 'reconnect failed — retry', true);
    }
  }

  // ========== UI UPDATES ==========
  function updateSyncUI(quality) {
    if (els.syncDot) {
      els.syncDot.className = `sync-dot ${quality.status}`;
    }
    if (els.syncLabel) {
      const labels = { good: 'in sync', adjusting: 'adjusting', poor: 'poor connection', unknown: 'connecting...' };
      els.syncLabel.textContent = labels[quality.status] || quality.status;
    }
    if (els.syncRtt) {
      els.syncRtt.textContent = quality.rtt > 0 ? `RTT: ${quality.rtt}ms | jitter: ${quality.jitter}ms` : '';
    }
  }

  function updateNowPlaying() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: state.currentTrackId ? `Now playing • ${state.currentTrackId}` : 'Jam room',
        artist: 'shared room',
      });
      navigator.mediaSession.setActionHandler('play', togglePlayPause);
      navigator.mediaSession.setActionHandler('pause', togglePlayPause);
      navigator.mediaSession.setActionHandler('previoustrack', skipTrack);
      navigator.mediaSession.setActionHandler('nexttrack', skipTrack);
    }
    if (!els.nowPlaying) return;
    if (state.currentTrackId) {
      const track = state.queue.find(t => t.videoId === state.currentTrackId);
      els.nowPlaying.textContent = track ? track.title : `YouTube: ${state.currentTrackId}`;
    } else {
      els.nowPlaying.textContent = 'nothing queued';
    }
  }

  function updateQueueUI() {
    if (!els.queueList) return;

    if (state.queue.length === 0) {
      els.queueList.innerHTML = `
        <li class="queue-item" style="color:var(--text-muted);font-style:italic;">
          no tracks yet — add a YouTube URL above
        </li>`;
      return;
    }

    els.queueList.innerHTML = state.queue.map((track, idx) => `
      <li class="queue-item ${track.videoId === state.currentTrackId ? 'active-track' : ''}" data-index="${idx}">
        <span>${track.videoId === state.currentTrackId ? '▶ ' : ''}${track.title}</span>
        <button class="queue-remove" data-video-id="${track.videoId}" title="Remove">✕</button>
      </li>
    `).join('');

    // Bind remove buttons
    els.queueList.querySelectorAll('.queue-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.sync.removeFromQueue(btn.dataset.videoId);
      });
    });

    // Bind track click to play
    els.queueList.querySelectorAll('.queue-item[data-index]').forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        const track = state.queue[idx];
        if (track) {
          state.sync.loadTrack(track.videoId, track.title);
        }
      });
    });
  }

  // ========== VISUALIZER ==========
  function initVisualizer() {
    if (!els.visualizer) return;
    const barCount = 24;
    els.visualizer.innerHTML = '';
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'viz-bar';
      bar.style.height = '4px';
      els.visualizer.appendChild(bar);
    }

    let lastTick = 0;
    function animateBars(now) {
      const bars = els.visualizer.querySelectorAll('.viz-bar');
      if (now - lastTick > 80) {
        lastTick = now;
        bars.forEach((bar, index) => {
          if (state.isPlaying) {
            const height = 4 + (index % 5) * 8 + (Math.sin(now / 180 + index) * 8);
            bar.style.height = `${Math.max(4, height)}px`;
            bar.style.opacity = 0.35 + ((index % 7) / 12);
          } else {
            bar.style.height = '4px';
            bar.style.opacity = 0.3;
          }
        });
      }
      requestAnimationFrame(animateBars);
    }
    requestAnimationFrame(animateBars);
  }

  // ========== CHAT ==========
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function shouldAutoScroll() {
    if (!els.chatMessages) return true;
    const distanceFromBottom = els.chatMessages.scrollHeight - (els.chatMessages.scrollTop + els.chatMessages.clientHeight);
    return distanceFromBottom < 40;
  }

  function scrollChatToBottom(force = false) {
    if (!els.chatMessages) return;
    if (force || shouldAutoScroll()) {
      els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    }
  }

  function renderChatHistory(history) {
    if (!els.chatMessages) return;
    els.chatMessages.innerHTML = '';
    if (!history || history.length === 0) {
      els.chatMessages.innerHTML = '<div class="chat-msg system-msg"><span class="chat-text">share the room code and say hello</span></div>';
      return;
    }
    history.forEach((msg) => appendChatMessage(msg, true));
    scrollChatToBottom(true);
  }

  function appendChatMessage(msg, skipScroll = false) {
    if (!els.chatMessages) return;
    const el = document.createElement('div');
    const isSystem = !msg || msg.type === 'system' || msg.name === 'system';
    el.className = isSystem ? 'chat-msg system-msg' : 'chat-msg';
    const sender = msg && msg.name ? escapeHtml(msg.name) : 'system';
    const text = msg && msg.text ? escapeHtml(msg.text) : '';
    if (isSystem) {
      el.innerHTML = `<span class="chat-text">${text}</span>`;
    } else {
      el.innerHTML = `<span class="chat-user">${sender}</span><span class="chat-text">: ${text}</span>`;
    }
    els.chatMessages.appendChild(el);
    if (!skipScroll) scrollChatToBottom();
  }

  function sendChatMessage() {
    const text = (els.chatInput && els.chatInput.value || '').trim();
    if (!text || !state.sync) return;
    const now = Date.now();
    if (now < state.chatCooldownUntil) return;
    state.chatCooldownUntil = now + 1000;
    if (els.chatSend) els.chatSend.disabled = true;
    setTimeout(() => { if (els.chatSend) els.chatSend.disabled = false; }, 1000);
    state.sync.sendChat(text, state.username);
    if (els.chatInput) els.chatInput.value = '';
  }

  function toggleChatPanel() {
    if (!els.chatPanel) return;
    els.chatPanel.classList.toggle('collapsed');
  }

  // ========== ROOM MANAGEMENT ==========
  function showRoom() {
    console.log('[jam] showRoom() called — lobby:', !!els.lobby, 'howItWorks:', !!els.howItWorks, 'room:', !!els.room);
    if (els.lobby) els.lobby.style.display = 'none';
    if (els.howItWorks) els.howItWorks.style.display = 'none';
    if (els.room) {
      els.room.classList.add('active');
      console.log('[jam] room classList after add:', els.room.className, 'computed display:', getComputedStyle(els.room).display);
    }
  }

  function showLobby() {
    if (els.lobby) els.lobby.style.display = '';
    if (els.howItWorks) els.howItWorks.style.display = '';
    if (els.room) els.room.classList.remove('active');
    if (els.chatMessages) {
      els.chatMessages.innerHTML = '<div class="chat-msg system-msg"><span class="chat-text">share the room code and say hello</span></div>';
    }
  }

  async function createRoom() {
    console.log('[jam] createRoom() called');
    state.reconnectAttempt = 0;
    updateConnectionBanner('connecting', 'connecting to sync server...');
    try {
      console.log('[jam] creating SyncEngine...');
      const sync = createSyncEngine();
      console.log('[jam] connecting...');
      await sync.connect();
      console.log('[jam] connected, useFallback:', sync.useFallback);
      initVisualizer();
      console.log('[jam] initVisualizer done, calling initPlayer...');
      await initPlayer();
      console.log('[jam] initPlayer done, playerReady:', state.playerReady, 'playerUnavailable:', state.playerUnavailable);
      console.log('[jam] calling sync.createRoom...');
      sync.createRoom('jam', state.username);
      console.log('[jam] sync.createRoom() call returned');
    } catch (e) {
      console.error('[jam] createRoom CAUGHT ERROR:', e);
      updateConnectionBanner('error', 'connection failed — retry', true);
      showToast('connection failed — start the server with: node server.js');
      console.error('[jam] connection error:', e);
    }
  }

  async function joinRoom(code) {
    if (!code || code.length < 4) {
      showToast('enter a valid room code');
      return;
    }
    state.reconnectAttempt = 0;
    updateConnectionBanner('connecting', 'connecting to sync server...');
    try {
      const sync = createSyncEngine();
      await sync.connect();
      initVisualizer();
      await initPlayer();
      sync.joinRoom(code, state.username);
    } catch (e) {
      updateConnectionBanner('error', 'connection failed — retry', true);
      showToast('connection failed — start the server with: node server.js');
      console.error('[jam] connection error:', e);
    }
  }

  function leaveRoom() {
    if (state.sync) {
      state.sync.leaveRoom();
      state.sync.disconnect();
      state.sync = null;
    }
    if (state.player && state.playerReady) {
      state.player.destroy();
      state.player = null;
      state.playerReady = false;
    }
    state.queue = [];
    state.currentTrackId = null;
    state.isPlaying = false;

    showLobby();
    showToast('left the room');
  }

  // ========== PLAYBACK CONTROLS ==========
  function addToQueue(url) {
    const videoId = extractVideoId(url);
    if (!videoId) { showToast('invalid YouTube URL'); return; }
    if (state.queue.find(t => t.videoId === videoId)) { showToast('track already in queue'); return; }

    state.sync.addToQueue({
      videoId,
      title: `YouTube: ${videoId}`,
    });
    showToast('track added');
  }

  function togglePlayPause() {
    if (!state.sync) return;
    if (state.playerUnavailable || !state.playerReady) {
      showToast('player unavailable here — you can still chat and share the room');
      return;
    }

    if (state.isPlaying) {
      state.sync.pause();
    } else {
      // If nothing playing, play first track
      if (!state.currentTrackId && state.queue.length > 0) {
        state.sync.loadTrack(state.queue[0].videoId, state.queue[0].title);
        return;
      }
      // Resume — tell server current position
      const pos = state.player.getCurrentTime();
      state.sync.play(state.currentTrackId, pos);
    }
  }

  function skipTrack() {
    if (!state.sync) return;
    state.sync.skip();
  }

  // ========== EVENT BINDINGS ==========
  if (els.createBtn) els.createBtn.addEventListener('click', createRoom);

  if (els.joinBtn) els.joinBtn.addEventListener('click', () => joinRoom(els.joinCode.value));
  if (els.joinCode) els.joinCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom(els.joinCode.value); });

  if (els.addUrlBtn) els.addUrlBtn.addEventListener('click', () => { addToQueue(els.urlInput.value); els.urlInput.value = ''; });
  if (els.urlInput) els.urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { addToQueue(els.urlInput.value); els.urlInput.value = ''; } });

  if (els.playPauseBtn) els.playPauseBtn.addEventListener('click', togglePlayPause);
  if (els.skipBtn) els.skipBtn.addEventListener('click', skipTrack);
  if (els.leaveBtn) els.leaveBtn.addEventListener('click', leaveRoom);
  if (els.chatToggle) els.chatToggle.addEventListener('click', toggleChatPanel);
  if (els.chatSend) els.chatSend.addEventListener('click', sendChatMessage);
  if (els.chatInput) els.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } });
  if (els.retryBtn) els.retryBtn.addEventListener('click', () => reconnect());

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640 && els.chatPanel) els.chatPanel.classList.remove('collapsed');
  });

  // Copy room code
  if (els.roomCodeEl) {
    els.roomCodeEl.addEventListener('click', () => {
      const code = state.sync && state.sync.roomCode;
      if (code) {
        navigator.clipboard.writeText(code).then(() => showToast('room code copied!')).catch(() => showToast(`room code: ${code}`));
      }
    });
  }

  // URL hash auto-join
  const hash = window.location.hash.slice(1);
  if (hash && hash.length >= 4) {
    setTimeout(() => joinRoom(hash), 500);
  }

})();
