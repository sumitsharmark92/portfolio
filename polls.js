/* ============================================================
   POLLS & Q&A CLIENT
   Live polling via HTTP/WS + Q&A submissions
   ============================================================ */
(function () {
  'use strict';

  const API_POLLS = `${location.origin}/api/polls`;
  const API_QA = `${location.origin}/api/qa`;

  const pollContainer = document.getElementById('pollContainer');
  const qaForm = document.getElementById('qaForm');
  const qaQuestion = document.getElementById('qaQuestion');
  const qaStatus = document.getElementById('qaStatus');
  const qaAnswered = document.getElementById('qaAnswered');

  let currentPoll = null;
  let userVotedOption = localStorage.getItem('voted_poll_option');

  async function fetchPoll() {
    try {
      const res = await fetch(API_POLLS);
      if (!res.ok) throw new Error('Poll not found');
      currentPoll = await res.json();
      renderPoll();
    } catch (err) {
      if (pollContainer) {
        pollContainer.innerHTML = `<div class="gb-empty"><p>No active poll right now.</p></div>`;
      }
    }
  }

  function renderPoll() {
    if (!pollContainer || !currentPoll) return;

    const totalVotes = currentPoll.options.reduce((sum, opt) => sum + opt.votes, 0);

    const optionsHtml = currentPoll.options.map((opt, idx) => {
      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      const isSelected = userVotedOption == idx;

      return `
        <div class="poll-option ${isSelected ? 'selected' : ''}" data-idx="${idx}">
          <div class="poll-option-fill" style="width: ${pct}%;"></div>
          <div class="poll-option-label">
            <span>${escapeHtml(opt.text)}</span>
            <span class="poll-pct">${pct}% (${opt.votes})</span>
          </div>
        </div>
      `;
    }).join('');

    pollContainer.innerHTML = `
      <div class="poll-card reveal">
        <div class="poll-badge">LIVE POLL</div>
        <h2 class="poll-question">${escapeHtml(currentPoll.question)}</h2>
        <div class="poll-options">${optionsHtml}</div>
        <div class="poll-footer">
          <span>Total votes: <strong>${totalVotes}</strong></span>
          ${userVotedOption !== null ? '<span style="color:var(--green);">✓ You voted</span>' : '<span>Click an option to vote</span>'}
        </div>
      </div>
    `;

    // Add click listeners to options
    pollContainer.querySelectorAll('.poll-option').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const idx = parseInt(optEl.getAttribute('data-idx'), 10);
        vote(idx);
      });
    });
  }

  async function vote(optionIdx) {
    try {
      const res = await fetch(`${API_POLLS}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIdx })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vote failed');

      userVotedOption = optionIdx;
      localStorage.setItem('voted_poll_option', optionIdx);
      currentPoll = data;
      renderPoll();
    } catch (err) {
      alert(err.message);
    }
  }

  // Q&A
  async function fetchQA() {
    try {
      const res = await fetch(API_QA);
      const data = await res.json();
      renderQA(data);
    } catch (err) {
      // ignore
    }
  }

  function renderQA(items) {
    if (!qaAnswered) return;

    if (!items || items.length === 0) {
      qaAnswered.innerHTML = `<div class="gb-empty" style="margin-top:1.5rem;"><p>No questions answered yet. Be the first to ask!</p></div>`;
      return;
    }

    qaAnswered.innerHTML = items.map(item => `
      <div class="qa-card reveal">
        <div class="qa-q">
          <span class="qa-q-prefix">Q:</span>
          <span>${escapeHtml(item.question)}</span>
        </div>
        <div class="qa-a">
          <span class="qa-a-prefix">Sumit:</span>
          <span>${escapeHtml(item.answer)}</span>
        </div>
      </div>
    `).join('');
  }

  if (qaForm) {
    qaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = qaQuestion.value.trim();
      if (!q) return;

      try {
        const res = await fetch(API_QA, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q })
        });
        if (!res.ok) throw new Error('Submission failed');

        qaQuestion.value = '';
        if (qaStatus) {
          qaStatus.textContent = 'Question submitted! Sumit will review it soon.';
          qaStatus.className = 'gb-status gb-status-success';
          setTimeout(() => { qaStatus.textContent = ''; }, 5000);
        }
      } catch (err) {
        if (qaStatus) {
          qaStatus.textContent = 'Failed to submit question.';
          qaStatus.className = 'gb-status gb-status-error';
        }
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  fetchPoll();
  fetchQA();
  setInterval(fetchPoll, 5000); // Poll every 5s for updates
})();
