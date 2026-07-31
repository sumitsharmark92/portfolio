/* ============================================================
   COLLABORATIVE WHITEBOARD CLIENT
   Canvas sync over WebSocket with Group Rooms support
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

  // Room State
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const wsUrl = isLocal ? 'ws://localhost:3000' : 'wss://api.sumit-labs.me';
  let ws = null;
  let inRoom = false;
  let roomCode = null;
  let isHost = false;
  let myRoomUsername = null;
  let reconnectTimer = null;

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
            break;

          case 'room-joined':
            inRoom = true;
            roomCode = msg.code;
            isHost = msg.isHost || false;
            myRoomUsername = msg.username;
            updateRoomUI();
            fillBg();
            ws.send(JSON.stringify({ type: 'draw-init' }));
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

    lastX = currX;
    lastY = currY;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // Mouse listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Touch listeners for mobile
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

  // Init
  initWebSocket();
})();
