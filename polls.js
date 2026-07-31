/* ============================================================
   POLLS & Q&A CLIENT
   Live polling via HTTP/WS + Q&A submissions + Group Rooms + Chat
   ============================================================ */
(function () {
  'use strict';

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const API_BASE = isLocal ? location.origin : 'https://api.sumit-labs.me';
  const WS_URL = isLocal ? 'ws://localhost:3000' : 'wss://api.sumit-labs.me';
  const API_POLLS = `${API_BASE}/api/polls`;
  const API_QA = `${API_BASE}/api/qa`;

  const pollContainer = document.getElementById('pollContainer');
  const qaForm = document.getElementById('qaForm');
  const qaQuestion = document.getElementById('qaQuestion');
  const qaStatus = document.getElementById('qaStatus');
  const qaAnswered = document.getElementById('qaAnswered');

  // Group Room DOM Elements
  const groupLobby = document.getElementById('groupLobby');
  const roomHeader = document.getElementById('roomHeader');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const roomMembersCount = document.getElementById('roomMembersCount');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const leaveRoomBtn = document.getElementById('leaveRoomBtn');
  const pollCreatorCard = document.getElementById('pollCreatorCard');
  const pollCreateForm = document.getElementById('pollCreateForm');

  // Chat DOM Elements
  const groupChatPanel = document.getElementById('groupChatPanel');
  const groupChatMessages = document.getElementById('groupChatMessages');
  const groupChatInput = document.getElementById('groupChatInput');
  const groupChatSend = document.getElementById('groupChatSend');

  let currentPoll = null;
  let userVotedOption = localStorage.getItem('voted_poll_option');

  // Room State
  let ws = null;
  let inRoom = false;
  let roomCode = null;
  let isHost = false;
  let roomPoll = null;
  let myRoomUsername = null;
  let reconnectTimer = null;

  // --- API / Global Mode ---
  async function fetchPoll() {
    if (inRoom) return; // Don't fetch global poll if in group room
    try {
      const res = await fetch(API_POLLS);
      if (!res.ok) throw new Error('Poll not found');
      currentPoll = await res.json();
      renderPoll();
    } catch (err) {
      if (pollContainer && !inRoom) {
        pollContainer.innerHTML = `<div class="gb-empty"><p>No active poll right now.</p></div>`;
      }
    }
  }

  function renderPoll() {
    if (!pollContainer || !currentPoll || inRoom) return;

    const totalVotes = currentPoll.options.reduce((sum, opt) => sum + opt.votes, 0);

    const optionsHtml = currentPoll.options.map((opt, idx) => {
      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      const isSelected = userVotedOption == idx;

      return `
        <div class="poll-option ${isSelected ? 'selected' : ''}" data-idx="${idx}">
          <div class="poll-option-fill" style="width: ${pct}%;"></div>
          <div class="poll-option-label">
            <span>${escapeHtml(opt.text)}</span>
            <span class="poll-pct">${pct}% (${opt.votes})</span>
          </div>
        </div>
      `;
    }).join('');

    pollContainer.innerHTML = `
      <div class="poll-card reveal">
        <div class="poll-badge">LIVE POLL</div>
        <h2 class="poll-question">${escapeHtml(currentPoll.question)}</h2>
        <div class="poll-options">${optionsHtml}</div>
        <div class="poll-footer">
          <span>Total votes: <strong>${totalVotes}</strong></span>
          ${userVotedOption !== null ? '<span style="color:var(--green);">✓ You voted</span>' : '<span>Click an option to vote</span>'}
        </div>
      </div>
    `;

    // Add click listeners to options
    pollContainer.querySelectorAll('.poll-option').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const idx = parseInt(optEl.getAttribute('data-idx'), 10);
        vote(idx);
      });
    });
  }

  async function vote(optionIdx) {
    try {
      const res = await fetch(`${API_POLLS}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIdx })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vote failed');

      userVotedOption = optionIdx;
      localStorage.setItem('voted_poll_option', optionIdx);
      currentPoll = data;
      renderPoll();
    } catch (err) {
      alert(err.message);
    }
  }

  // Q&A API
  async function fetchQA() {
    try {
      const res = await fetch(API_QA);
      const data = await res.json();
      renderQA(data);
    } catch (err) {
      // ignore
    }
  }

  function renderQA(items) {
    if (!qaAnswered) return;

    if (!items || items.length === 0) {
      qaAnswered.innerHTML = `<div class="gb-empty" style="margin-top:1.5rem;"><p>No questions answered yet. Be the first to ask!</p></div>`;
      return;
    }

    qaAnswered.innerHTML = items.map(item => `
      <div class="qa-card reveal">
        <div class="qa-q">
          <span class="qa-q-prefix">Q:</span>
          <span>${escapeHtml(item.question)}</span>
        </div>
        <div class="qa-a">
          <span class="qa-a-prefix">Sumit:</span>
          <span>${escapeHtml(item.answer)}</span>
        </div>
      </div>
    `).join('');
  }

  if (qaForm) {
    qaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = qaQuestion.value.trim();
      if (!q) return;

      try {
        const res = await fetch(API_QA, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q })
        });
        if (!res.ok) throw new Error('Submission failed');

        qaQuestion.value = '';
        if (qaStatus) {
          qaStatus.textContent = 'Question submitted! Sumit will review it soon.';
          qaStatus.className = 'gb-status gb-status-success';
          setTimeout(() => { qaStatus.textContent = ''; }, 5000);
        }
      } catch (err) {
        if (qaStatus) {
          qaStatus.textContent = 'Failed to submit question.';
          qaStatus.className = 'gb-status gb-status-error';
        }
      }
    });
  }

  // --- WebSocket & Group Room Mode ---
  function initWebSocket() {
    if (ws) {
      try { ws.close(); } catch(e) {}
    }
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected to sync server');
      if (inRoom && roomCode) {
        // Attempt to rejoin room if disconnected
        ws.send(JSON.stringify({
          type: 'join-room',
          code: roomCode,
          username: myRoomUsername
        }));
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        switch (msg.type) {
          case 'room-created':
            inRoom = true;
            roomCode = msg.code;
            isHost = true;
            myRoomUsername = msg.username;
            roomPoll = null;
            updateRoomUI();
            renderGroupPoll();
            renderChatHistory([]);
            break;

          case 'room-joined':
            inRoom = true;
            roomCode = msg.code;
            isHost = msg.isHost || false;
            myRoomUsername = msg.username;
            roomPoll = msg.poll || null;
            updateRoomUI();
            renderGroupPoll();
            renderChatHistory(msg.chatHistory || []);
            if (msg.members) {
              updateMembersCount(msg.members.length);
            }
            break;

          case 'poll-update':
            if (inRoom) {
              roomPoll = {
                question: msg.question,
                options: msg.options,
                votesMap: msg.votesMap || {}
              };
              renderGroupPoll();
            }
            break;

          case 'chat':
            if (inRoom && msg.roomId === roomCode) {
              addChatMessage(msg.name, msg.text, msg.ts);
            }
            break;

          case 'member-joined':
            if (inRoom) {
              showToast(`${msg.username} joined the group`);
              addSystemMessage(`${msg.username} joined the group`);
              if (roomMembersCount) {
                const cur = parseInt(roomMembersCount.textContent) || 1;
                updateMembersCount(cur + 1);
              }
            }
            break;

          case 'member-left':
            if (inRoom) {
              showToast(`${msg.username} left the group`);
              addSystemMessage(`${msg.username} left the group`);
              if (roomMembersCount) {
                const cur = parseInt(roomMembersCount.textContent) || 2;
                updateMembersCount(Math.max(1, cur - 1));
              }
            }
            break;

          case 'host-changed':
            if (inRoom) {
              showToast(`${msg.newHost} is now the host`);
              addSystemMessage(`${msg.newHost} is now the host`);
              if (msg.isYou) {
                isHost = true;
                updateRoomUI();
                renderGroupPoll();
              }
            }
            break;

          case 'error':
            alert(msg.message || 'An error occurred');
            break;
        }
      } catch (e) {
        console.error('[WS] Error processing message:', e);
      }
    };

    ws.onclose = () => {
      console.warn('[WS] Connection closed');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(initWebSocket, 4000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Connection error:', err);
    };
  }

  function updateRoomUI() {
    if (inRoom) {
      if (groupLobby) groupLobby.classList.add('hidden');
      if (roomHeader) roomHeader.classList.remove('hidden');
      if (roomCodeDisplay) roomCodeDisplay.textContent = roomCode.toUpperCase();
      if (groupChatPanel) groupChatPanel.classList.remove('hidden');
      if (isHost) {
        if (pollCreatorCard) pollCreatorCard.classList.remove('hidden');
      } else {
        if (pollCreatorCard) pollCreatorCard.classList.add('hidden');
      }
    } else {
      if (groupLobby) groupLobby.classList.remove('hidden');
      if (roomHeader) roomHeader.classList.add('hidden');
      if (pollCreatorCard) pollCreatorCard.classList.add('hidden');
      if (groupChatPanel) groupChatPanel.classList.add('hidden');
    }
  }

  function updateMembersCount(count) {
    if (roomMembersCount) {
      roomMembersCount.textContent = `${count} member${count === 1 ? '' : 's'} online`;
    }
  }

  function renderGroupPoll() {
    if (!pollContainer) return;

    if (!roomPoll) {
      pollContainer.innerHTML = `
        <div class="poll-card reveal">
          <div class="poll-badge" style="background: rgba(0,212,255,0.1); color: var(--cyan); border-color: var(--cyan);">GROUP POLL</div>
          <h2 class="poll-question" style="text-align: center; color: var(--text-muted); font-size: 1.1rem; margin: 1rem 0;">
            Waiting for Host to create a group poll...
          </h2>
        </div>
      `;
      return;
    }

    const totalVotes = roomPoll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const votedIdx = roomPoll.votesMap ? roomPoll.votesMap[myRoomUsername] : undefined;
    const hasVoted = votedIdx !== undefined;

    const optionsHtml = roomPoll.options.map((opt, idx) => {
      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      const isSelected = votedIdx == idx;

      return `
        <div class="poll-option ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''}" data-idx="${idx}">
          <div class="poll-option-fill" style="width: ${pct}%;"></div>
          <div class="poll-option-label">
            <span>${escapeHtml(opt.text)}</span>
            <span class="poll-pct">${pct}% (${opt.votes})</span>
          </div>
        </div>
      `;
    }).join('');

    pollContainer.innerHTML = `
      <div class="poll-card reveal">
        <div class="poll-badge" style="background: rgba(0,212,255,0.1); color: var(--cyan); border-color: var(--cyan);">GROUP POLL</div>
        <h2 class="poll-question">${escapeHtml(roomPoll.question)}</h2>
        <div class="poll-options">${optionsHtml}</div>
        <div class="poll-footer">
          <span>Total votes: <strong>${totalVotes}</strong></span>
          ${hasVoted ? '<span style="color:var(--green);">✓ You voted</span>' : '<span>Click an option to vote</span>'}
        </div>
      </div>
    `;

    // Only allow clicking options if the user has not voted yet
    if (!hasVoted) {
      pollContainer.querySelectorAll('.poll-option').forEach(optEl => {
        optEl.style.cursor = 'pointer';
        optEl.addEventListener('click', () => {
          const idx = parseInt(optEl.getAttribute('data-idx'), 10);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'poll-vote', optionIdx: idx }));
          } else {
            alert('Cannot submit vote. Sync server offline.');
          }
        });
      });
    } else {
      pollContainer.querySelectorAll('.poll-option').forEach(optEl => {
        optEl.style.cursor = 'default';
      });
    }
  }

  // --- Group Chat Panel Logic ---
  function renderChatHistory(history) {
    if (!groupChatMessages) return;
    groupChatMessages.innerHTML = '';
    history.forEach(m => addChatMessage(m.name, m.text, m.ts, false));
    scrollChat();
  }

  function addChatMessage(user, text, ts, scroll = true) {
    if (!groupChatMessages) return;
    const timeStr = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `
      <span style="font-size:0.72rem;color:var(--text-muted);margin-right:0.3rem;">[${timeStr}]</span>
      <span class="chat-user">${escapeHtml(user)}:</span>
      <span class="chat-text">${escapeHtml(text)}</span>
    `;
    groupChatMessages.appendChild(div);
    if (scroll) scrollChat();
  }

  function addSystemMessage(text) {
    if (!groupChatMessages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg system-msg';
    div.innerHTML = `<span class="chat-text">${escapeHtml(text)}</span>`;
    groupChatMessages.appendChild(div);
    scrollChat();
  }

  function scrollChat() {
    if (groupChatMessages) {
      groupChatMessages.scrollTop = groupChatMessages.scrollHeight;
    }
  }

  function sendRoomChat() {
    if (!groupChatInput) return;
    const text = groupChatInput.value.trim();
    if (!text) return;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat',
        roomId: roomCode,
        name: myRoomUsername,
        text: text
      }));
      groupChatInput.value = '';
    } else {
      alert('Cannot send message. Sync server offline.');
    }
  }

  if (groupChatSend) {
    groupChatSend.addEventListener('click', sendRoomChat);
  }
  if (groupChatInput) {
    groupChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendRoomChat();
    });
  }

  // --- Button Handlers ---
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Cannot connect to sync server. Please run start-backend.bat first!');
        return;
      }
      const user = `user_${Math.random().toString(36).substring(2, 6)}`;
      ws.send(JSON.stringify({ type: 'create-room', roomType: 'poll', username: user }));
    });
  }

  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      const code = roomCodeInput.value.trim().toLowerCase();
      if (!code) {
        alert('Please enter a group room code.');
        return;
      }
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Cannot connect to sync server. Please run start-backend.bat first!');
        return;
      }
      const user = `user_${Math.random().toString(36).substring(2, 6)}`;
      ws.send(JSON.stringify({ type: 'join-room', code, username: user }));
    });
  }

  if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener('click', () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-room' }));
      }
      inRoom = false;
      roomCode = null;
      isHost = false;
      roomPoll = null;
      myRoomUsername = null;
      updateRoomUI();
      fetchPoll(); // reload global poll
    });
  }

  if (pollCreateForm) {
    pollCreateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const question = document.getElementById('newPollQuestion').value.trim();
      const opt1 = document.getElementById('newPollOpt1').value.trim();
      const opt2 = document.getElementById('newPollOpt2').value.trim();
      const opt3 = document.getElementById('newPollOpt3').value.trim();
      const opt4 = document.getElementById('newPollOpt4').value.trim();

      const options = [opt1, opt2];
      if (opt3) options.push(opt3);
      if (opt4) options.push(opt4);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'poll-create', question, options }));
        pollCreateForm.reset();
      } else {
        alert('Cannot create group poll. Sync server offline.');
      }
    });
  }

  function showToast(msg) {
    if (window.showToast) {
      window.showToast(msg);
    } else {
      console.log('[Toast]', msg);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- INIT ---
  initWebSocket();
  fetchPoll();
  fetchQA();
  setInterval(fetchPoll, 5000); // refresh global poll periodically if not in room
})();
