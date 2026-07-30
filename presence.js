/* ============================================================
   PRESENCE & MULTIPLAYER LIVE CURSORS
   Connects via WebSocket to broadcast and render visitor cursors & chat bubbles.
   ============================================================ */
(function () {
  'use strict';

  // Only run if WebSocket is supported
  if (!window.WebSocket) return;

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}`;

  let ws = null;
  let myId = null;
  let cursors = new Map(); // id -> DOM Element
  let lastSendTime = 0;
  const SEND_INTERVAL = 50; // 20 updates per sec max

  // Create cursor container
  const container = document.createElement('div');
  container.id = 'presence-container';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;overflow:hidden;';
  document.body.appendChild(container);

  function connect() {
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      return;
    }

    ws.onopen = () => {
      // Register presence
      send({ type: 'presence-join', page: location.pathname });
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleMessage(msg);
      } catch (e) {}
    };

    ws.onclose = () => {
      // Remove all cursors and attempt reconnect in 5s
      container.innerHTML = '';
      cursors.clear();
      setTimeout(connect, 5000);
    };
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'presence-init':
        myId = msg.id;
        break;

      case 'presence-update':
        if (msg.id === myId) break;
        updateCursor(msg);
        break;

      case 'presence-leave':
        removeCursor(msg.id);
        break;

      case 'presence-chat':
        if (msg.id === myId) break;
        showBubble(msg.id, msg.text);
        break;
    }
  }

  function updateCursor(data) {
    let el = cursors.get(data.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'presence-cursor';
      el.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${data.color || '#00ff41'}">
          <path d="M3 3l7 18 3-7 7-3L3 3z"/>
        </svg>
        <span class="presence-name" style="background:${data.color || '#00ff41'}">${escapeHtml(data.name || 'Visitor')}</span>
        <div class="presence-bubble"></div>
      `;
      container.appendChild(el);
      cursors.set(data.id, el);
    }

    const x = data.x * window.innerWidth;
    const y = data.y * window.innerHeight;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function removeCursor(id) {
    const el = cursors.get(id);
    if (el) {
      el.remove();
      cursors.delete(id);
    }
  }

  function showBubble(id, text) {
    const el = cursors.get(id);
    if (!el) return;
    const bubble = el.querySelector('.presence-bubble');
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.add('active');
      clearTimeout(bubble._timeout);
      bubble._timeout = setTimeout(() => {
        bubble.classList.remove('active');
      }, 4000);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Mouse movement listener
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSendTime < SEND_INTERVAL) return;
    lastSendTime = now;

    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    send({
      type: 'presence-move',
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000
    });
  });

  // Hotkey or slash command for cursor chat (press '/' or double shift to chat)
  // For simplicity, listen for 'c' key when not focused in input
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'c' || e.key === 'C') {
      const msg = prompt('Type a quick message for visitors nearby:');
      if (msg && msg.trim()) {
        send({ type: 'presence-chat', text: msg.trim().substring(0, 80) });
        // Show locally too
        if (myId) showBubble(myId, msg.trim().substring(0, 80));
      }
    }
  });

  connect();
})();
