/* ============================================================
   PARTY.GAMES — Multiplayer Mini-Games Client
   Trivia Battle, Speed Type Race, Emoji Charades,
   Would You Rather — all synced via WebSockets.
   ============================================================ */

(function () {
  'use strict';

  if (!document.getElementById('gamesRoom')) return;

  // ========== DOM ==========
  const lobby = document.getElementById('gamesLobby');
  const roomEl = document.getElementById('gamesRoom');
  const codeDisplay = document.getElementById('gamesCodeDisplay');
  const roomCodeEl = document.getElementById('gamesRoomCode');
  const createBtn = document.getElementById('createGameBtn');
  const joinBtn = document.getElementById('joinGameBtn');
  const joinCodeInput = document.getElementById('joinGameCode');
  const leaveBtn = document.getElementById('gamesLeave');
  const connectionBanner = document.getElementById('gamesConnectionBanner');
  const gameSelect = document.getElementById('gameSelect');
  const gameWaiting = document.getElementById('gameWaiting');
  const gameArea = document.getElementById('gameArea');
  const gameLeaderboard = document.getElementById('gameLeaderboard');
  const leaderboardList = document.getElementById('leaderboardList');
  const playersList = document.getElementById('gamePlayersList');
  const chatMessages = document.getElementById('gameChatMessages');
  const chatInput = document.getElementById('gameChatInput');
  const chatSendBtn = document.getElementById('gameChatSend');

  // ========== State ==========
  let sync = null;
  let myUsername = null;
  let isHost = false;
  let roomCode = null;
  let members = [];
  let currentGame = null;
  let typingStartTime = 0;
  let typingInterval = null;

  // ========== Helpers ==========
  function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function addChatMsg(user, text, isSystem = false) {
    const el = document.createElement('div');
    el.className = isSystem ? 'chat-msg system-msg' : 'chat-msg';
    if (isSystem) {
      el.innerHTML = `<span class="chat-text">⸻ ${escapeHtml(text)} ⸻</span>`;
    } else {
      const isMe = user === myUsername;
      el.innerHTML = `<span class="chat-user ${isMe ? 'chat-user-me' : ''}">${escapeHtml(user)}</span> <span class="chat-text">${escapeHtml(text)}</span>`;
    }
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updatePlayers(scores) {
    playersList.innerHTML = members.map(m => {
      const score = scores ? (scores[m.username] || 0) : 0;
      const isMe = m.username === myUsername;
      const host = m.isHost ? ' 👑' : '';
      return `<div class="game-player ${isMe ? 'game-player-me' : ''}">
        <span class="game-player-name">${escapeHtml(m.username)}${host}</span>
        <span class="game-player-score">${score} pts</span>
      </div>`;
    }).join('');
  }

  function updateLeaderboard(scores) {
    if (!scores) return;
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const medals = ['🥇', '🥈', '🥉'];
    leaderboardList.innerHTML = sorted.map(([name, score], i) => {
      const medal = medals[i] || `#${i + 1}`;
      const isMe = name === myUsername;
      return `<div class="leaderboard-row ${isMe ? 'leaderboard-me' : ''}">
        <span class="leaderboard-rank">${medal}</span>
        <span class="leaderboard-name">${escapeHtml(name)}</span>
        <span class="leaderboard-score">${score}</span>
      </div>`;
    }).join('');
    gameLeaderboard.style.display = 'block';
  }

  // ========== Sync Engine ==========
  function initSync() {
    sync = new SyncEngine();

    sync.on('room-created', (data) => {
      myUsername = data.username;
      isHost = data.isHost;
      roomCode = data.code;
      enterRoom(data.code);
      showToast(`Room created! You are ${myUsername}`);
    });

    sync.on('room-joined', (data) => {
      myUsername = data.username;
      isHost = data.isHost;
      roomCode = data.code;
      members = data.members || [];
      enterRoom(data.code);
      updatePlayers(data.game ? data.game.scores : null);
      if (data.game && data.game.active) {
        currentGame = data.game.gameType;
        gameSelect.style.display = 'none';
        gameWaiting.style.display = 'none';
        addChatMsg(null, `Game in progress: ${data.game.gameType}`, true);
      }
      showToast(`Joined as ${myUsername}`);
    });

    sync.on('member-joined', (data) => {
      addChatMsg(null, `${data.username} joined`, true);
      if (!members.find(m => m.username === data.username)) {
        members.push({ username: data.username, isHost: false });
      }
      updatePlayers();
    });

    sync.on('member-left', (data) => {
      addChatMsg(null, `${data.username} left`, true);
      members = members.filter(m => m.username !== data.username);
      updatePlayers();
    });

    sync.on('host-changed', (data) => {
      if (data.isYou) {
        isHost = true;
        gameSelect.style.display = 'block';
        gameWaiting.style.display = 'none';
        showToast('You are now the host — pick a game!');
      }
      addChatMsg(null, `${data.newHost} is now the host`, true);
    });

    sync.on('chat', (data) => {
      addChatMsg(data.user, data.text);
    });

    sync.on('error', (data) => {
      showToast(`Error: ${data.message}`);
    });

    sync.on('connected', () => {
      connectionBanner.classList.remove('visible');
    });

    sync.on('disconnected', () => {
      connectionBanner.textContent = 'disconnected — reconnecting...';
      connectionBanner.className = 'connection-banner visible connecting';
    });

    // ===== Game Events =====
    sync.on('game-started', (data) => {
      currentGame = data.gameType;
      gameSelect.style.display = 'none';
      gameWaiting.style.display = 'none';
      addChatMsg(null, `🎮 Game starting: ${gameLabel(data.gameType)}!`, true);
      gameArea.innerHTML = `<div class="game-countdown" id="gameCountdown">Get ready...</div>`;
      gameArea.style.display = 'block';
    });

    sync.on('game-round', (data) => {
      renderRound(data);
    });

    sync.on('game-player-answered', (data) => {
      // Show who answered in trivia
      addChatMsg(null, `${data.user} answered (${data.totalAnswered}/${data.totalPlayers})`, true);
    });

    sync.on('game-round-end', (data) => {
      renderRoundEnd(data);
      updateLeaderboard(data.scores);
    });

    sync.on('game-typing-progress', (data) => {
      updateTypingRaceProgress(data);
    });

    sync.on('game-typing-finished', (data) => {
      addChatMsg(null, `${data.user} finished! ${data.wpm} WPM (${data.accuracy}% accuracy)`, true);
    });

    sync.on('game-charades-emoji', (data) => {
      appendCharadesEmoji(data.emoji);
    });

    sync.on('game-charades-guess-msg', (data) => {
      addChatMsg(data.user, `guessed: ${data.guess}`);
    });

    sync.on('game-vote-cast', (data) => {
      addChatMsg(null, `${data.user} voted (${data.totalVoted}/${data.totalPlayers})`, true);
    });

    sync.on('game-over', (data) => {
      renderGameOver(data);
    });
  }

  // ========== Room Management ==========
  function enterRoom(code) {
    lobby.style.display = 'none';
    roomEl.classList.add('active');
    codeDisplay.textContent = code;
    chatMessages.innerHTML = '';
    addChatMsg(null, 'Welcome! Waiting for players...', true);

    if (isHost) {
      gameSelect.style.display = 'block';
      gameWaiting.style.display = 'none';
    } else {
      gameSelect.style.display = 'none';
      gameWaiting.style.display = 'block';
    }
    gameArea.style.display = 'none';
    gameLeaderboard.style.display = 'none';

    const url = new URL(window.location);
    url.searchParams.set('code', code);
    window.history.replaceState({}, '', url);
  }

  function leaveRoom() {
    if (sync) sync.send({ type: 'leave-room' });
    roomEl.classList.remove('active');
    lobby.style.display = '';
    myUsername = null;
    isHost = false;
    roomCode = null;
    members = [];
    currentGame = null;
    if (typingInterval) clearInterval(typingInterval);

    const url = new URL(window.location);
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url);
  }

  function gameLabel(type) {
    const labels = { trivia: '🧠 Trivia Battle', typingrace: '⌨️ Speed Type Race', charades: '🎭 Emoji Charades', wyr: '🤔 Would You Rather' };
    return labels[type] || type;
  }

  // ========== RENDER: Round ==========
  function renderRound(data) {
    gameArea.style.display = 'block';

    switch (currentGame) {
      case 'trivia': renderTriviaRound(data); break;
      case 'typingrace': renderTypingRound(data); break;
      case 'charades': renderCharadesRound(data); break;
      case 'wyr': renderWYRRound(data); break;
    }
  }

  // ----- TRIVIA -----
  function renderTriviaRound(data) {
    gameArea.innerHTML = `
      <div class="game-round-header">
        <span class="game-round-label">Round ${data.round}/${data.totalRounds}</span>
        <span class="game-category">${data.category || ''}</span>
        <div class="game-timer" id="gameTimer"><div class="game-timer-bar" id="gameTimerBar"></div></div>
      </div>
      <div class="game-question">${escapeHtml(data.question)}</div>
      <div class="game-options" id="gameOptions">
        ${data.options.map((opt, i) => `
          <button class="game-option-btn" data-answer="${i}">${escapeHtml(opt)}</button>
        `).join('')}
      </div>
      <div class="game-answer-status" id="gameAnswerStatus"></div>
    `;

    // Timer animation
    startTimer(data.timeLimit || 15000);

    // Option clicks
    let answered = false;
    gameArea.querySelectorAll('.game-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const answer = parseInt(btn.dataset.answer);
        sync.send({ type: 'game-answer', answer });
        btn.classList.add('selected');
        document.getElementById('gameAnswerStatus').textContent = '✓ answer submitted — waiting for others...';
        // Disable all buttons
        gameArea.querySelectorAll('.game-option-btn').forEach(b => b.disabled = true);
      });
    });
  }

  // ----- TYPING RACE -----
  function renderTypingRound(data) {
    gameArea.innerHTML = `
      <div class="game-round-header">
        <span class="game-round-label">Round ${data.round}/${data.totalRounds}</span>
        <div class="game-timer" id="gameTimer"><div class="game-timer-bar" id="gameTimerBar"></div></div>
      </div>
      <div class="typing-prompt" id="typingPrompt">${escapeHtml(data.prompt)}</div>
      <textarea class="typing-input" id="typingInput" placeholder="start typing here..." autocomplete="off" spellcheck="false"></textarea>
      <div class="typing-stats" id="typingStats">
        <span class="typing-wpm">0 WPM</span>
        <span class="typing-accuracy">100% accuracy</span>
        <span class="typing-progress-label">0% done</span>
      </div>
      <div class="typing-race-progress" id="typingRaceProgress"></div>
    `;

    startTimer(data.timeLimit || 30000);

    const input = document.getElementById('typingInput');
    const prompt = data.prompt;
    typingStartTime = 0;
    let finished = false;

    // Build progress bars for all players
    const progressEl = document.getElementById('typingRaceProgress');
    progressEl.innerHTML = members.map(m => `
      <div class="race-track">
        <span class="race-player-name">${escapeHtml(m.username)}</span>
        <div class="race-bar-container">
          <div class="race-bar" id="race-${m.username}" style="width:0%"></div>
        </div>
        <span class="race-wpm" id="racewpm-${m.username}">0</span>
      </div>
    `).join('');

    if (typingInterval) clearInterval(typingInterval);

    input.addEventListener('input', () => {
      if (finished) return;
      if (!typingStartTime) typingStartTime = Date.now();

      const typed = input.value;
      const progress = Math.min(100, Math.round((typed.length / prompt.length) * 100));
      const elapsed = (Date.now() - typingStartTime) / 1000 / 60; // minutes
      const words = typed.trim().split(/\s+/).length;
      const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

      // Calculate accuracy
      let correct = 0;
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === prompt[i]) correct++;
      }
      const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;

      // Update local stats
      const statsEl = document.getElementById('typingStats');
      statsEl.innerHTML = `
        <span class="typing-wpm">${wpm} WPM</span>
        <span class="typing-accuracy">${accuracy}% accuracy</span>
        <span class="typing-progress-label">${progress}% done</span>
      `;

      // Update own progress bar
      const myBar = document.getElementById(`race-${myUsername}`);
      if (myBar) myBar.style.width = `${progress}%`;
      const myWpm = document.getElementById(`racewpm-${myUsername}`);
      if (myWpm) myWpm.textContent = wpm;

      // Send progress to server
      sync.send({ type: 'game-typing-progress', progress, wpm });

      // Check if finished
      if (typed === prompt) {
        finished = true;
        const timeTaken = Date.now() - typingStartTime;
        sync.send({ type: 'game-typing-finish', wpm, accuracy, timeTaken });
        input.disabled = true;
        document.getElementById('gameAnswerStatus') ||
          (gameArea.insertAdjacentHTML('beforeend', `<div class="game-answer-status">🎉 Finished! ${wpm} WPM</div>`));
      }
    });

    input.focus();
  }

  function updateTypingRaceProgress(data) {
    const bar = document.getElementById(`race-${data.user}`);
    if (bar) bar.style.width = `${data.progress}%`;
    const wpm = document.getElementById(`racewpm-${data.user}`);
    if (wpm) wpm.textContent = data.wpm;
  }

  // ----- EMOJI CHARADES -----
  function renderCharadesRound(data) {
    if (data.role === 'describer') {
      gameArea.innerHTML = `
        <div class="game-round-header">
          <span class="game-round-label">Round ${data.round}/${data.totalRounds}</span>
          <span class="game-role-badge describer-badge">🎭 YOU DESCRIBE</span>
          <div class="game-timer" id="gameTimer"><div class="game-timer-bar" id="gameTimerBar"></div></div>
        </div>
        <div class="charades-word">Your word: <strong>${escapeHtml(data.word)}</strong></div>
        <p class="charades-instructions">Use ONLY emojis to describe this word. Click emojis below or type them!</p>
        <div class="charades-emoji-display" id="charadesEmojiDisplay"></div>
        <div class="charades-emoji-picker" id="charadesEmojiPicker">
          ${getEmojiGrid().map(e => `<button class="emoji-pick-btn" data-emoji="${e}">${e}</button>`).join('')}
        </div>
      `;
      startTimer(data.timeLimit || 45000);

      // Emoji picker clicks
      document.getElementById('charadesEmojiPicker').addEventListener('click', (e) => {
        const btn = e.target.closest('.emoji-pick-btn');
        if (!btn) return;
        const emoji = btn.dataset.emoji;
        sync.send({ type: 'game-charades-emoji', emoji });
        appendCharadesEmoji(emoji);
      });
    } else {
      gameArea.innerHTML = `
        <div class="game-round-header">
          <span class="game-round-label">Round ${data.round}/${data.totalRounds}</span>
          <span class="game-role-badge guesser-badge">🔍 GUESS THE WORD</span>
          <div class="game-timer" id="gameTimer"><div class="game-timer-bar" id="gameTimerBar"></div></div>
        </div>
        <p class="charades-instructions">${escapeHtml(data.describer)} is describing with emojis:</p>
        <div class="charades-emoji-display" id="charadesEmojiDisplay"></div>
        <div class="charades-guess-input">
          <input type="text" class="app-input" id="charadesGuessInput" placeholder="type your guess..." style="margin-bottom:0;flex:1;">
          <button class="btn btn-primary" id="charadesGuessBtn">guess</button>
        </div>
      `;
      startTimer(data.timeLimit || 45000);

      const guessInput = document.getElementById('charadesGuessInput');
      const guessBtn = document.getElementById('charadesGuessBtn');
      guessBtn.addEventListener('click', () => {
        const guess = guessInput.value.trim();
        if (!guess) return;
        sync.send({ type: 'game-charades-guess', guess });
        guessInput.value = '';
        guessInput.focus();
      });
      guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') guessBtn.click();
      });
      guessInput.focus();
    }
  }

  function appendCharadesEmoji(emoji) {
    const display = document.getElementById('charadesEmojiDisplay');
    if (!display) return;
    const span = document.createElement('span');
    span.className = 'charades-emoji-item';
    span.textContent = emoji;
    display.appendChild(span);
  }

  function getEmojiGrid() {
    return [
      '😀','😂','😍','🤔','😱','😴','🤮','👻','💀','🔥',
      '❤️','⭐','🌙','☀️','🌧️','⚡','🌊','🏔️','🌴','🌺',
      '🍕','🍔','🍦','🎂','🍎','🥤','🍿','🎃','🐶','🐱',
      '🐸','🦁','🐍','🦅','🐠','🦋','🏠','🚗','✈️','🚀',
      '⚽','🏀','🎸','🎮','📱','💻','🔒','💡','📷','🎬',
      '👑','💎','🗡️','🛡️','🎯','🏆','💪','👀','👋','🤝',
      '🎵','🎤','💃','🕺','🧠','💰','📦','🗺️','🌍','⏰',
    ];
  }

  // ----- WOULD YOU RATHER -----
  function renderWYRRound(data) {
    gameArea.innerHTML = `
      <div class="game-round-header">
        <span class="game-round-label">Round ${data.round}/${data.totalRounds}</span>
        <div class="game-timer" id="gameTimer"><div class="game-timer-bar" id="gameTimerBar"></div></div>
      </div>
      <div class="wyr-title">Would you rather...</div>
      <div class="wyr-options" id="wyrOptions">
        <button class="wyr-option-btn wyr-a" data-vote="a">
          <span class="wyr-label">A</span>
          <span class="wyr-text">${escapeHtml(data.optionA)}</span>
        </button>
        <div class="wyr-vs">VS</div>
        <button class="wyr-option-btn wyr-b" data-vote="b">
          <span class="wyr-label">B</span>
          <span class="wyr-text">${escapeHtml(data.optionB)}</span>
        </button>
      </div>
      <div class="game-answer-status" id="gameAnswerStatus"></div>
    `;

    startTimer(data.timeLimit || 15000);

    let voted = false;
    gameArea.querySelectorAll('.wyr-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (voted) return;
        voted = true;
        sync.send({ type: 'game-vote', vote: btn.dataset.vote });
        btn.classList.add('selected');
        document.getElementById('gameAnswerStatus').textContent = '✓ vote submitted — waiting for others...';
        gameArea.querySelectorAll('.wyr-option-btn').forEach(b => b.disabled = true);
      });
    });
  }

  // ========== RENDER: Round End ==========
  function renderRoundEnd(data) {
    switch (currentGame) {
      case 'trivia': {
        // Highlight correct answer
        const btns = gameArea.querySelectorAll('.game-option-btn');
        btns.forEach((btn, i) => {
          btn.disabled = true;
          if (i === data.correctAnswer) {
            btn.classList.add('correct');
          } else if (btn.classList.contains('selected')) {
            btn.classList.add('wrong');
          }
        });
        const status = document.getElementById('gameAnswerStatus');
        if (status) status.textContent = `Correct answer revealed! Next round in 3s...`;
        break;
      }
      case 'typingrace': {
        const status = document.createElement('div');
        status.className = 'game-answer-status';
        status.textContent = `Round complete! Next round in 3s...`;
        gameArea.appendChild(status);
        break;
      }
      case 'charades': {
        gameArea.innerHTML = `
          <div class="charades-result">
            <div class="charades-result-word">The word was: <strong>${escapeHtml(data.word)}</strong></div>
            ${data.winner
              ? `<div class="charades-winner">🎉 ${escapeHtml(data.winner)} guessed it!</div>`
              : `<div class="charades-winner">⏰ Time's up! Nobody guessed it.</div>`
            }
          </div>
        `;
        break;
      }
      case 'wyr': {
        const total = data.totalVotes || 1;
        const pctA = Math.round((data.votesA / total) * 100);
        const pctB = 100 - pctA;
        gameArea.innerHTML = `
          <div class="wyr-results">
            <div class="wyr-result-title">Results:</div>
            <div class="wyr-result-bar">
              <div class="wyr-result-fill wyr-fill-a" style="width:${pctA}%">
                <span>A: ${pctA}%</span>
              </div>
              <div class="wyr-result-fill wyr-fill-b" style="width:${pctB}%">
                <span>B: ${pctB}%</span>
              </div>
            </div>
            <div class="wyr-result-counts">
              <span>${data.votesA} vote${data.votesA !== 1 ? 's' : ''}</span>
              <span>${data.votesB} vote${data.votesB !== 1 ? 's' : ''}</span>
            </div>
          </div>
        `;
        break;
      }
    }

    updateLeaderboard(data.scores);
  }

  // ========== RENDER: Game Over ==========
  function renderGameOver(data) {
    const sorted = Object.entries(data.scores || {}).sort((a, b) => b[1] - a[1]);
    const winner = sorted[0];
    const medals = ['🥇', '🥈', '🥉'];

    gameArea.innerHTML = `
      <div class="game-over-screen">
        <div class="game-over-title">🏆 Game Over!</div>
        <div class="game-over-subtitle">${gameLabel(data.gameType)}</div>
        ${winner ? `<div class="game-over-winner">${winner[0] === myUsername ? '🎉 You won!' : `${escapeHtml(winner[0])} wins!`} — ${winner[1]} pts</div>` : ''}
        <div class="game-over-standings">
          ${sorted.map(([name, score], i) => `
            <div class="game-over-row ${name === myUsername ? 'game-over-me' : ''}">
              <span>${medals[i] || `#${i + 1}`}</span>
              <span>${escapeHtml(name)}</span>
              <span>${score} pts</span>
            </div>
          `).join('')}
        </div>
        ${isHost ? `<button class="btn btn-primary" id="playAgainBtn" style="margin-top:1.5rem;">play again →</button>` : '<p style="color:var(--text-muted);margin-top:1rem;">waiting for host to pick next game...</p>'}
      </div>
    `;

    updateLeaderboard(data.scores);

    if (isHost) {
      document.getElementById('playAgainBtn').addEventListener('click', () => {
        gameArea.style.display = 'none';
        gameSelect.style.display = 'block';
        currentGame = null;
      });
    }
  }

  // ========== Timer ==========
  function startTimer(duration) {
    const bar = document.getElementById('gameTimerBar');
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${duration}ms linear`;
        bar.style.width = '0%';
      });
    });
  }

  // ========== Event Listeners ==========
  createBtn.addEventListener('click', () => {
    initSync();
    sync.send({ type: 'create-room', roomType: 'games' });
  });

  joinBtn.addEventListener('click', () => {
    const code = joinCodeInput.value.trim();
    if (!code) return;
    initSync();
    sync.send({ type: 'join-room', code });
  });

  joinCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });

  leaveBtn.addEventListener('click', leaveRoom);

  // Game selection cards
  gameSelect.addEventListener('click', (e) => {
    const card = e.target.closest('.game-select-card');
    if (!card || !sync) return;
    const gameType = card.dataset.game;
    sync.send({ type: 'game-start', gameType });
  });

  // Room code copy
  roomCodeEl.addEventListener('click', () => {
    const link = `${window.location.origin}${window.location.pathname}?code=${roomCode}`;
    navigator.clipboard.writeText(link).then(() => showToast('Link copied!'));
  });

  // Chat
  chatSendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text || !sync) return;
    sync.send({ type: 'chat', text });
    chatInput.value = '';
  });
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') chatSendBtn.click();
  });

  // Auto-join from URL
  const urlCode = new URLSearchParams(window.location.search).get('code');
  if (urlCode) {
    joinCodeInput.value = urlCode;
    setTimeout(() => joinBtn.click(), 300);
  }

})();
