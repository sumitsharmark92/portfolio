/* ============================================================
   GUESTBOOK CLIENT
   Fetch entries, submit new entries, live updates, and Group Rooms.
   ============================================================ */
(function () {
  'use strict';

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const API_BASE = isLocal ? location.origin : 'https://api.sumit-labs.me';
  const WS_URL = isLocal ? 'ws://localhost:3000' : 'wss://api.sumit-labs.me';
  const API = `${API_BASE}/api/guestbook`;

  const form = document.getElementById('gbForm');
  const entriesEl = document.getElementById('gbEntries');
  const countEl = document.getElementById('gbCount');
  const statusEl = document.getElementById('gbStatus');
  const charCountEl = document.getElementById('gbCharCount');
  const messageInput = document.getElementById('gbMessage');
  const submitBtn = document.getElementById('gbSubmitBtn');

  // Group Room DOM Elements
  const groupLobby = document.getElementById('groupLobby');
  const roomHeader = document.getElementById('roomHeader');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const roomMembersCount = document.getElementById('roomMembersCount');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const leaveRoomBtn = document.getElementById('leaveRoomBtn');

  let cooldown = false;

  // Room State
  let ws = null;
  let inRoom = false;
  let roomCode = null;
  let isHost = false;
  let myRoomUsername = null;
  let reconnectTimer = null;

  // Character counter
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      charCountEl.textContent = messageInput.value.length;
    });
  }

  // --- API / Global Mode Load ---
  async function loadEntries() {
    if (inRoom) return; // Don't fetch global guestbook in room mode
    try {
      const res = await fetch(API);
      const data = await res.json();

      countEl.textContent = data.length;

      if (data.length === 0) {
        entriesEl.innerHTML = `
          <div class="gb-empty">
            <p style="font-size:2rem;">📭</p>
            <p>No messages yet. Be the first to sign!</p>
          </div>`;
        return;
      }

      entriesEl.innerHTML = data.map(entry => renderEntry(entry)).join('');
    } catch (err) {
      if (!inRoom) {
        entriesEl.innerHTML = `<div class="gb-empty"><p>Failed to load messages.</p></div>`;
      }
    }
  }

  function renderEntry(entry) {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const nameHtml = entry.link
      ? `<a href="${escapeHtml(entry.link)}" target="_blank" rel="noopener noreferrer" class="gb-entry-name">${escapeHtml(entry.name)}</a>`
      : `<span class="gb-entry-name">${escapeHtml(entry.name)}</span>`;

    return `
      <div class="gb-entry reveal">
        <div class="gb-entry-header">
          <div class="gb-entry-avatar">${entry.name.charAt(0).toUpperCase()}</div>
          ${nameHtml}
          <span class="gb-entry-date">${date}</span>
        </div>
        <p class="gb-entry-message">${escapeHtml(entry.message)}</p>
      </div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Submit Form ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cooldown) {
      showStatus('Please wait a moment before posting again.', 'error');
      return;
    }

    const honeypot = document.getElementById('gbHoneypot');
    if (honeypot && honeypot.value) return; // Bot detected

    const name = document.getElementById('gbName').value.trim() || 'anonymous';
    const message = document.getElementById('gbMessage').value.trim();
    const link = document.getElementById('gbLink').value.trim();

    if (!message) {
      showStatus('Message is required.', 'error');
      return;
    }

    if (message.length > 500) {
      showStatus('Message too long (max 500 chars).', 'error');
      return;
    }

    if (inRoom) {
      // Group Room Mode: Send via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'guestbook-post',
          name,
          message,
          link
        }));
        showStatus('Message sent to group!', 'success');
        form.reset();
        charCountEl.textContent = '0';
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 3000); // short 3s cooldown for rooms
      } else {
        showStatus('Connection lost. Cannot send message.', 'error');
      }
    } else {
      // Global HTTP API Mode
      submitBtn.disabled = true;
      submitBtn.textContent = 'posting...';

      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, message, link }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to post');
        }

        showStatus('Message posted! Thanks for signing.', 'success');
        form.reset();
        charCountEl.textContent = '0';

        cooldown = true;
        setTimeout(() => { cooldown = false; }, 30000); // 30s cooldown for global

        loadEntries();
      } catch (err) {
        showStatus(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'sign guestbook →';
      }
    }
  });

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `gb-status gb-status-${type}`;
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'gb-status'; }, 5000);
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
            updateRoomUI();
            renderGroupMessages([]);
            break;

          case 'room-joined':
            inRoom = true;
            roomCode = msg.code;
            isHost = msg.isHost || false;
            myRoomUsername = msg.username;
            updateRoomUI();
            renderGroupMessages(msg.guestbook || []);
            if (msg.members) {
              updateMembersCount(msg.members.length);
            }
            break;

          case 'guestbook-update':
            if (inRoom) {
              renderGroupMessages(msg.guestbook || []);
            }
            break;

          case 'member-joined':
            if (inRoom) {
              showToast(`${msg.username} joined the group`);
              if (roomMembersCount) {
                const cur = parseInt(roomMembersCount.textContent) || 1;
                updateMembersCount(cur + 1);
              }
            }
            break;

          case 'member-left':
            if (inRoom) {
              showToast(`${msg.username} left the group`);
              if (roomMembersCount) {
                const cur = parseInt(roomMembersCount.textContent) || 2;
                updateMembersCount(Math.max(1, cur - 1));
              }
            }
            break;

          case 'host-changed':
            if (inRoom) {
              showToast(`${msg.newHost} is now the host`);
              if (msg.isYou) {
                isHost = true;
                updateRoomUI();
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
    } else {
      if (groupLobby) groupLobby.classList.remove('hidden');
      if (roomHeader) roomHeader.classList.add('hidden');
    }
  }

  function updateMembersCount(count) {
    if (roomMembersCount) {
      roomMembersCount.textContent = `${count} member${count === 1 ? '' : 's'} online`;
    }
  }

  function renderGroupMessages(messages) {
    if (!entriesEl) return;

    countEl.textContent = messages.length;

    if (messages.length === 0) {
      entriesEl.innerHTML = `
        <div class="gb-empty">
          <p style="font-size:2rem;">📭</p>
          <p>This group guestbook is empty. Be the first to sign!</p>
        </div>`;
      return;
    }

    entriesEl.innerHTML = messages.map(msg => renderEntry(msg)).join('');
  }

  // --- Button Listeners ---
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Cannot connect to sync server. Please run start-backend.bat first!');
        return;
      }
      const user = `user_${Math.random().toString(36).substring(2, 6)}`;
      ws.send(JSON.stringify({ type: 'create-room', roomType: 'guestbook', username: user }));
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
      myRoomUsername = null;
      updateRoomUI();
      loadEntries(); // Reload global entries
    });
  }

  function showToast(msg) {
    if (window.showToast) {
      window.showToast(msg);
    } else {
      console.log('[Toast]', msg);
    }
  }

  // Init
  initWebSocket();
  loadEntries();
})();
