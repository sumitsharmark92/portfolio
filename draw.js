/* ============================================================
   COLLABORATIVE WHITEBOARD CLIENT
   Canvas sync over WebSocket
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

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const wsUrl = isLocal ? `ws://${location.host}` : 'wss://api.sumit-labs.me';
  const ws = new WebSocket(wsUrl);

  // Setup Canvas context defaults
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Fill background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'draw-init' }));
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === 'draw-stroke') {
        renderLine(msg.x0, msg.y0, msg.x1, msg.y1, msg.color, msg.size);
      } else if (msg.type === 'draw-history') {
        msg.strokes.forEach(s => renderLine(s.x0, s.y0, s.x1, s.y1, s.color, s.size));
      } else if (msg.type === 'draw-clear') {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } catch (e) {}
  };

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
