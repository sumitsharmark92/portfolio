/* ============================================================
   ANON.CHAT — Anonymous Chat Room Client
   Real-time chat with reactions, typing indicators,
   random usernames, and auto-scroll.
   ============================================================ */

(function () {
  'use strict';

  // Only run on chat page
  if (!document.getElementById('chatRoom')) return;

  // ========== DOM Elements ==========
  const lobby = document.getElementById('chatLobby');
  const howSection = document.getElementById('chatHowItWorks');
  const roomEl = document.getElementById('chatRoom');
  const codeDisplay = document.getElementById('chatCodeDisplay');
  const roomCodeEl = document.getElementById('chatRoomCode');
  const messagesEl = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSend');
  const createBtn = document.getElementById('createChatBtn');
  const joinBtn = document.getElementById('joinChatBtn');
  const joinCodeInput = document.getElementById('joinChatCode');
  const leaveBtn = document.getElementById('chatLeave');
  const typingIndicator = document.getElementById('typingIndicator');
  const typingText = document.getElementById('typingText');
  const membersList = document.getElementById('chatMembersList');
  const memberCount = document.getElementById('chatMemberCount');
  const connectionBanner = document.getElementById('chatConnectionBanner');
  const reactionBar = document.getElementById('reactionBar');

  // ========== State ==========
  let sync = null;
  let myUsername = null;
  let isHost = false;
  let roomCode = null;
  let members = [];
  let messageIdCounter = 0;
  let typingTimeout = null;
  let lastTypingSent = 0;
  let typingUsers = new Map(); // username → timeout

  // ========== Toast ==========
  function showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
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
      updateMembers();
      showToast(`Joined as ${myUsername}`);
    });

    sync.on('member-joined', (data) => {
      addSystemMessage(`${data.username} joined the room`);
      if (!members.find(m => m.username === data.username)) {
        members.push({ username: data.username, isHost: false });
      }
      updateMembers();
    });

    sync.on('member-left', (data) => {
      addSystemMessage(`${data.username} left the room`);
      members = members.filter(m => m.username !== data.username);
      updateMembers();
      // Remove from typing
      typingUsers.delete(data.username);
      updateTypingIndicator();
    });

    sync.on('host-changed', (data) => {
      if (data.isYou) {
        isHost = true;
        showToast('You are now the host');
      }
      addSystemMessage(`${data.newHost} is now the host`);
    });

    sync.on('chat', (data) => {
      addChatMessage(data.user, data.text, data.timestamp);
      // Remove typing indicator for this user
      typingUsers.delete(data.user);
      updateTypingIndicator();
    });

    sync.on('typing', (data) => {
      if (data.user === myUsername) return;
      // Set or reset typing timeout
      if (typingUsers.has(data.user)) {
        clearTimeout(typingUsers.get(data.user));
      }
      typingUsers.set(data.user, setTimeout(() => {
        typingUsers.delete(data.user);
        updateTypingIndicator();
      }, 3000));
      updateTypingIndicator();
    });

    sync.on('reaction', (data) => {
      showReactionFloat(data.emoji);
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

    sync.on('reconnected', () => {
      connectionBanner.classList.remove('visible');
      showToast('Reconnected!');
    });
  }

  // ========== Room Entry ==========
  function enterRoom(code) {
    lobby.style.display = 'none';
    if (howSection) howSection.style.display = 'none';
    roomEl.classList.add('active');
    codeDisplay.textContent = code;
    messagesEl.innerHTML = '';
    addSystemMessage('Welcome to the chat! Messages are not saved.');

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('code', code);
    window.history.replaceState({}, '', url);
  }

  function leaveRoom() {
    if (sync) sync.send({ type: 'leave-room' });
    roomEl.classList.remove('active');
    lobby.style.display = '';
    if (howSection) howSection.style.display = '';
    myUsername = null;
    isHost = false;
    roomCode = null;
    members = [];
    typingUsers.clear();

    const url = new URL(window.location);
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url);
  }

  // ========== Messages ==========
  function addChatMessage(user, text, timestamp) {
    const msgId = `msg-${++messageIdCounter}`;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg';
    msgEl.id = msgId;
    msgEl.dataset.messageId = msgId;

    const isMe = user === myUsername;
    if (isMe) msgEl.classList.add('my-msg');

    const time = timestamp ? new Date(timestamp) : new Date();
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.innerHTML = `
      <span class="chat-user ${isMe ? 'chat-user-me' : ''}">${escapeHtml(user)}</span>
      <span class="chat-time">${timeStr}</span>
      <div class="chat-bubble ${isMe ? 'chat-bubble-me' : ''}">
        <span class="chat-text">${escapeHtml(text)}</span>
      </div>
    `;

    messagesEl.appendChild(msgEl);
    autoScroll();
  }

  function addSystemMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg system-msg';
    msgEl.innerHTML = `<span class="chat-text">⸻ ${escapeHtml(text)} ⸻</span>`;
    messagesEl.appendChild(msgEl);
    autoScroll();
  }

  function autoScroll() {
    const threshold = 120;
    const isNearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
    if (isNearBottom) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== Typing Indicator ==========
  function updateTypingIndicator() {
    const users = Array.from(typingUsers.keys());
    if (users.length === 0) {
      typingIndicator.classList.remove('visible');
    } else if (users.length === 1) {
      typingText.textContent = `${users[0]} is typing...`;
      typingIndicator.classList.add('visible');
    } else if (users.length === 2) {
      typingText.textContent = `${users[0]} and ${users[1]} are typing...`;
      typingIndicator.classList.add('visible');
    } else {
      typingText.textContent = `${users.length} people are typing...`;
      typingIndicator.classList.add('visible');
    }
  }

  function sendTypingIndicator() {
    const now = Date.now();
    if (now - lastTypingSent < 2000) return;
    lastTypingSent = now;
    if (sync) sync.send({ type: 'typing' });
  }

  // ========== Members ==========
  function updateMembers() {
    membersList.innerHTML = members.map(m => {
      const isMe = m.username === myUsername;
      const host = m.isHost ? ' 👑' : '';
      return `<span class="member-tag ${isMe ? 'member-me' : ''}">${escapeHtml(m.username)}${host}</span>`;
    }).join('');
    memberCount.textContent = members.length;
  }

  // ========== Reactions ==========
  function showReactionFloat(emoji) {
    const float = document.createElement('div');
    float.className = 'reaction-float';
    float.textContent = emoji;
    float.style.left = `${20 + Math.random() * 60}%`;
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 2000);
  }

  // ========== Event Listeners ==========
  createBtn.addEventListener('click', () => {
    initSync();
    sync.send({ type: 'create-room', roomType: 'chat' });
  });

  joinBtn.addEventListener('click', () => {
    const code = joinCodeInput.value.trim();
    if (!code) return;
    initSync();
    sync.send({ type: 'join-room', code, roomType: 'chat' });
  });

  joinCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });

  leaveBtn.addEventListener('click', leaveRoom);

  chatSendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text || !sync) return;
    sync.send({ type: 'chat', text });
    chatInput.value = '';
    chatInput.focus();
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatSendBtn.click();
    }
  });

  chatInput.addEventListener('input', sendTypingIndicator);

  // Copy room code
  roomCodeEl.addEventListener('click', () => {
    const link = `${window.location.origin}${window.location.pathname}?code=${roomCode}`;
    navigator.clipboard.writeText(link).then(() => showToast('Link copied!'));
  });

  // Reaction buttons
  reactionBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.reaction-btn');
    if (!btn || !sync) return;
    const emoji = btn.dataset.emoji;
    sync.send({ type: 'reaction', emoji, messageId: 'global' });
    showReactionFloat(emoji);
  });

  // ========== Auto-join from URL ==========
  const urlCode = new URLSearchParams(window.location.search).get('code');
  if (urlCode) {
    joinCodeInput.value = urlCode;
    setTimeout(() => joinBtn.click(), 300);
  }

})();
