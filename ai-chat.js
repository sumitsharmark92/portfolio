/* ============================================================
   AI RESUME CHATBOT CLIENT
   Floating chat widget grounded in Sumit's resume & bio.
   ============================================================ */
(function () {
  'use strict';

  // Inject CSS for chat widget
  const style = document.createElement('style');
  style.textContent = `
    .ai-chat-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--green);
      color: var(--green);
      font-size: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 255, 65, 0.25);
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ai-chat-toggle:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(0, 255, 65, 0.4);
      background: var(--green);
      color: #000;
    }
    .ai-chat-window {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 360px;
      height: 480px;
      background: rgba(10, 14, 20, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ai-chat-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    .ai-chat-header {
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.4);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ai-chat-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--green);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ai-chat-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
    }
    .ai-chat-close:hover { color: #fff; }
    .ai-chat-body {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 0.82rem;
    }
    .ai-msg {
      max-width: 85%;
      padding: 8px 12px;
      border-radius: 8px;
      line-height: 1.4;
    }
    .ai-msg-bot {
      background: rgba(0, 255, 65, 0.08);
      border: 1px solid rgba(0, 255, 65, 0.2);
      color: var(--text-primary);
      align-self: flex-start;
    }
    .ai-msg-user {
      background: rgba(0, 212, 255, 0.15);
      border: 1px solid rgba(0, 212, 255, 0.3);
      color: var(--text-primary);
      align-self: flex-end;
    }
    .ai-chat-footer {
      padding: 10px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
    }
    .ai-chat-input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      outline: none;
    }
    .ai-chat-input:focus { border-color: var(--green); }
    .ai-chat-send {
      background: var(--green);
      color: #000;
      border: none;
      border-radius: 6px;
      padding: 0 12px;
      font-weight: bold;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Inject UI
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'ai-chat-toggle';
  toggleBtn.innerHTML = '🤖';
  toggleBtn.title = 'Chat with Sumit\'s AI Assistant';

  const windowEl = document.createElement('div');
  windowEl.className = 'ai-chat-window';
  windowEl.innerHTML = `
    <div class="ai-chat-header">
      <div class="ai-chat-title">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);"></span>
        Sumit.AI (Resume Bot)
      </div>
      <button class="ai-chat-close">&times;</button>
    </div>
    <div class="ai-chat-body" id="aiChatBody">
      <div class="ai-msg ai-msg-bot">
        👋 Hi! I'm Sumit's AI assistant. Ask me anything about his skills, projects, experience, or education!
      </div>
    </div>
    <div class="ai-chat-footer">
      <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask a question..." maxlength="200">
      <button class="ai-chat-send" id="aiChatSend">→</button>
    </div>
  `;

  document.body.appendChild(toggleBtn);
  document.body.appendChild(windowEl);

  const closeBtn = windowEl.querySelector('.ai-chat-close');
  const chatBody = document.getElementById('aiChatBody');
  const chatInput = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSend');

  toggleBtn.addEventListener('click', () => windowEl.classList.toggle('open'));
  closeBtn.addEventListener('click', () => windowEl.classList.remove('open'));

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append User message
    appendMessage(text, 'user');
    chatInput.value = '';

    // Thinking state
    const thinkingEl = appendMessage('Thinking...', 'bot');

    try {
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const apiBase = isLocal ? '' : 'https://api.sumit-labs.me';
      const res = await fetch(`${apiBase}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      thinkingEl.textContent = data.reply || "Sorry, I couldn't process that.";
    } catch (e) {
      thinkingEl.textContent = "Error connecting to AI service.";
    }
  }

  function appendMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `ai-msg ai-msg-${type}`;
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msg;
  }

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });
})();
