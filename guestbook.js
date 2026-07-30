/* ============================================================
   GUESTBOOK CLIENT
   Fetch entries, submit new entries, live updates.
   ============================================================ */
(function () {
  'use strict';

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const API_BASE = isLocal ? location.origin : 'https://api.sumit-labs.me';
  const API = `${API_BASE}/api/guestbook`;

  const form = document.getElementById('gbForm');
  const entriesEl = document.getElementById('gbEntries');
  const countEl = document.getElementById('gbCount');
  const statusEl = document.getElementById('gbStatus');
  const charCountEl = document.getElementById('gbCharCount');
  const messageInput = document.getElementById('gbMessage');
  const submitBtn = document.getElementById('gbSubmitBtn');

  let cooldown = false;

  // Character counter
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      charCountEl.textContent = messageInput.value.length;
    });
  }

  // Load entries
  async function loadEntries() {
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
      entriesEl.innerHTML = `<div class="gb-empty"><p>Failed to load messages.</p></div>`;
    }
  }

  function renderEntry(entry) {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    const nameHtml = entry.link
      ? `<a href="${escapeHtml(entry.link)}" target="_blank" rel="noopener noreferrer" class="gb-entry-name">${escapeHtml(entry.name)}</a>`
      : `<span class="gb-entry-name">${escapeHtml(entry.name)}</span>`;

    return `
      <div class="gb-entry">
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

  // Submit
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
      setTimeout(() => { cooldown = false; }, 30000); // 30s cooldown

      loadEntries();
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'sign guestbook →';
    }
  });

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `gb-status gb-status-${type}`;
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'gb-status'; }, 5000);
  }

  // Init
  loadEntries();
})();
