/* ============================================================
   AI RESUME & PORTFOLIO CHATBOT CLIENT
   Intelligent chat widget grounded in Sumit's resume & real AI.
   ============================================================ */
(function () {
  'use strict';

  const REQUEST_TIMEOUT_MS = 15000;

  function getApiBase() {
    if (window.PORTFOLIO_API_URL) return window.PORTFOLIO_API_URL;
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocal) return '';
    // If running on Vercel or any server directly, use current origin
    if (location.pathname.startsWith('/api') || !location.hostname.includes('github.io')) {
      return location.origin;
    }
    return 'https://api.sumit-labs.me';
  }

  // Inject CSS for chat widget
  const style = document.createElement('style');
  style.textContent = `
    .ai-chat-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #0d1117;
      border: 2px solid var(--green, #00ff41);
      color: var(--green, #00ff41);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 6px 25px rgba(0, 255, 65, 0.35);
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ai-chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 30px rgba(0, 255, 65, 0.5);
      background: var(--green, #00ff41);
      color: #000;
    }
    .ai-chat-window {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: rgba(13, 17, 23, 0.96);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 255, 65, 0.3);
      border-radius: 14px;
      box-shadow: 0 12px 50px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: var(--font-mono, monospace);
    }
    .ai-chat-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    .ai-chat-header {
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.5);
      border-bottom: 1px solid rgba(0, 255, 65, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ai-chat-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--green, #00ff41);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ai-chat-header-actions {
      display: flex;
      gap: 6px;
    }
    .ai-chat-action-btn {
      background: none;
      border: none;
      color: #8b949e;
      cursor: pointer;
      font-size: 1rem;
      padding: 4px 6px;
      border-radius: 4px;
      transition: color 0.2s;
    }
    .ai-chat-action-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .ai-chat-body {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.82rem;
    }
    .ai-msg {
      max-width: 88%;
      padding: 10px 14px;
      border-radius: 10px;
      line-height: 1.45;
      word-break: break-word;
    }
    .ai-msg-bot {
      background: rgba(0, 255, 65, 0.08);
      border: 1px solid rgba(0, 255, 65, 0.25);
      color: #e6edf3;
      align-self: flex-start;
    }
    .ai-msg-user {
      background: rgba(0, 212, 255, 0.15);
      border: 1px solid rgba(0, 212, 255, 0.35);
      color: #fff;
      align-self: flex-end;
    }
    .ai-msg-error {
      background: rgba(255, 80, 80, 0.1);
      border: 1px solid rgba(255, 80, 80, 0.3);
      color: #ff9d9d;
      align-self: flex-start;
    }
    .ai-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 10px;
    }
    .ai-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(0, 255, 65, 0.2);
      color: var(--green, #00ff41);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.74rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ai-chip:hover {
      background: rgba(0, 255, 65, 0.15);
      border-color: var(--green, #00ff41);
      transform: translateY(-1px);
    }
    .ai-chat-footer {
      padding: 10px 14px;
      border-top: 1px solid rgba(0, 255, 65, 0.2);
      display: flex;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
    }
    .ai-chat-input {
      flex: 1;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 9px 12px;
      color: #fff;
      font-family: inherit;
      font-size: 0.82rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .ai-chat-input:focus { border-color: var(--green, #00ff41); }
    .ai-chat-input:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-chat-send {
      background: var(--green, #00ff41);
      color: #000;
      border: none;
      border-radius: 6px;
      padding: 0 14px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.95rem;
      transition: opacity 0.2s;
    }
    .ai-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  // Inject UI
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'ai-chat-toggle';
  toggleBtn.innerHTML = '🤖';
  toggleBtn.title = "Chat with Sumit's AI Assistant";

  const windowEl = document.createElement('div');
  windowEl.className = 'ai-chat-window';
  windowEl.innerHTML = `
    <div class="ai-chat-header">
      <div class="ai-chat-title">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green,#00ff41);box-shadow:0 0 8px var(--green,#00ff41);"></span>
        Sumit.AI Assistant
      </div>
      <div class="ai-chat-header-actions">
        <button class="ai-chat-action-btn" id="aiChatClear" title="Clear Chat">🗑️</button>
        <button class="ai-chat-action-btn" id="aiChatClose" title="Close">&times;</button>
      </div>
    </div>
    <div class="ai-chat-body" id="aiChatBody">
      <div class="ai-msg ai-msg-bot">
        👋 Hi! I'm Sumit's AI assistant. Ask me anything about his cybersecurity skills, projects, certifications, or internship availability!
      </div>
    </div>
    <div class="ai-chips">
      <button class="ai-chip" data-query="What are Sumit's top skills and tools?">⚡ Skills & Tools</button>
      <button class="ai-chip" data-query="Tell me about his key projects.">💻 Projects</button>
      <button class="ai-chip" data-query="Is Sumit available for internships?">🎯 Hire / Internships</button>
      <button class="ai-chip" data-query="What certifications does he have?">📜 Certifications</button>
    </div>
    <div class="ai-chat-footer">
      <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask a question..." maxlength="300">
      <button class="ai-chat-send" id="aiChatSend">→</button>
    </div>
  `;

  document.body.appendChild(toggleBtn);
  document.body.appendChild(windowEl);

  const closeBtn = document.getElementById('aiChatClose');
  const clearBtn = document.getElementById('aiChatClear');
  const chatBody = document.getElementById('aiChatBody');
  const chatInput = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSend');

  let isSending = false;

  toggleBtn.addEventListener('click', () => {
    windowEl.classList.toggle('open');
    if (windowEl.classList.contains('open')) chatInput.focus();
  });
  closeBtn.addEventListener('click', () => windowEl.classList.remove('open'));
  
  clearBtn.addEventListener('click', () => {
    chatBody.innerHTML = `
      <div class="ai-msg ai-msg-bot">
        👋 Chat cleared! How can I help you regarding Sumit's portfolio?
      </div>
    `;
  });

  // Suggestion chips
  windowEl.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (q) {
        chatInput.value = q;
        handleSend();
      }
    });
  });

  function setSendingState(sending) {
    isSending = sending;
    chatInput.disabled = sending;
    sendBtn.disabled = sending;
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  async function handleSend() {
    if (isSending) return;

    const text = chatInput.value.trim();
    if (!text) return;

    // Append user message
    appendMessage(text, 'user');
    chatInput.value = '';
    setSendingState(true);

    // Thinking indicator
    const thinkingEl = appendMessage('Analyzing query...', 'bot');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      const data = await res.json();
      thinkingEl.innerHTML = formatMarkdown(data.reply || "Sorry, I couldn't generate a response.");
    } catch (e) {
      thinkingEl.classList.remove('ai-msg-bot');
      thinkingEl.classList.add('ai-msg-error');
      if (e.name === 'AbortError') {
        thinkingEl.textContent = 'Request timed out. Please try again.';
      } else {
        thinkingEl.textContent = 'Unable to connect to AI server. Please verify backend connectivity.';
      }
    } finally {
      clearTimeout(timeoutId);
      setSendingState(false);
      chatInput.focus();
    }
  }

  function appendMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `ai-msg ai-msg-${type}`;
    if (type === 'user') {
      msg.textContent = text;
    } else {
      msg.innerHTML = formatMarkdown(text);
    }
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msg;
  }

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });
})();