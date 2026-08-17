/* ============================================================
   COLLABORATIVE WHITEBOARD CLIENT
   Canvas sync over WebSocket with Group Rooms and Chat support
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('whiteboardCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let currentColor = '#00ff41';
  let currentSize = 3;
  let lastX = 0;
  let lastY = 0;

  // Group Room DOM Elements
  const groupLobby = document.getElementById('groupLobby');
  const roomHeader = document.getElementById('roomHeader');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const roomMembersCount = document.getElementById('roomMembersCount');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const roomCodeInput = document.getElementById('roomCodeInput');
  const leaveRoomBtn = document.getElementById('leaveRoomBtn');

  // Chat DOM Elements
  const groupChatPanel = document.getElementById('groupChatPanel');
  const groupChatMessages = document.getElementById('groupChatMessages');
  const groupChatInput = document.getElementById('groupChatInput');
  const groupChatSend = document.getElementById('groupChatSend');

  // Room State
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const wsUrl = isLocal ? 'ws://localhost:3000' : 'wss://api.sumit-labs.me';
  let ws = null;
  let inRoom = false;
  let roomCode = null;
  let isHost = false;
  let myRoomUsername = null;
  let reconnectTimer = null;

  // Cross-Tab Broadcast Channel Sync
  const drawChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('sumit_whiteboard_sync') : null;
  if (drawChannel) {
    drawChannel.onmessage = (e) => {
      const msg = e.data;
      if (!msg) return;
      if (msg.type === 'draw-stroke') {
        renderLine(msg.x0, msg.y0, msg.x1, msg.y1, msg.color, msg.size);
      } else if (msg.type === 'draw-clear') {
        fillBg();
      }
    };
  }

  // Setup Canvas context defaults
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Fill background
  function fillBg() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  fillBg();

  // --- WebSocket Connection ---
  function initWebSocket() {
    if (ws) {
      try { ws.close(); } catch(e) {}
    }
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] Connected to sync server');
      if (inRoom && roomCode) {
        // Rejoin room
        ws.send(JSON.stringify({
          type: 'join-room',
          code: roomCode,
          username: myRoomUsername
        }));
      } else {
        // Initialize global canvas history
        ws.send(JSON.stringify({ type: 'draw-init' }));
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
            fillBg();
            ws.send(JSON.stringify({ type: 'draw-init' }));
            renderChatHistory([]);
            break;

          case 'room-joined':
            inRoom = true;
            roomCode = msg.code;
            isHost = msg.isHost || false;
            myRoomUsername = msg.username;
            updateRoomUI();
            fillBg();
            ws.send(JSON.stringify({ type: 'draw-init' }));
            renderChatHistory(msg.chatHistory || []);
            if (msg.members) {
              updateMembersCount(msg.members.length);
            }
            break;

          case 'draw-stroke':
            renderLine(msg.x0, msg.y0, msg.x1, msg.y1, msg.color, msg.size);
            break;

          case 'draw-history':
            fillBg();
            if (msg.strokes) {
              msg.strokes.forEach(s => renderLine(s.x0, s.y0, s.x1, s.y1, s.color, s.size));
            }
            break;

          case 'draw-clear':
            fillBg();
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
    } else {
      if (groupLobby) groupLobby.classList.remove('hidden');
      if (roomHeader) roomHeader.classList.add('hidden');
      if (groupChatPanel) groupChatPanel.classList.add('hidden');
    }
  }

  function updateMembersCount(count) {
    if (roomMembersCount) {
      roomMembersCount.textContent = `${count} member${count === 1 ? '' : 's'} online`;
    }
  }

  // --- Canvas Drawing Logic ---
  function renderLine(x0, y0, x1, y1, color, size) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
    ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
    ctx.stroke();
  }

  function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
  }

  function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currX = (e.clientX - rect.left) * scaleX;
    const currY = (e.clientY - rect.top) * scaleY;

    // Draw locally
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    // Send normalized coords
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'draw-stroke',
        x0: lastX / canvas.width,
        y0: lastY / canvas.height,
        x1: currX / canvas.width,
        y1: currY / canvas.height,
        color: currentColor,
        size: currentSize
      }));
    }

    if (drawChannel) {
      try {
        drawChannel.postMessage({
          type: 'draw-stroke',
          x0: lastX / canvas.width,
          y0: lastY / canvas.height,
          x1: currX / canvas.width,
          y1: currY / canvas.height,
          color: currentColor,
          size: currentSize
        });
      } catch (_) {}
    }

    lastX = currX;
    lastY = currY;
  }

  // Touch handlers for mobile
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startDrawing(e.touches[0]);
  });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      draw(e.touches[0]);
      e.preventDefault();
    }
  });
  canvas.addEventListener('touchend', stopDrawing);

  function stopDrawing() {
    isDrawing = false;
  }

  // Mouse listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Toolbar setup
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.getAttribute('data-color');
    });
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSize = parseInt(btn.getAttribute('data-size'), 10);
    });
  });

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const confirmMsg = inRoom
        ? 'Clear the entire whiteboard for everyone in the group?'
        : 'Clear the entire global whiteboard for everyone?';
      if (confirm(confirmMsg)) {
        fillBg();
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'draw-clear' }));
        }
        if (drawChannel) {
          try { drawChannel.postMessage({ type: 'draw-clear' }); } catch (_) {}
        }
      }
    });
  }

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = canvas.toDataURL();
      link.click();
    });
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
      ws.send(JSON.stringify({ type: 'create-room', roomType: 'draw', username: user }));
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
      fillBg();
      // Refetch global draw history
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'draw-init' }));
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

  // Init
  initWebSocket();
})();
