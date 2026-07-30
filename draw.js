/* ============================================================
   COLLABORATIVE WHITEBOARD CLIENT
   Canvas sync over WebSocket
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('whiteboardCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('drawStatus');
  let isDrawing = false;
  let currentColor = '#00ff41';
  let currentSize = 3;
  let lastX = 0;
  let lastY = 0;
  let pendingStroke = null;
  let animationFrame = null;
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let manualDisconnect = false;

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const wsUrl = isLocal ? `ws://${location.host}` : 'wss://api.sumit-labs.me';

  function setStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = `draw-status ${isError ? 'error' : 'connected'}`;
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function connectSocket() {
    clearReconnectTimer();
    manualDisconnect = false;
    const socket = new WebSocket(wsUrl);
    ws = socket;

    socket.onopen = () => {
      reconnectAttempt = 0;
      setStatus('connected');
      socket.send(JSON.stringify({ type: 'draw-init' }));
    };

    socket.onerror = () => {
      setStatus('connection unstable — retrying', true);
    };

    socket.onclose = () => {
      if (manualDisconnect) return;
      reconnectAttempt += 1;
      const delay = Math.min(1000 * (2 ** (reconnectAttempt - 1)), 4000);
      setStatus(`reconnecting in ${Math.round(delay / 1000)}s…`, true);
      reconnectTimer = setTimeout(() => connectSocket(), delay);
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'draw-stroke') {
          queueRender(msg);
        } else if (msg.type === 'draw-history') {
          msg.strokes.forEach(queueRender);
        } else if (msg.type === 'draw-clear') {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } catch (e) {}
    };
  }

  connectSocket();

  // Setup Canvas context defaults
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Fill background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function queueRender(stroke) {
    if (!stroke) return;
    if (animationFrame) return;
    animationFrame = requestAnimationFrame(() => {
      animationFrame = null;
      if (stroke.type === 'draw-stroke') {
        renderLine(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.size);
      } else if (stroke.type === 'draw-history') {
        renderLine(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.size);
      }
    });
  }

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

    pendingStroke = {
      type: 'draw-stroke',
      x0: lastX / canvas.width,
      y0: lastY / canvas.height,
      x1: currX / canvas.width,
      y1: currY / canvas.height,
      color: currentColor,
      size: currentSize
    };

    if (!animationFrame) {
      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        if (pendingStroke) {
          renderLine(pendingStroke.x0, pendingStroke.y0, pendingStroke.x1, pendingStroke.y1, pendingStroke.color, pendingStroke.size);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(pendingStroke));
          }
          pendingStroke = null;
        }
      });
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
      if (confirm('Clear the entire whiteboard for everyone?')) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
})();
