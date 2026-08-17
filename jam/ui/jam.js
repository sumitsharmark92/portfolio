/* ============================================================
   JAM.SYNC — Flagship Listening & Watching Rooms Client
   Media Session API, NTP Drift Correction, Floating Bursts,
   Collaborator Stacks, Visualizer, Background Tab Resilience.
   ============================================================ */

(function () {
  'use strict';

  // Config & State
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const WS_URL = isLocal ? 'ws://localhost:3000' : 'wss://api.sumit-labs.me';

  const state = {
    sync: null,
    player: null,
    playerReady: false,
    queue: [],
    members: [],
    currentTrack: null,
    isPlaying: false,
    duration: 0,
    username: localStorage.getItem('jam_username') || `Listener_${Math.floor(Math.random()*899 + 100)}`,
    avatarColor: localStorage.getItem('jam_avatar_color') || '#00ff41',
    isHost: false,
    isLocked: false,
    allowGuestQueue: true,
    skipVotesCount: 0,
    requiredSkipVotes: 1,
    focusMode: false,
    audioKeepAlive: null,
    visualizerAnimationId: null,
    typingTimer: null,
    objectUrls: new Set(),
    pendingTrack: null,
  };

  // DOM Elements Cache
  const els = {
    nav: document.querySelector('.jam-nav'),
    userPill: document.getElementById('jamUserPill'),
    userDisplay: document.getElementById('jamUserDisplay'),
    userAvatarDot: document.getElementById('jamUserAvatarDot'),
    focusToggle: document.getElementById('jamFocusToggle'),
    lobby: document.getElementById('jamLobby'),
    room: document.getElementById('jamRoom'),
    profileName: document.getElementById('jamProfileName'),
    colorPicker: document.getElementById('jamColorPicker'),
    createBtn: document.getElementById('createJamBtn'),
    joinBtn: document.getElementById('joinJamBtn'),
    joinCode: document.getElementById('joinJamCode'),
    presetsGrid: document.querySelector('.jam-presets-grid'),
    
    // Room elements
    codeDisplay: document.getElementById('jamCodeDisplay'),
    roomCodeBadge: document.getElementById('jamRoomCode'),
    lockBadge: document.getElementById('jamLockBadge'),
    connectionBanner: document.getElementById('jamConnectionBanner'),
    retryBanner: document.getElementById('jamRetryBanner'),
    retryBtn: document.getElementById('jamRetryBtn'),
    syncDot: document.getElementById('jamSyncDot'),
    syncLabel: document.getElementById('jamSyncLabel'),
    syncRtt: document.getElementById('jamSyncRtt'),
    collaboratorStack: document.getElementById('jamCollaboratorStack'),
    
    // Player elements
    albumArt: document.getElementById('jamAlbumArt'),
    ambientBackdrop: document.getElementById('ambientBackdrop'),
    visualizerCanvas: document.getElementById('jamVisualizerCanvas'),
    reactionBurstOverlay: document.getElementById('jamReactionBurstOverlay'),
    reactionBar: document.getElementById('jamReactionBar'),
    playerContainer: document.getElementById('jamPlayerContainer'),
    sourceTag: document.getElementById('jamSourceTag'),
    nowPlayingTitle: document.getElementById('jamNowPlayingTitle'),
    nowPlayingArtist: document.getElementById('jamNowPlayingArtist'),
    currentTime: document.getElementById('jamCurrentTime'),
    totalTime: document.getElementById('jamTotalTime'),
    progressBar: document.getElementById('jamProgressBar'),
    progressFill: document.getElementById('jamProgressFill'),
    playPauseBtn: document.getElementById('jamPlayPause'),
    skipBtn: document.getElementById('jamSkip'),
    voteSkipBtn: document.getElementById('jamVoteSkipBtn'),
    voteCount: document.getElementById('jamVoteCount'),
    volumeSlider: document.getElementById('jamVolumeSlider'),
    muteToggle: document.getElementById('jamMuteToggle'),
    bgModeBadge: document.getElementById('jamBgModeBadge'),
    
    // Media & Host
    urlInput: document.getElementById('jamUrlInput'),
    addUrlBtn: document.getElementById('jamAddUrl'),
    fileInput: document.getElementById('jamFileInput'),
    hostControlsPanel: document.getElementById('jamHostControlsPanel'),
    toggleLockBtn: document.getElementById('jamToggleLockBtn'),
    toggleQueuePermsBtn: document.getElementById('jamToggleQueuePermsBtn'),
    openParticipantsBtn: document.getElementById('jamOpenParticipantsBtn'),
    
    // Queue & Chat
    queueList: document.getElementById('jamQueue'),
    queueCount: document.getElementById('jamQueueCount'),
    chatPanel: document.getElementById('jamChatPanel'),
    chatHeader: document.querySelector('.jam-chat-header'),
    chatToggle: document.getElementById('jamChatToggle'),
    chatMessages: document.getElementById('jamChatMessages'),
    chatInput: document.getElementById('jamChatInput'),
    chatSend: document.getElementById('jamChatSend'),
    typingIndicator: document.getElementById('jamTypingIndicator'),
    typingText: document.getElementById('jamTypingText'),
    togglePresenceBtn: document.getElementById('jamTogglePresenceBtn'),
    memberCount: document.getElementById('jamMemberCount'),
    presenceDrawer: document.getElementById('jamPresenceDrawer'),
    memberList: document.getElementById('jamMemberList'),
    leaveBtn: document.getElementById('jamLeave'),
  };

  // ========== UTILITY FUNCTIONS ==========
  function showToast(msg) {
    if (window.showToast) window.showToast(msg);
  }

  function isSafeColor(color) {
    return /^#[0-9a-f]{6}$/i.test(String(color || ''));
  }

  function safeColor(color, fallback = '#00ff41') {
    return isSafeColor(color) ? color : fallback;
  }

  function cleanLabel(value, fallback = '') {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim() || fallback;
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function setButtonBusy(button, isBusy, label) {
    if (!button) return;
    if (isBusy) {
      button.dataset.originalText = button.dataset.originalText || button.textContent;
      button.textContent = label || 'working...';
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function getMediaTitleFromUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop() || 'YouTube video';
      }
      if (parsed.hostname.includes('soundcloud.com')) {
        return decodeURIComponent(parsed.pathname.split('/').filter(Boolean).join(' / ')) || 'SoundCloud track';
      }
      return decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname);
    } catch {
      return url;
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function extractMediaId(url) {
    if (!url) return null;
    const trimmed = url.trim();
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return ytMatch[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    if (trimmed.includes('vimeo.com/')) {
      const vm = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vm) return `vimeo:${vm[1]}`;
    }
    if (trimmed.includes('soundcloud.com/')) return `soundcloud:${trimmed}`;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) return trimmed;
    return null;
  }

  // ========== PROFILE MANAGEMENT ==========
  function initProfile() {
    if (els.profileName) els.profileName.value = state.username;
    updateProfileUI();

    if (els.profileName) {
      els.profileName.addEventListener('input', (e) => {
        state.username = e.target.value.trim() || 'Guest';
        localStorage.setItem('jam_username', state.username);
        updateProfileUI();
      });
    }

    if (els.colorPicker) {
      els.colorPicker.addEventListener('click', (e) => {
        const option = e.target.closest('.color-option');
        if (!option) return;
        els.colorPicker.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
        option.classList.add('active');
        state.avatarColor = safeColor(option.dataset.color);
        localStorage.setItem('jam_avatar_color', state.avatarColor);
        updateProfileUI();
      });
    }
  }

  function updateProfileUI() {
    if (els.userDisplay) els.userDisplay.textContent = state.username;
    if (els.userAvatarDot) {
      els.userAvatarDot.style.background = state.avatarColor;
      els.userAvatarDot.style.boxShadow = `0 0 8px ${state.avatarColor}`;
    }
  }

  // ========== MEDIA SESSION & BACKGROUND RESILIENCE ==========
  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (state.isHost && state.sync) state.sync.play(state.currentTrack?.videoId);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (state.isHost && state.sync) state.sync.pause();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (state.sync) state.sync.skip();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (state.isHost && state.sync && details.seekTime !== undefined) {
          state.sync.seek(details.seekTime);
        }
      });
    } catch (e) {
      console.log('[jam] mediaSession handlers set');
    }
  }

  function updateMediaSessionMeta(title, artist, artworkUrl) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'Jam Listening Room',
        artist: artist || 'Jam Sync Engine',
        album: 'Jam Room',
        artwork: [
          { src: artworkUrl || 'icon.svg', sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch (e) { /* ignore */ }
  }

  function initBackgroundAudioKeepAlive() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.00001; // Silent background oscillator keeps tab active
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      state.audioKeepAlive = audioCtx;
    } catch (e) { /* ignore */ }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (state.sync) {
        state.sync.performClockSync(3);
        state.sync.startDriftCorrection();
      }
    }
  });

  // ========== FLOATING REACTION BURSTS ==========
  function triggerReactionBurst(emoji) {
    if (state.sync) state.sync.sendReactionBurst(emoji);
    renderReactionParticle(emoji);
  }

  function renderReactionParticle(emoji) {
    if (!els.reactionBurstOverlay) return;
    const p = document.createElement('div');
    p.className = 'reaction-burst-particle';
    p.textContent = emoji;
    const randomX = Math.floor(Math.random() * 80 + 10);
    p.style.left = `${randomX}%`;
    els.reactionBurstOverlay.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }

  // ========== WAVEFORM VISUALIZER CANVAS ==========
  function startVisualizer() {
    if (!els.visualizerCanvas) return;
    const canvas = els.visualizerCanvas;
    const ctx = canvas.getContext('2d');
    
    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const numBars = 48;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.isPlaying) {
        const barWidth = canvas.width / numBars;
        const time = Date.now() * 0.004;
        ctx.fillStyle = state.avatarColor || '#00ff41';

        for (let i = 0; i < numBars; i++) {
          const height = (Math.sin(time + i * 0.2) * 0.5 + 0.5) * (canvas.height * 0.35) + 10;
          const x = i * barWidth;
          const y = canvas.height - height;
          ctx.globalAlpha = 0.35 + (i % 2 === 0 ? 0.25 : 0);
          ctx.fillRect(x + 2, y, barWidth - 4, height);
        }
      }
      state.visualizerAnimationId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ========== MEDIA PLAYER ADAPTER ENGINE ==========
  function loadMediaTrack(trackId, startPos = 0) {
    if (!trackId || !els.playerContainer) return;

    state.currentTrack = { videoId: trackId };
    state.playerReady = false;
    if (state.player && typeof state.player.destroy === 'function') {
      try { state.player.destroy(); } catch { /* ignore stale player */ }
    }
    state.player = null;
    els.playerContainer.innerHTML = '<div class="player-loading-spinner" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--green);font-family:var(--font-mono);">⏳ Synchronizing media stream...</div>';

    const isWebUrl = trackId.startsWith('http://') || trackId.startsWith('https://') || trackId.startsWith('blob:');

    if (trackId.startsWith('vimeo:')) {
      const vId = trackId.split(':')[1];
      els.playerContainer.innerHTML = `<iframe id="vimeoPlayer" src="https://player.vimeo.com/video/${vId}?autoplay=1" frameborder="0" allow="autoplay" style="width:100%;height:100%;"></iframe>`;
      updateTrackMeta('Vimeo Video', `ID: ${vId}`, 'Vimeo', 'icon.svg');
    } else if (trackId.startsWith('soundcloud:')) {
      const scUrl = encodeURIComponent(trackId.replace('soundcloud:', ''));
      els.playerContainer.innerHTML = `<iframe id="scPlayer" src="https://w.soundcloud.com/player/?url=${scUrl}&auto_play=true" frameborder="0" allow="autoplay" style="width:100%;height:100%;"></iframe>`;
      updateTrackMeta('SoundCloud Track', 'SoundCloud Stream', 'SoundCloud', 'icon.svg');
    } else if (isWebUrl) {
      const isAudio = /\.(mp3|wav|ogg|m4a|aac|flac)(?:[?#].*)?$/i.test(trackId);
      els.playerContainer.innerHTML = isAudio
        ? '<audio id="webMedia" controls playsinline style="width:90%;"></audio>'
        : '<video id="webMedia" controls playsinline style="width:100%;height:100%;object-fit:contain;"></video>';
      const videoEl = document.getElementById('webMedia');
      videoEl.src = trackId;
      videoEl.addEventListener('play', () => { state.isPlaying = true; if (els.playPauseBtn) els.playPauseBtn.textContent = '⏸ pause'; });
      videoEl.addEventListener('pause', () => { state.isPlaying = false; if (els.playPauseBtn) els.playPauseBtn.textContent = '▶ play'; });
      videoEl.addEventListener('ended', () => { if (state.sync) state.sync.skip(); });

      const adapter = {
        getCurrentTime: () => (videoEl ? videoEl.currentTime : 0),
        seekTo: (s) => { if (videoEl) videoEl.currentTime = s; },
        play: () => { if (videoEl) videoEl.play().catch(() => {}); },
        pause: () => { if (videoEl) videoEl.pause(); },
        setPlaybackRate: (r) => { if (videoEl) videoEl.playbackRate = r; },
        getPlaybackRate: () => (videoEl ? videoEl.playbackRate : 1.0),
      };

      videoEl.onloadedmetadata = () => {
        state.duration = videoEl.duration || 0;
        if (els.totalTime) els.totalTime.textContent = formatTime(state.duration);
      };

      if (state.sync) state.sync.setMediaAdapter(adapter);
      updateTrackMeta(getMediaTitleFromUrl(trackId) || 'Web Media Track', 'Direct Audio/Video Stream', 'Direct Link', 'icon.svg');

      if (startPos > 0) videoEl.currentTime = startPos;
      videoEl.play().catch(() => {});
    } else {
      // YouTube Video
      const thumbUrl = `https://img.youtube.com/vi/${trackId}/hqdefault.jpg`;
      updateTrackMeta(`YouTube: ${trackId}`, 'YouTube Music & Video', 'YouTube', thumbUrl);
      loadYouTubePlayer(trackId, startPos);
    }
  }

  function updateTrackMeta(title, artist, sourceTag, artworkUrl) {
    if (els.nowPlayingTitle) els.nowPlayingTitle.textContent = title;
    if (els.nowPlayingArtist) els.nowPlayingArtist.textContent = artist;
    if (els.sourceTag) els.sourceTag.textContent = sourceTag;
    if (els.albumArt) els.albumArt.src = artworkUrl;
    if (els.ambientBackdrop) {
      els.ambientBackdrop.style.backgroundImage = `url("${String(artworkUrl).replace(/"/g, '%22')}")`;
      els.ambientBackdrop.classList.add('active');
    }
    updateMediaSessionMeta(title, artist, artworkUrl);
  }

  function loadYouTubePlayer(videoId, startPos = 0) {
    if (!window.YT || !window.YT.Player) {
      // YT API not loaded yet — queue the video and wait for onYouTubeIframeAPIReady
      state._pendingYTVideo = { videoId, startPos };
      els.playerContainer.innerHTML = '<div class="player-loading-spinner" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--green);font-family:var(--font-mono);flex-direction:column;gap:12px;"><div style="font-size:2rem;">🎵</div><div>Loading YouTube player...</div></div>';
      // Ensure the API script is injected
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      return;
    }

    state._pendingYTVideo = null;
    els.playerContainer.innerHTML = '<div id="ytPlayer"></div>';

    try {
      state.player = new YT.Player('ytPlayer', {
        videoId: videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          start: Math.floor(startPos),
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            state.playerReady = true;
            state.duration = event.target.getDuration() || 0;
            if (els.totalTime) els.totalTime.textContent = formatTime(state.duration);
            
            const adapter = {
              getCurrentTime: () => (state.player && state.player.getCurrentTime ? state.player.getCurrentTime() : 0),
              seekTo: (s) => { if (state.player && state.player.seekTo) state.player.seekTo(s, true); },
              play: () => { if (state.player && state.player.playVideo) state.player.playVideo(); },
              pause: () => { if (state.player && state.player.pauseVideo) state.player.pauseVideo(); },
              setPlaybackRate: (r) => { if (state.player && state.player.setPlaybackRate) state.player.setPlaybackRate(r); },
              getPlaybackRate: () => (state.player && state.player.getPlaybackRate ? state.player.getPlaybackRate() : 1.0),
            };
            if (state.sync) state.sync.setMediaAdapter(adapter);
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (!window.YT || !window.YT.PlayerState) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              state.isPlaying = true;
              if (els.playPauseBtn) els.playPauseBtn.textContent = '⏸ pause';
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              state.isPlaying = false;
              if (els.playPauseBtn) els.playPauseBtn.textContent = '▶ play';
            } else if (event.data === window.YT.PlayerState.ENDED && state.sync) {
              state.sync.skip();
            }
          },
          onError: (event) => {
            const code = event && event.data;
            if (code === 101 || code === 150) {
              if (window.showToast) window.showToast('⚠️ This video cannot be embedded — try a different URL');
            } else if (code === 100) {
              if (window.showToast) window.showToast('⚠️ Video not found — check the URL');
            }
            console.warn('[jam] YouTube player error:', code);
          }
        }
      });
    } catch (err) {
      console.error('[jam] Failed to create YouTube player:', err);
      els.playerContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#ff0055;font-family:var(--font-mono);">⚠️ YouTube player failed to load — try another link</div>';
    }
  }

  // Load YouTube IFrame API script & handle ready callback
  window.onYouTubeIframeAPIReady = function () {
    console.log('[jam] YouTube IFrame API ready');
    // If there's a pending video that was queued before API loaded, play it now
    if (state._pendingYTVideo) {
      const { videoId, startPos } = state._pendingYTVideo;
      loadYouTubePlayer(videoId, startPos);
    }
  };

  (function loadYTAPI() {
    if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  })();

  // ========== REALTIME PROGRESS LOOP ==========
  function startProgressLoop() {
    function tick() {
      if (state.sync && state.isPlaying) {
        const expected = state.sync.getExpectedPosition();
        if (els.currentTime) els.currentTime.textContent = formatTime(expected);
        if (state.duration > 0) {
          const pct = Math.min(100, Math.max(0, (expected / state.duration) * 100));
          if (els.progressFill) els.progressFill.style.width = `${pct}%`;
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ========== COLLABORATOR AVATAR STACK ==========
  function renderCollaborators(members) {
    if (!els.collaboratorStack) return;
    state.members = members || [];
    els.collaboratorStack.innerHTML = '';
    
    if (els.memberCount) els.memberCount.textContent = state.members.length;

    const maxVisible = 4;
    const visibleMembers = state.members.slice(0, maxVisible);
    const overflow = state.members.length - maxVisible;

    visibleMembers.forEach(m => {
      const av = document.createElement('div');
      av.className = `collaborator-avatar ${m.isHost ? 'host-avatar' : ''}`;
      av.style.background = safeColor(m.avatarColor);
      av.textContent = cleanLabel(m.username, 'G').charAt(0).toUpperCase();
      av.title = `${cleanLabel(m.username, 'Guest')} ${m.isHost ? '(Host)' : ''}`;
      els.collaboratorStack.appendChild(av);
    });

    if (overflow > 0) {
      const more = document.createElement('div');
      more.className = 'collaborator-avatar collaborator-more';
      more.textContent = `+${overflow}`;
      more.title = `${overflow} more listeners`;
      els.collaboratorStack.appendChild(more);
    }

    renderPresenceDrawer();
  }

  function renderPresenceDrawer() {
    if (!els.memberList) return;
    els.memberList.innerHTML = '';
    state.members.forEach(m => {
      const li = document.createElement('li');
      li.className = 'member-item';
      const wrap = createElement('span');
      wrap.style.cssText = 'display:flex;align-items:center;gap:0.4rem;';
      const dot = createElement('span', 'avatar-dot');
      dot.style.background = safeColor(m.avatarColor);
      const name = createElement('span', '', cleanLabel(m.username, 'Guest'));
      wrap.append(dot, name);
      if (m.isHost) {
        const host = createElement('span', '', '👑 Host');
        host.style.cssText = 'color:var(--yellow);font-size:0.7rem;';
        wrap.appendChild(host);
      }
      li.appendChild(wrap);
      if (state.isHost && !m.isHost) {
        const kick = createElement('button', 'kick-btn', 'Kick');
        kick.type = 'button';
        kick.dataset.user = cleanLabel(m.username, 'Guest');
        li.appendChild(kick);
      }
      els.memberList.appendChild(li);
    });

    els.memberList.querySelectorAll('.kick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
      const u = e.currentTarget.dataset.user;
        if (state.sync && u) state.sync.kickMember(u);
      });
    });
  }

  // ========== SYNC ENGINE INTEGRATION & EVENTS ==========
  function initSyncEngine() {
    state.sync = new window.SyncEngine(WS_URL);

    state.sync.on('sync-quality', (q) => {
      if (els.connectionBanner) els.connectionBanner.style.display = 'none';
      if (els.retryBanner) els.retryBanner.style.display = 'none';
      if (els.syncDot) {
        els.syncDot.className = 'sync-dot ' + (q.status === 'good' ? 'good' : q.status === 'poor' ? 'poor' : 'adjusting');
      }
      if (els.syncLabel) els.syncLabel.textContent = q.status === 'good' ? 'in sync' : q.status === 'poor' ? 'high latency' : 'syncing';
      if (els.syncRtt) els.syncRtt.textContent = `${q.rtt} ms`;
    });

    state.sync.on('disconnected', () => {
      if (els.syncDot) els.syncDot.className = 'sync-dot poor';
      if (els.syncLabel) els.syncLabel.textContent = 'offline';
      if (els.retryBanner) els.retryBanner.style.display = 'flex';
      showToast('⚠️ Sync server disconnected. Trying local fallback if available.');
    });

    state.sync.on('room-created', (msg) => {
      state.isHost = true;
      enterRoomView(msg.code);
      renderCollaborators([{ username: state.username, avatarColor: state.avatarColor, isHost: true }]);
      if (state.pendingTrack) {
        state.sync.addToQueue(state.pendingTrack);
        state.pendingTrack = null;
      }
      showToast(`🎉 Jam room created! Code: ${msg.code}`);
    });

    state.sync.on('room-joined', (msg) => {
      state.isHost = msg.isHost;
      enterRoomView(msg.code);
      if (msg.members) renderCollaborators(msg.members);
      if (msg.queue) updateQueueUI(msg.queue);
      if (msg.chatHistory) msg.chatHistory.forEach(chat => appendChatMessage(chat.name || 'Guest', chat.text, chat.ts));
      state.isLocked = Boolean(msg.isLocked);
      state.allowGuestQueue = msg.allowGuestQueue !== false;
      if (els.lockBadge) els.lockBadge.style.display = state.isLocked ? 'inline-block' : 'none';
      if (els.toggleQueuePermsBtn) els.toggleQueuePermsBtn.textContent = `👥 Guests Can Queue: ${state.allowGuestQueue ? 'ON' : 'OFF'}`;
      if (msg.playback && msg.playback.trackId) {
        state.isPlaying = msg.playback.isPlaying;
        const now = state.sync.getServerTime();
        const elapsed = msg.playback.isPlaying ? (now - msg.playback.originServerTime) / 1000 : 0;
        loadMediaTrack(msg.playback.trackId, Math.max(0, msg.playback.positionAtOrigin + elapsed));
      }
      showToast(`🎧 Joined jam room ${msg.code}`);
    });

    state.sync.on('member-joined', (msg) => {
      if (msg.members) renderCollaborators(msg.members);
      showToast(`👋 ${msg.username} joined the jam!`);
    });

    state.sync.on('member-left', (msg) => {
      if (msg.members) renderCollaborators(msg.members);
      showToast(`🚪 ${msg.username} left`);
    });

    state.sync.on('host-changed', (msg) => {
      if (msg.members) renderCollaborators(msg.members);
      const newHost = cleanLabel(msg.newHost);
      state.isHost = newHost && newHost === state.username;
      if (els.hostControlsPanel) els.hostControlsPanel.style.display = state.isHost ? 'flex' : 'none';
      showToast(state.isHost ? '👑 You are now the host' : `👑 ${newHost || 'Someone'} is now host`);
    });

    state.sync.on('kicked', () => {
      showToast('⚠️ You were kicked from the room by the host');
      leaveRoomView();
    });

    state.sync.on('play', (msg) => {
      state.isPlaying = true;
      if (els.playPauseBtn) els.playPauseBtn.textContent = '⏸ pause';
    });

    state.sync.on('pause', () => {
      state.isPlaying = false;
      if (els.playPauseBtn) els.playPauseBtn.textContent = '▶ play';
    });

    state.sync.on('load-track', (msg) => {
      state.isPlaying = true;
      if (els.playPauseBtn) els.playPauseBtn.textContent = '⏸ pause';
      loadMediaTrack(msg.trackId, msg.positionAtOrigin || 0);
    });

    state.sync.on('queue-update', (msg) => {
      updateQueueUI(msg.queue);
    });

    state.sync.on('queue-ended', () => {
      state.isPlaying = false;
      state.currentTrack = null;
      if (els.playPauseBtn) els.playPauseBtn.textContent = '▶ play';
      if (els.progressFill) els.progressFill.style.width = '0%';
      if (els.currentTime) els.currentTime.textContent = '00:00';
      showToast('✅ Queue finished. Add another track to keep jamming.');
    });

    state.sync.on('full-state', (msg) => {
      if (msg.members) renderCollaborators(msg.members);
      if (msg.queue) updateQueueUI(msg.queue);
      if (msg.playback && msg.playback.trackId && (!state.currentTrack || state.currentTrack.videoId !== msg.playback.trackId)) {
        loadMediaTrack(msg.playback.trackId, msg.playback.positionAtOrigin || 0);
      }
    });

    state.sync.on('chat', (msg) => {
      appendChatMessage(msg.name || 'Guest', msg.text, msg.ts);
    });

    state.sync.on('typing', (msg) => {
      if (els.typingIndicator && els.typingText) {
        els.typingText.textContent = `${msg.user} is typing...`;
        els.typingIndicator.style.display = 'flex';
        clearTimeout(state.typingTimer);
        state.typingTimer = setTimeout(() => {
          els.typingIndicator.style.display = 'none';
        }, 2000);
      }
    });

    state.sync.on('reaction-burst', (msg) => {
      renderReactionParticle(msg.emoji);
    });

    state.sync.on('skip-vote-updated', (msg) => {
      state.skipVotesCount = msg.votesCount;
      if (els.voteCount) els.voteCount.textContent = msg.votesCount;
      showToast(`🗳️ ${msg.voter} voted to skip (${msg.votesCount}/${msg.requiredVotes})`);
    });

    state.sync.on('room-lock-updated', (msg) => {
      state.isLocked = msg.isLocked;
      if (els.lockBadge) els.lockBadge.style.display = msg.isLocked ? 'inline-block' : 'none';
      if (els.toggleLockBtn) els.toggleLockBtn.textContent = `🔒 Lock Room: ${msg.isLocked ? 'ON' : 'OFF'}`;
      showToast(msg.isLocked ? '🔒 Room locked by host' : '🔓 Room unlocked');
    });

    state.sync.on('queue-permissions-updated', (msg) => {
      state.allowGuestQueue = msg.allowGuestQueue;
      if (els.toggleQueuePermsBtn) els.toggleQueuePermsBtn.textContent = `👥 Guests Can Queue: ${msg.allowGuestQueue ? 'ON' : 'OFF'}`;
      showToast(`Queue perms updated: Guests can queue = ${msg.allowGuestQueue}`);
    });

    state.sync.on('error', (msg) => {
      showToast(`⚠️ ${msg.message}`);
    });

    state.sync.connect();
  }

  // ========== UI NAVIGATION & ROOM FLOW ==========
  function enterRoomView(code) {
    if (els.lobby) els.lobby.style.display = 'none';
    if (els.room) els.room.style.display = 'flex';
    if (els.connectionBanner) els.connectionBanner.style.display = 'none';
    if (els.retryBanner) els.retryBanner.style.display = 'none';
    if (els.codeDisplay) els.codeDisplay.textContent = code.toUpperCase();
    if (els.hostControlsPanel) els.hostControlsPanel.style.display = state.isHost ? 'flex' : 'none';

    // Update URL Hash
    window.location.hash = `JAM-${code.toUpperCase()}`;
  }

  function leaveRoomView() {
    if (state.sync) state.sync.leaveRoom();
    if (els.room) els.room.style.display = 'none';
    if (els.lobby) els.lobby.style.display = 'flex';
    window.location.hash = '';
    state.isHost = false;
  }

  function updateQueueUI(queue) {
    state.queue = queue || [];
    if (els.queueCount) els.queueCount.textContent = state.queue.length;
    if (!els.queueList) return;

    if (state.queue.length === 0) {
      els.queueList.innerHTML = '';
      els.queueList.appendChild(createElement('li', 'queue-item empty-queue-item', 'no tracks queued — paste a link or pick a preset above'));
      return;
    }

    els.queueList.innerHTML = '';
    state.queue.forEach((t, i) => {
      const li = document.createElement('li');
      const isCur = state.currentTrack && state.currentTrack.videoId === t.videoId;
      li.className = `queue-item ${isCur ? 'now-playing-item' : ''}`;
      li.appendChild(createElement('span', '', `${isCur ? '▶ ' : ''}${i + 1}. ${cleanLabel(t.title || t.videoId, 'Untitled media')}`));
      const remove = createElement('button', 'kick-btn remove-queue-btn', '✕');
      remove.type = 'button';
      remove.dataset.id = t.videoId;
      remove.style.cssText = 'background:none;border:none;color:var(--text-muted);cursor:pointer;';
      remove.title = 'Remove from queue';
      li.appendChild(remove);
      els.queueList.appendChild(li);
    });

    els.queueList.querySelectorAll('.remove-queue-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (state.sync && id) state.sync.removeFromQueue(id);
      });
    });
  }

  function appendChatMessage(name, text, ts) {
    if (!els.chatMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg';
    const timeStr = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const user = createElement('span', 'chat-user', `${cleanLabel(name, 'Guest')}:`);
    user.style.cssText = 'color:var(--green);font-weight:bold;';
    const body = createElement('span', 'chat-text', cleanLabel(text));
    const time = createElement('span', '', timeStr);
    time.style.cssText = 'font-size:0.65rem;color:var(--text-muted);margin-left:auto;';
    msgEl.append(user, body, time);
    els.chatMessages.appendChild(msgEl);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  }

  // ========== INITIALIZATION & EVENT LISTENERS ==========
  function initEvents() {
    // Create Jam
    if (els.createBtn) {
      els.createBtn.addEventListener('click', () => {
        if (!state.sync) return;
        setButtonBusy(els.createBtn, true, 'creating...');
        state.sync.createRoom('jam', state.username, state.avatarColor);
        setTimeout(() => setButtonBusy(els.createBtn, false), 1500);
      });
    }

    // Join Jam
    if (els.joinBtn && els.joinCode) {
      els.joinBtn.addEventListener('click', () => {
        const code = els.joinCode.value.trim().replace(/^JAM-/i, '');
        if (code && state.sync) {
          setButtonBusy(els.joinBtn, true, 'joining...');
          state.sync.joinRoom(code, state.username, state.avatarColor);
          setTimeout(() => setButtonBusy(els.joinBtn, false), 1500);
        }
      });
      els.joinCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') els.joinBtn.click();
      });
    }

    if (els.userPill && els.profileName) {
      els.userPill.addEventListener('click', () => els.profileName.focus());
    }

    if (els.retryBtn) {
      els.retryBtn.addEventListener('click', () => {
        if (!state.sync) return;
        if (els.retryBanner) els.retryBanner.style.display = 'none';
        state.sync.connect();
      });
    }

    // Copy Code / Link
    if (els.roomCodeBadge) {
      els.roomCodeBadge.addEventListener('click', () => {
        const code = els.codeDisplay.textContent;
        const link = `${window.location.origin}${window.location.pathname}#JAM-${code}`;
        navigator.clipboard.writeText(link).then(() => {
          showToast(`📋 Invite link copied to clipboard! (${link})`);
        });
      });
    }

    // Controls: Play/Pause, Skip, Vote Skip
    if (els.playPauseBtn) {
      els.playPauseBtn.addEventListener('click', () => {
        if (!state.sync) return;
        if (state.isPlaying) {
          state.sync.pause();
        } else {
          state.sync.play(state.currentTrack?.videoId);
        }
      });
    }

    if (els.skipBtn) {
      els.skipBtn.addEventListener('click', () => {
        if (state.sync) state.sync.skip();
      });
    }

    if (els.voteSkipBtn) {
      els.voteSkipBtn.addEventListener('click', () => {
        if (state.sync) state.sync.voteSkip();
      });
    }

    // Progress Bar Scrubbing
    if (els.progressBar) {
      els.progressBar.addEventListener('click', (e) => {
        if (!state.isHost) {
          showToast('⚠️ Playback position scrubbing is host-controlled');
          return;
        }
        const rect = els.progressBar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const seekTarget = ratio * state.duration;
        if (state.sync) state.sync.seek(seekTarget);
      });
    }

    // Reactions Toolbar
    if (els.reactionBar) {
      els.reactionBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.reaction-burst-btn');
        if (btn) triggerReactionBurst(btn.dataset.emoji);
      });
    }

    // Add Media URL
    if (els.addUrlBtn && els.urlInput) {
      const handleAdd = () => {
        const url = els.urlInput.value.trim();
        const mediaId = extractMediaId(url);
        if (mediaId && state.sync) {
          state.sync.addToQueue({ videoId: mediaId, title: getMediaTitleFromUrl(url) || mediaId });
          els.urlInput.value = '';
          showToast('➕ Added track to queue!');
        } else {
          showToast('⚠️ Please enter a valid YouTube, SoundCloud, Vimeo, or direct media link');
        }
      };
      els.addUrlBtn.addEventListener('click', handleAdd);
      els.urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdd(); });
    }

    // File Upload
    if (els.fileInput) {
      els.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const blobUrl = URL.createObjectURL(file);
          if (state.sync) {
            state.sync.addToQueue({ videoId: blobUrl, title: `Local: ${file.name}` });
            state.objectUrls.add(blobUrl);
            showToast(`📁 Added local file: ${file.name}`);
          }
        }
      });
    }

    // Quick Presets
    if (els.presetsGrid) {
      els.presetsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;
        const url = btn.dataset.url;
        const title = btn.dataset.title;
        const mediaId = extractMediaId(url);
        if (mediaId && state.sync) {
          if (!state.sync.roomCode) {
            state.pendingTrack = { videoId: mediaId, title };
            state.sync.createRoom('jam', state.username, state.avatarColor);
          } else {
            state.sync.addToQueue({ videoId: mediaId, title });
          }
          showToast(`⚡ Loaded preset: ${title}`);
        }
      });
    }

    // Host Controls
    if (els.toggleLockBtn) els.toggleLockBtn.addEventListener('click', () => { if (state.sync) state.sync.toggleLock(); });
    if (els.toggleQueuePermsBtn) els.toggleQueuePermsBtn.addEventListener('click', () => { if (state.sync) state.sync.toggleQueuePermissions(); });
    if (els.openParticipantsBtn && els.presenceDrawer) {
      els.openParticipantsBtn.addEventListener('click', () => {
        els.presenceDrawer.style.display = els.presenceDrawer.style.display === 'block' ? 'none' : 'block';
      });
    }

    // Chat Send & Typing
    if (els.chatSend && els.chatInput) {
      const sendMsg = () => {
        const text = els.chatInput.value.trim();
        if (text && state.sync) {
          state.sync.sendChat(text, state.username);
          els.chatInput.value = '';
        }
      };
      els.chatSend.addEventListener('click', sendMsg);
      els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMsg();
        else if (state.sync) state.sync.sendTyping();
      });
    }

    // Drawers & Focus Mode
    if (els.togglePresenceBtn && els.presenceDrawer) {
      els.togglePresenceBtn.addEventListener('click', () => {
        const vis = els.presenceDrawer.style.display === 'block';
        els.presenceDrawer.style.display = vis ? 'none' : 'block';
      });
    }

    if (els.chatToggle && els.chatPanel) {
      els.chatToggle.addEventListener('click', () => {
        const collapsed = els.chatPanel.classList.toggle('collapsed');
        els.chatToggle.textContent = collapsed ? '▸' : '▾';
      });
    }

    if (els.focusToggle) {
      els.focusToggle.addEventListener('click', () => {
        state.focusMode = !state.focusMode;
        document.body.classList.toggle('focus-mode', state.focusMode);
        els.focusToggle.classList.toggle('active', state.focusMode);
      });
    }

    if (els.leaveBtn) els.leaveBtn.addEventListener('click', leaveRoomView);

    // Auto-Join from URL Hash
    const hash = window.location.hash.trim().replace(/^#JAM-/i, '').replace(/^#/i, '');
    if (hash && hash.length >= 4) {
      setTimeout(() => {
        if (state.sync) state.sync.joinRoom(hash, state.username, state.avatarColor);
      }, 500);
    }
  }

  // ========== MAIN ENTRY ==========
  function bootstrap() {
    initProfile();
    initSyncEngine();
    setupMediaSession();
    initBackgroundAudioKeepAlive();
    startVisualizer();
    startProgressLoop();
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
