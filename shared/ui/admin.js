/* ============================================================
   SUMIT.SH ADMIN PORTAL CLIENT LOGIC (admin.js)
   Full CRUD controller for dynamic website content & settings.
   ============================================================ */

(function () {
  'use strict';

  function getApiBase() {
    if (window.PORTFOLIO_API_URL) return window.PORTFOLIO_API_URL;
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocal) return '';
    if (location.pathname.startsWith('/api') || !location.hostname.includes('github.io')) {
      return location.origin;
    }
    return 'https://api.sumit-labs.me';
  }

  const API_BASE = getApiBase();
  let authToken = localStorage.getItem('sumit_admin_token') || '';
  let dbData = null;

  // DOM Elements
  const loginView = document.getElementById('loginView');
  const appView = document.getElementById('appView');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const toast = document.getElementById('toast');

  // Matrix canvas in admin
  const matrixCanvas = document.getElementById('matrix-rain');
  if (matrixCanvas) {
    const ctx = matrixCanvas.getContext('2d');
    let columns, drops;
    const chars = '01ABCDEF<>{}[]|;:./\\';
    const fontSize = 14;

    function initMatrix() {
      matrixCanvas.width = window.innerWidth;
      matrixCanvas.height = window.innerHeight;
      columns = Math.floor(matrixCanvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    }
    function drawMatrix() {
      ctx.fillStyle = 'rgba(8, 11, 16, 0.1)';
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.98) drops[i] = 0;
        drops[i]++;
      }
    }
    initMatrix();
    window.addEventListener('resize', initMatrix);
    setInterval(drawMatrix, 40);
  }

  function showToast(msg, isError = false) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // --- Auth Check & Init ---
  async function checkAuth() {
    if (!authToken) {
      showLogin();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/auth-check`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        showApp();
        loadAllData();
      } else {
        authToken = '';
        localStorage.removeItem('sumit_admin_token');
        showLogin();
      }
    } catch (e) {
      showLogin();
    }
  }

  function showLogin() {
    loginView.style.display = 'flex';
    appView.style.display = 'none';
  }

  function showApp() {
    loginView.style.display = 'none';
    appView.style.display = 'flex';
  }

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value.trim();
    if (!password) return;

    loginError.style.display = 'none';
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        authToken = data.token;
        localStorage.setItem('sumit_admin_token', authToken);
        showToast('Access Granted. Welcome Sumit!');
        showApp();
        loadAllData();
      } else {
        loginError.textContent = data.error || 'Invalid password';
        loginError.style.display = 'block';
      }
    } catch (e) {
      loginError.textContent = 'Server connection error';
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => {
    fetch(`${API_BASE}/api/admin/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).catch(() => {});
    authToken = '';
    localStorage.removeItem('sumit_admin_token');
    showToast('Logged out');
    showLogin();
  });

  // --- Tab Navigation ---
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      navItems.forEach(n => n.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const targetPanel = document.getElementById(`tab-${tab}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // --- Load Full Database ---
  async function loadAllData() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/data`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to load data');
      dbData = await res.json();
      renderOverview();
      renderProfileForm();
      renderProjects();
      renderSkills();
      renderTimeline();
      renderGuestbook();
      renderPolls();
      renderQA();
      renderAIConfig();
      renderSettings();
    } catch (e) {
      showToast('Error loading data: ' + e.message, true);
    }
  }

  // Generic Save Helper
  async function updateSection(section, payload) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ section, data: payload })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(`Saved ${section} successfully!`);
        dbData[section] = payload;
        return true;
      } else {
        showToast(resData.error || 'Failed to update', true);
        return false;
      }
    } catch (e) {
      showToast('Network error while updating: ' + e.message, true);
      return false;
    }
  }

  // --- 1. OVERVIEW ---
  function renderOverview() {
    const visits = dbData.telemetry?.length || 0;
    const gbCount = dbData.guestbook?.length || 0;
    const pollVotes = (dbData.polls?.[0]?.options || []).reduce((acc, o) => acc + (o.votes || 0), 0);
    const qaCount = (dbData.qa || []).length;

    document.getElementById('statTotalVisits').textContent = visits;
    document.getElementById('statGuestbookCount').textContent = gbCount;
    document.getElementById('statPollVotes').textContent = pollVotes;
    document.getElementById('statQACount').textContent = qaCount;

    // Telemetry log
    const list = document.getElementById('telemetryList');
    if (list) {
      const items = (dbData.telemetry || []).slice(0, 15);
      if (items.length === 0) {
        list.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;">No recent visits logged yet.</div>`;
      } else {
        list.innerHTML = items.map(t => `
          <div class="item-card" style="padding:8px 12px;margin-bottom:6px;">
            <div class="item-info">
              <span style="color:var(--cyan);font-weight:bold;">${escapeHtml(t.path || '/')}</span>
              <span style="color:var(--text-muted);font-size:0.75rem;margin-left:8px;">${new Date(t.timestamp).toLocaleTimeString()}</span>
              <div style="font-size:0.72rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(t.userAgent || 'Unknown')} (${escapeHtml(t.ip || 'Local')})</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // --- 2. PROFILE FORM ---
  function renderProfileForm() {
    const p = dbData.profile || {};
    document.getElementById('profName').value = p.name || '';
    document.getElementById('profTitle').value = p.title || '';
    document.getElementById('profStatus').value = p.statusBadge || '';
    document.getElementById('profHeroDesc').value = p.heroDesc || '';
    document.getElementById('profBio1').value = p.bioParagraphs?.[0] || '';
    document.getElementById('profBio2').value = p.bioParagraphs?.[1] || '';
    document.getElementById('profBio3').value = p.bioParagraphs?.[2] || '';
    document.getElementById('profEmail').value = p.contact?.email || '';
    document.getElementById('profPhone').value = p.contact?.phone || '';
    document.getElementById('profLocation').value = p.contact?.location || '';
    document.getElementById('profGithub').value = p.contact?.github || '';
    document.getElementById('profLinkedin').value = p.contact?.linkedin || '';
    document.getElementById('profResume').value = p.contact?.resumeUrl || '';
  }

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {
      name: document.getElementById('profName').value.trim(),
      title: document.getElementById('profTitle').value.trim(),
      statusBadge: document.getElementById('profStatus').value.trim(),
      heroDesc: document.getElementById('profHeroDesc').value.trim(),
      bioParagraphs: [
        document.getElementById('profBio1').value.trim(),
        document.getElementById('profBio2').value.trim(),
        document.getElementById('profBio3').value.trim()
      ].filter(Boolean),
      stats: dbData.profile?.stats || [],
      contact: {
        email: document.getElementById('profEmail').value.trim(),
        phone: document.getElementById('profPhone').value.trim(),
        location: document.getElementById('profLocation').value.trim(),
        github: document.getElementById('profGithub').value.trim(),
        linkedin: document.getElementById('profLinkedin').value.trim(),
        resumeUrl: document.getElementById('profResume').value.trim()
      }
    };
    await updateSection('profile', updated);
  });

  // --- 3. PROJECTS ---
  function renderProjects() {
    const container = document.getElementById('projectsList');
    const projects = dbData.projects || [];
    if (projects.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);">No projects found. Add one below!</div>`;
      return;
    }
    container.innerHTML = projects.map((p, idx) => `
      <div class="item-card">
        <div class="item-info">
          <div class="item-title">
            <span style="color:var(--green);font-size:0.8rem;margin-right:6px;">[${p.id || 'proj_' + (idx+1)}]</span>
            ${escapeHtml(p.title)}
            ${p.featured ? '<span class="tag-badge" style="color:var(--green);border-color:var(--green);">★ Featured</span>' : ''}
          </div>
          <div class="item-subtitle">${escapeHtml(p.desc)}</div>
          <div class="item-tags">
            ${(p.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')}
            ${p.link ? `<span class="tag-badge" style="color:var(--cyan);">🔗 Live: ${escapeHtml(p.link)}</span>` : ''}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost btn-sm edit-proj-btn" data-idx="${idx}">✏️ Edit</button>
          <button class="btn btn-danger btn-sm del-proj-btn" data-idx="${idx}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.del-proj-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (confirm(`Delete project "${projects[idx].title}"?`)) {
          projects.splice(idx, 1);
          await updateSection('projects', projects);
          renderProjects();
        }
      });
    });

    container.querySelectorAll('.edit-proj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        openProjectModal(projects[idx], idx);
      });
    });
  }

  document.getElementById('addProjectBtn').addEventListener('click', () => {
    openProjectModal(null, -1);
  });

  function openProjectModal(project, idx) {
    const isEdit = idx >= 0;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 style="color:var(--green);">${isEdit ? 'Edit Project' : 'Add New Project'}</h3>
          <button class="close-modal">&times;</button>
        </div>
        <form id="projectModalForm">
          <div class="form-group">
            <label class="form-label">Project ID</label>
            <input class="form-input" id="mProjId" value="${project?.id || 'proj_' + ((dbData.projects?.length || 0) + 1)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Project Title</label>
            <input class="form-input" id="mProjTitle" value="${project?.title || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="mProjDesc" required>${project?.desc || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Tags (comma-separated, e.g. #python, #nmap)</label>
            <input class="form-input" id="mProjTags" value="${(project?.tags || []).join(', ')}">
          </div>
          <div class="form-group">
            <label class="form-label">Live Link / Path (e.g. jam.html or https://...)</label>
            <input class="form-input" id="mProjLink" value="${project?.link || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">GitHub Repository URL</label>
            <input class="form-input" id="mProjGithub" value="${project?.github || ''}">
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="mProjFeatured" ${project?.featured !== false ? 'checked' : ''}>
            <label for="mProjFeatured" class="form-label" style="margin-bottom:0;cursor:pointer;">Featured on Homepage</label>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
            <button type="button" class="btn btn-ghost close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.remove()));

    modal.querySelector('#projectModalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const tagsStr = modal.querySelector('#mProjTags').value;
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
      const newProj = {
        id: modal.querySelector('#mProjId').value.trim(),
        title: modal.querySelector('#mProjTitle').value.trim(),
        desc: modal.querySelector('#mProjDesc').value.trim(),
        tags,
        link: modal.querySelector('#mProjLink').value.trim(),
        github: modal.querySelector('#mProjGithub').value.trim(),
        featured: modal.querySelector('#mProjFeatured').checked
      };

      const projects = dbData.projects || [];
      if (isEdit) {
        projects[idx] = newProj;
      } else {
        projects.push(newProj);
      }

      const success = await updateSection('projects', projects);
      if (success) {
        modal.remove();
        renderProjects();
      }
    });
  }

  // --- 4. SKILLS ---
  function renderSkills() {
    const container = document.getElementById('skillsCategories');
    const skills = dbData.skills || [];
    container.innerHTML = skills.map((cat, catIdx) => `
      <div class="card" style="margin-bottom:14px;padding:16px;">
        <div class="card-header" style="margin-bottom:10px;padding-bottom:8px;">
          <strong style="color:var(--cyan);font-size:0.95rem;">${escapeHtml(cat.category)}</strong>
          <button class="btn btn-danger btn-sm del-skill-cat" data-cat="${catIdx}">Delete Category</button>
        </div>
        <div class="item-tags" style="margin-bottom:12px;">
          ${(cat.tags || []).map((t, tagIdx) => `
            <span class="tag-badge" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;">
              ${escapeHtml(t)}
              <span class="del-tag-btn" data-cat="${catIdx}" data-tag="${tagIdx}" style="cursor:pointer;color:var(--red);font-weight:bold;">&times;</span>
            </span>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <input class="form-input add-tag-input" data-cat="${catIdx}" placeholder="Add skill tag (e.g. Wireshark)" style="padding:6px 10px;font-size:0.8rem;">
          <button class="btn btn-outline btn-sm add-tag-btn" data-cat="${catIdx}">+ Add</button>
        </div>
      </div>
    `).join('');

    // Add tag handler
    container.querySelectorAll('.add-tag-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const catIdx = parseInt(btn.getAttribute('data-cat'));
        const input = container.querySelector(`.add-tag-input[data-cat="${catIdx}"]`);
        const tag = input.value.trim();
        if (!tag) return;
        skills[catIdx].tags.push(tag);
        await updateSection('skills', skills);
        renderSkills();
      });
    });

    // Delete tag handler
    container.querySelectorAll('.del-tag-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const catIdx = parseInt(btn.getAttribute('data-cat'));
        const tagIdx = parseInt(btn.getAttribute('data-tag'));
        skills[catIdx].tags.splice(tagIdx, 1);
        await updateSection('skills', skills);
        renderSkills();
      });
    });

    // Delete category
    container.querySelectorAll('.del-skill-cat').forEach(btn => {
      btn.addEventListener('click', async () => {
        const catIdx = parseInt(btn.getAttribute('data-cat'));
        if (confirm(`Delete skill category "${skills[catIdx].category}"?`)) {
          skills.splice(catIdx, 1);
          await updateSection('skills', skills);
          renderSkills();
        }
      });
    });
  }

  document.getElementById('addSkillCategoryBtn').addEventListener('click', async () => {
    const name = prompt('Enter new skill category name (e.g. "Databases"):');
    if (!name || !name.trim()) return;
    const skills = dbData.skills || [];
    skills.push({ category: name.trim(), tags: [] });
    await updateSection('skills', skills);
    renderSkills();
  });

  // --- 5. TIMELINE & CERTS ---
  function renderTimeline() {
    const expContainer = document.getElementById('experienceList');
    const certContainer = document.getElementById('certsList');
    const exp = dbData.experience || [];
    const certs = dbData.certifications || [];

    expContainer.innerHTML = exp.map((e, idx) => `
      <div class="item-card">
        <div class="item-info">
          <div class="item-title">${escapeHtml(e.role)} <span style="color:var(--green);">@ ${escapeHtml(e.company)}</span></div>
          <div style="font-size:0.75rem;color:var(--cyan);margin-bottom:4px;">${escapeHtml(e.period)}</div>
          <ul style="padding-left:18px;font-size:0.8rem;color:var(--text-secondary);">
            ${(e.details || []).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
        <div class="item-actions">
          <button class="btn btn-danger btn-sm del-exp-btn" data-idx="${idx}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    expContainer.querySelectorAll('.del-exp-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        exp.splice(idx, 1);
        await updateSection('experience', exp);
        renderTimeline();
      });
    });

    certContainer.innerHTML = certs.map((c, idx) => `
      <div class="item-card" style="padding:10px 14px;">
        <div class="item-info">
          <span style="color:#fff;font-size:0.85rem;">📜 ${escapeHtml(c)}</span>
        </div>
        <button class="btn btn-danger btn-sm del-cert-btn" data-idx="${idx}">🗑️</button>
      </div>
    `).join('');

    certContainer.querySelectorAll('.del-cert-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        certs.splice(idx, 1);
        await updateSection('certifications', certs);
        renderTimeline();
      });
    });
  }

  document.getElementById('addExpBtn').addEventListener('click', async () => {
    const role = prompt('Role / Title (e.g. SOC Analyst):');
    if (!role) return;
    const company = prompt('Company / Organization:');
    const period = prompt('Period (e.g. 2024 — Present):');
    const detailsStr = prompt('Bullet points (separated by semicolon ;):');
    const details = (detailsStr || '').split(';').map(d => d.trim()).filter(Boolean);

    const exp = dbData.experience || [];
    exp.unshift({ id: 'exp-' + Date.now(), role, company, period, details });
    await updateSection('experience', exp);
    renderTimeline();
  });

  document.getElementById('addCertBtn').addEventListener('click', async () => {
    const cert = prompt('Enter certification title & year:');
    if (!cert || !cert.trim()) return;
    const certs = dbData.certifications || [];
    certs.unshift(cert.trim());
    await updateSection('certifications', certs);
    renderTimeline();
  });

  // --- 6. GUESTBOOK ---
  function renderGuestbook() {
    const container = document.getElementById('adminGuestbookList');
    const entries = dbData.guestbook || [];
    if (entries.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);">No guestbook entries found.</div>`;
      return;
    }
    container.innerHTML = entries.map((entry) => `
      <div class="item-card">
        <div class="item-info">
          <div class="item-title">
            ${escapeHtml(entry.name)}
            ${entry.link ? `<a href="${escapeHtml(entry.link)}" target="_blank" style="color:var(--cyan);font-size:0.75rem;margin-left:6px;">[link]</a>` : ''}
            ${entry.pinned ? '<span class="tag-badge" style="color:var(--yellow);border-color:var(--yellow);">📌 Pinned</span>' : ''}
          </div>
          <div class="item-subtitle" style="color:#fff;margin:4px 0;">"${escapeHtml(entry.message)}"</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${new Date(entry.createdAt).toLocaleString()}</div>
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost btn-sm pin-gb-btn" data-id="${entry.id}">${entry.pinned ? 'Unpin' : '📌 Pin'}</button>
          <button class="btn btn-danger btn-sm del-gb-btn" data-id="${entry.id}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.pin-gb-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await fetch(`${API_BASE}/api/guestbook/${id}/pin`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          showToast('Guestbook entry updated');
          loadAllData();
        }
      });
    });

    container.querySelectorAll('.del-gb-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Permanently delete this guestbook entry?')) {
          const res = await fetch(`${API_BASE}/api/guestbook/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (res.ok) {
            showToast('Entry deleted');
            loadAllData();
          }
        }
      });
    });
  }

  // --- 7. POLLS ---
  function renderPolls() {
    const poll = dbData.polls?.[0] || {};
    document.getElementById('pollQuestionInput').value = poll.question || '';
    const optsContainer = document.getElementById('pollOptionsList');
    optsContainer.innerHTML = (poll.options || []).map((opt, idx) => `
      <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <input class="form-input poll-opt-text" data-idx="${idx}" value="${escapeHtml(opt.text)}" placeholder="Option ${idx+1}">
        <span style="color:var(--cyan);font-size:0.8rem;min-width:60px;">${opt.votes || 0} votes</span>
      </div>
    `).join('');
  }

  document.getElementById('savePollBtn').addEventListener('click', async () => {
    const question = document.getElementById('pollQuestionInput').value.trim();
    const optInputs = document.querySelectorAll('.poll-opt-text');
    const options = Array.from(optInputs).map(inp => inp.value.trim()).filter(Boolean);
    if (!question || options.length < 2) {
      return showToast('Question and at least 2 options required', true);
    }
    const poll = {
      id: 'poll-1',
      question,
      options: options.map((text, idx) => ({
        text,
        votes: dbData.polls?.[0]?.options?.[idx]?.votes || 0
      }))
    };
    await updateSection('polls', [poll]);
  });

  document.getElementById('resetPollVotesBtn').addEventListener('click', async () => {
    if (confirm('Reset all vote counts on the live poll to 0?')) {
      const poll = dbData.polls?.[0];
      if (poll) {
        poll.options.forEach(o => o.votes = 0);
        await updateSection('polls', [poll]);
        renderPolls();
      }
    }
  });

  // --- 8. Q&A ---
  function renderQA() {
    const container = document.getElementById('adminQAList');
    const list = dbData.qa || [];
    if (list.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted);">No visitor questions yet.</div>`;
      return;
    }
    container.innerHTML = list.map((item) => `
      <div class="item-card">
        <div class="item-info">
          <div class="item-title" style="color:var(--cyan);">Q: ${escapeHtml(item.question)}</div>
          <div class="item-subtitle" style="margin:4px 0;">
            <strong style="color:var(--green);">Answer:</strong> ${escapeHtml(item.answer || 'Pending response...')}
          </div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${new Date(item.createdAt).toLocaleString()}</div>
        </div>
        <div class="item-actions">
          <button class="btn btn-primary btn-sm ans-qa-btn" data-id="${item.id}">💬 Answer</button>
          <button class="btn btn-danger btn-sm del-qa-btn" data-id="${item.id}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.ans-qa-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const item = list.find(q => q.id === id);
        const ans = prompt(`Answer question: "${item.question}"`, item.answer || '');
        if (ans === null) return;
        const res = await fetch(`${API_BASE}/api/qa/${id}/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ answer: ans })
        });
        if (res.ok) {
          showToast('Answer published to live site!');
          loadAllData();
        }
      });
    });

    container.querySelectorAll('.del-qa-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this question?')) {
          const res = await fetch(`${API_BASE}/api/qa/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (res.ok) {
            showToast('Question deleted');
            loadAllData();
          }
        }
      });
    });
  }

  // --- 9. AI CONFIG ---
  function renderAIConfig() {
    const cfg = dbData.aiConfig || {};
    document.getElementById('aiProviderSelect').value = cfg.provider || 'gemini';
    document.getElementById('aiModelInput').value = cfg.model || 'gemini-1.5-flash';
    document.getElementById('aiApiKeyInput').value = cfg.apiKey || '';
    document.getElementById('aiSystemPrompt').value = cfg.systemPrompt || '';
    document.getElementById('aiWelcomeMsg').value = cfg.welcomeMessage || '';
  }

  document.getElementById('aiConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {
      provider: document.getElementById('aiProviderSelect').value,
      model: document.getElementById('aiModelInput').value.trim(),
      apiKey: document.getElementById('aiApiKeyInput').value.trim(),
      systemPrompt: document.getElementById('aiSystemPrompt').value.trim(),
      welcomeMessage: document.getElementById('aiWelcomeMsg').value.trim(),
      customKnowledge: dbData.aiConfig?.customKnowledge || []
    };
    await updateSection('aiConfig', updated);
  });

  // Live AI Test Playground in Admin
  document.getElementById('testAISendBtn').addEventListener('click', async () => {
    const input = document.getElementById('testAIInput');
    const replyBox = document.getElementById('testAIReply');
    const msg = input.value.trim();
    if (!msg) return;

    replyBox.textContent = 'Generating response via AI Engine...';
    try {
      const res = await fetch(`${API_BASE}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      replyBox.textContent = data.reply || 'No response generated.';
    } catch (e) {
      replyBox.textContent = 'Error calling AI: ' + e.message;
    }
  });

  // --- 10. SETTINGS & SECURITY ---
  function renderSettings() {
    const s = dbData.settings || {};
    document.getElementById('announcementToggle').checked = !!s.announcement?.enabled;
    document.getElementById('announcementText').value = s.announcement?.text || '';
    document.getElementById('announcementLink').value = s.announcement?.link || '';
    document.getElementById('terminalMotdInput').value = s.terminalMotd || '';
    document.getElementById('siteTitleInput').value = s.siteTitle || '';
    document.getElementById('metaDescInput').value = s.metaDescription || '';
  }

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {
      announcement: {
        enabled: document.getElementById('announcementToggle').checked,
        text: document.getElementById('announcementText').value.trim(),
        link: document.getElementById('announcementLink').value.trim()
      },
      terminalMotd: document.getElementById('terminalMotdInput').value.trim(),
      siteTitle: document.getElementById('siteTitleInput').value.trim(),
      metaDescription: document.getElementById('metaDescInput').value.trim(),
      maintenanceMode: false
    };
    await updateSection('settings', updated);
  });

  // Change Admin Password
  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (newPassword !== confirmPassword) {
      return showToast('New passwords do not match', true);
    }
    if (newPassword.length < 6) {
      return showToast('Password must be at least 6 characters', true);
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Password changed! Please log in again.');
        authToken = '';
        localStorage.removeItem('sumit_admin_token');
        showLogin();
      } else {
        showToast(data.error || 'Failed to change password', true);
      }
    } catch (e) {
      showToast('Error: ' + e.message, true);
    }
  });

  // Backup Download & Restore
  document.getElementById('backupDownloadBtn').addEventListener('click', () => {
    const jsonStr = JSON.stringify(dbData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sumit-portfolio-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Database backup downloaded!');
  });

  document.getElementById('restoreUploadBtn').addEventListener('click', () => {
    document.getElementById('restoreFileInput').click();
  });

  document.getElementById('restoreFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (confirm('Restore this backup? Current data will be replaced.')) {
        const res = await fetch(`${API_BASE}/api/admin/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ data: parsed })
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          showToast('Database restored successfully!');
          loadAllData();
        } else {
          showToast('Restore failed: ' + (resData.error || 'Unknown error'), true);
        }
      }
    } catch (err) {
      showToast('Invalid JSON file', true);
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Run on startup
  checkAuth();
})();
