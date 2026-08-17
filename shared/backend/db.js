/* ============================================================
   SUMIT-LABS DATABASE ENGINE (db.js)
   Persistent, atomic, file-backed & serverless storage engine.
   Supports full CRUD for Profile, Projects, Skills, Timeline,
   Certifications, Guestbook, Polls, Q&A, AI Config & Admin Auth.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
}

function hashPassword(password, salt = 'sumit_sec_salt_2026') {
  return crypto.createHash('sha256').update(password + ':' + salt).digest('hex');
}

// Initial Default Schema & Comprehensive Dataset
const defaultData = {
  profile: {
    name: "Sumit Sharma",
    title: "Cybersecurity Engineer & Systems Developer",
    statusBadge: "status: available for internships",
    heroDesc: "B.Tech Cybersecurity student · SOC operations, penetration testing, and cloud security. Currently securing infrastructure for 100+ users at Govardhan Institute for Vedic Education.",
    bioParagraphs: [
      "I'm a B.Tech Cybersecurity student at Sanskriti University, Mathura. My focus is on SOC operations, penetration testing, and cloud security — specifically within Azure environments.",
      "I'm currently managing and securing infrastructure for 100+ users at Govardhan Institute for Vedic Education, applying real-world security practices including Active Directory management, network monitoring, and incident response protocols.",
      "I build security tools, automate reconnaissance workflows, and continuously sharpen my skills through CTFs on TryHackMe, Hack The Box, and PortSwigger labs. I believe in learning by breaking things — responsibly."
    ],
    stats: [
      { number: "100+", label: "Users Secured" },
      { number: "5+", label: "Certifications" },
      { number: "5+", label: "Projects Built" },
      { number: "3+", label: "Hackathons" }
    ],
    contact: {
      email: "sumitsharmark92@gmail.com",
      phone: "+91 90270 51135",
      location: "Vrindavan, UP · India",
      github: "https://github.com/sumitsharma",
      linkedin: "https://linkedin.com/in/sumitsharma",
      resumeUrl: "/resume.pdf"
    }
  },
  projects: [
    {
      id: "proj_01",
      title: "Red Team Agentic AI",
      desc: "Automation workflow chaining reconnaissance, port scanning, vulnerability enumeration, and report generation via LLM-assisted orchestration.",
      tags: ["#python", "#llm", "#nmap", "#metasploit"],
      link: "",
      github: "https://github.com/sumitsharma",
      featured: true
    },
    {
      id: "proj_02",
      title: "Cyber-Ops Interactive Portfolio",
      desc: "Cybersecurity portfolio with interactive threat visualization, terminal simulation, and recruiter-accessible project demos.",
      tags: ["#three.js", "#javascript", "#github_pages"],
      link: "https://sumit-labs.me",
      github: "https://github.com/sumitsharmark92/portfolio",
      featured: true
    },
    {
      id: "proj_03",
      title: "Azure Cloud Security Hardening",
      desc: "Secure Azure storage configurations using RBAC, SAS token controls, encryption, and restricted network access aligned with Microsoft security practices.",
      tags: ["#azure", "#rbac", "#sas", "#encryption"],
      link: "",
      github: "https://github.com/sumitsharma",
      featured: true
    },
    {
      id: "proj_04",
      title: "SYNCVERSE — Real-Time Authoritative Sync Engine",
      desc: "Distributed real-time engine powering sub-50ms synchronized audio jams, synchronized video watch parties, multiplayer games, and shared whiteboards.",
      tags: ["#websockets", "#node.js", "#real-time", "#distributed"],
      link: "jam.html",
      github: "https://github.com/sumitsharma",
      featured: true
    }
  ],
  skills: [
    {
      category: "Security & Networking",
      tags: ["SOC Operations", "Vulnerability Assessment", "Network Security", "Access Control", "Incident Response", "Active Directory"]
    },
    {
      category: "Tools",
      tags: ["Wireshark", "Nmap", "Nessus", "Metasploit", "Burp Suite", "Kali Linux"]
    },
    {
      category: "Cloud & Platforms",
      tags: ["Microsoft Azure", "RBAC", "Blob Storage Security", "Power Apps", "Docker", "Linux"]
    },
    {
      category: "Programming",
      tags: ["Python", "Bash", "JavaScript", "Node.js", "C++", "Go", "SQL", "HTML/CSS"]
    },
    {
      category: "Concepts",
      tags: ["OWASP Top 10", "CVE/CVSS Analysis", "Endpoint Security", "LAN/WAN Admin", "Threat Modeling", "SIEM"]
    }
  ],
  experience: [
    {
      id: "exp-1",
      period: "2024 — Present",
      role: "IT Infrastructure & Security Admin",
      company: "Govardhan Institute for Vedic Education",
      details: [
        "Managing and securing IT infrastructure for 100+ users across the institute",
        "Implementing Active Directory policies, access controls, and endpoint security",
        "Monitoring network traffic, responding to incidents, and maintaining firewall rules",
        "Configuring Azure cloud services including Blob Storage security and RBAC"
      ]
    },
    {
      id: "exp-2",
      period: "2022 — 2024",
      role: "Cybersecurity Self-Study & Labs",
      company: "TryHackMe · Hack The Box · PortSwigger",
      details: [
        "Completed penetration testing career paths on Cybrary and TryHackMe",
        "Practiced web application security testing through PortSwigger labs",
        "Built Python and Bash automation scripts for reconnaissance and scanning",
        "Participated in CTF competitions and hackathons"
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      title: "B.Tech, Computer Science & Engineering",
      subtitle: "Sanskriti University, Mathura · Expected 2026"
    },
    {
      id: "edu-2",
      title: "CBSE Class XII",
      subtitle: "78%"
    },
    {
      id: "edu-3",
      title: "ICSE Class X",
      subtitle: "80%"
    }
  ],
  certifications: [
    "EC-Council CodeRed — Dark Web, Anonymity & Cryptocurrency (2026)",
    "Cybrary — Penetration Tester Career Path (2022)",
    "Microsoft — Secure Storage: Azure Files & Blob Storage (2024)",
    "Microsoft Applied Skills — Canvas Apps with Power Apps (2024)",
    "Cybrary — Enterprise Security: Creating a World-Class SOC (2022)"
  ],
  hackathons: [
    "Kill Switch Hackathon 2026",
    "SPARK Hack 2026",
    "TryHackMe",
    "PortSwigger",
    "Hack The Box"
  ],
  guestbook: [
    { id: '1', name: 'Alice (Security Lead)', message: 'Awesome portfolio Sumit! Love the terminal theme and real-time sync server.', createdAt: new Date(Date.now() - 86400000).toISOString(), link: '', pinned: true },
    { id: '2', name: 'Devon', message: 'The jam.sync room is insanely fast. Tested latency across two browsers, <50ms!', createdAt: new Date().toISOString(), link: 'https://github.com', pinned: false }
  ],
  polls: [
    {
      id: 'poll-1',
      question: 'Which real-time feature is most useful to you?',
      options: [
        { text: 'Synced Video & Watch Parties', votes: 14 },
        { text: 'Collaborative Whiteboard', votes: 8 },
        { text: 'Multiplayer Audio & Music Jams', votes: 22 },
        { text: 'Interactive Code Playground', votes: 11 }
      ]
    }
  ],
  qa: [
    { id: 'q1', question: 'What inspired you to get into cybersecurity?', answer: 'Curiosity about how systems break and a passion for defending critical infrastructure!', createdAt: new Date().toISOString(), answered: true },
    { id: 'q2', question: 'Are you available for summer 2026 internships?', answer: 'Yes! Actively interviewing for SOC, Pentesting, and Security Engineering roles.', createdAt: new Date().toISOString(), answered: true }
  ],
  settings: {
    announcement: {
      enabled: false,
      text: "🚀 New real-time multi-user features launched! Try the jam room, live poll, and interactive whiteboard.",
      link: "jam.html"
    },
    terminalMotd: "SOC analyst | pentester | cloud defender | systems engineer",
    siteTitle: "Sumit Sharma — Cybersecurity Portfolio | sumit.sh",
    metaDescription: "B.Tech Cybersecurity student specializing in SOC operations, penetration testing, and cloud security.",
    maintenanceMode: false
  },
  aiConfig: {
    provider: "gemini",
    model: "gemini-1.5-flash",
    apiKey: "",
    welcomeMessage: "👋 Hi! I'm Sumit's AI assistant. Ask me anything about his skills, projects, certifications, cybersecurity experience, or how to hire him!",
    systemPrompt: "You are the official AI Assistant for Sumit Sharma's Cybersecurity & Systems Portfolio (sumit.sh / sumit-labs.me). You represent Sumit Sharma — a B.Tech Cybersecurity student at Sanskriti University, security researcher, SOC analyst, and full-stack systems engineer. Be concise, intelligent, professional, and friendly.",
    customKnowledge: [
      { q: "availability", a: "Sumit is actively open and interviewing for Cybersecurity (SOC Analyst, Pentester, Security Engineer) & Software Engineering internships for 2026." },
      { q: "contact", a: "Email: sumitsharmark92@gmail.com | Phone: +91 90270 51135 | LinkedIn: linkedin.com/in/sumitsharma | GitHub: github.com/sumitsharma" }
    ]
  },
  adminAuth: {
    salt: "sumit_sec_salt_2026",
    passwordHash: hashPassword("sumit@admin2026", "sumit_sec_salt_2026"),
    sessionTokens: []
  },
  whiteboard_strokes: [],
  telemetry: []
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Merge with defaultData to guarantee all keys exist
        return {
          ...defaultData,
          ...parsed,
          profile: { ...defaultData.profile, ...(parsed.profile || {}) },
          settings: { ...defaultData.settings, ...(parsed.settings || {}) },
          aiConfig: { ...defaultData.aiConfig, ...(parsed.aiConfig || {}) },
          adminAuth: { ...defaultData.adminAuth, ...(parsed.adminAuth || {}) },
          projects: parsed.projects || defaultData.projects,
          skills: parsed.skills || defaultData.skills,
          experience: parsed.experience || defaultData.experience,
          education: parsed.education || defaultData.education,
          certifications: parsed.certifications || defaultData.certifications,
          hackathons: parsed.hackathons || defaultData.hackathons,
          guestbook: parsed.guestbook || defaultData.guestbook,
          polls: parsed.polls || defaultData.polls,
          qa: parsed.qa || defaultData.qa,
          telemetry: parsed.telemetry || [],
          whiteboard_strokes: parsed.whiteboard_strokes || []
        };
      }
    } catch (e) {
      console.error('[db] Error reading db.json, using defaults:', e.message);
    }
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  }

  save(data = this.data) {
    this.data = data;
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE); // Atomic write
    } catch (e) {
      // In serverless / read-only environments, keep memory copy
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[db] File write bypassed in ephemeral environment:', e.message);
      }
    }
  }

  // --- PUBLIC CONTENT API ---
  getContent() {
    return {
      profile: this.data.profile,
      projects: this.data.projects,
      skills: this.data.skills,
      experience: this.data.experience,
      education: this.data.education,
      certifications: this.data.certifications,
      hackathons: this.data.hackathons,
      settings: this.data.settings,
      poll: this.getPoll(),
      guestbookCount: (this.data.guestbook || []).length,
      qaCount: (this.data.qa || []).filter(q => q.answered).length
    };
  }

  // --- ADMIN AUTHENTICATION ---
  verifyAdminPassword(password) {
    if (!password) return false;
    // Allow environment variable override
    if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
      return true;
    }
    const salt = this.data.adminAuth?.salt || 'sumit_sec_salt_2026';
    const computed = hashPassword(password, salt);
    return computed === this.data.adminAuth?.passwordHash;
  }

  changeAdminPassword(newPassword) {
    if (!newPassword || newPassword.length < 6) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);
    this.data.adminAuth.salt = salt;
    this.data.adminAuth.passwordHash = hash;
    this.data.adminAuth.sessionTokens = []; // Invalidate all active sessions
    this.save();
    return true;
  }

  createSession() {
    const token = 'sec_' + crypto.randomBytes(32).toString('hex');
    if (!this.data.adminAuth.sessionTokens) this.data.adminAuth.sessionTokens = [];
    this.data.adminAuth.sessionTokens.push({
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    // Keep max 50 tokens
    if (this.data.adminAuth.sessionTokens.length > 50) {
      this.data.adminAuth.sessionTokens.shift();
    }
    this.save();
    return token;
  }

  validateSession(token) {
    if (!token) return false;
    const tokens = this.data.adminAuth?.sessionTokens || [];
    const idx = tokens.findIndex(t => t.token === token);
    if (idx < 0) return false;
    const session = tokens[idx];
    if (Date.now() > session.expiresAt) {
      tokens.splice(idx, 1);
      this.save();
      return false;
    }
    return true;
  }

  logoutSession(token) {
    if (!token) return;
    const tokens = this.data.adminAuth?.sessionTokens || [];
    const idx = tokens.findIndex(t => t.token === token);
    if (idx >= 0) {
      tokens.splice(idx, 1);
      this.save();
    }
  }

  // --- FULL DATA FOR ADMIN ---
  getAllData() {
    // Return clone without secrets
    const clone = JSON.parse(JSON.stringify(this.data));
    if (clone.adminAuth) {
      delete clone.adminAuth.passwordHash;
      delete clone.adminAuth.salt;
      delete clone.adminAuth.sessionTokens;
    }
    return clone;
  }

  updateSection(section, value) {
    if (!section || value === undefined) return false;
    if (section === 'adminAuth') return false; // Prevent overwriting auth structure directly
    this.data[section] = value;
    this.save();
    return true;
  }

  // --- GUESTBOOK ---
  getGuestbook() {
    return this.data.guestbook || [];
  }

  addGuestbookEntry(name, message, link) {
    const entry = {
      id: Date.now().toString(),
      name: name || 'anonymous hacker',
      message: (message || '').substring(0, 500),
      link: link || '',
      createdAt: new Date().toISOString(),
      pinned: false
    };
    if (!this.data.guestbook) this.data.guestbook = [];
    this.data.guestbook.unshift(entry);
    this.save();
    return entry;
  }

  deleteGuestbookEntry(id) {
    if (!this.data.guestbook) return false;
    const idx = this.data.guestbook.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.data.guestbook.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  togglePinGuestbook(id) {
    const entry = (this.data.guestbook || []).find(e => e.id === id);
    if (entry) {
      entry.pinned = !entry.pinned;
      // Sort pinned to top
      this.data.guestbook.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      this.save();
      return entry;
    }
    return null;
  }

  // --- POLLS ---
  getPoll() {
    return (this.data.polls && this.data.polls[0]) || defaultData.polls[0];
  }

  votePoll(optionIdx) {
    const poll = this.getPoll();
    if (poll && poll.options && poll.options[optionIdx]) {
      poll.options[optionIdx].votes = (poll.options[optionIdx].votes || 0) + 1;
      this.save();
      return poll;
    }
    return null;
  }

  updatePoll(question, options) {
    if (!question || !Array.isArray(options) || options.length < 2) return null;
    const poll = {
      id: 'poll-' + Date.now(),
      question: question.trim(),
      options: options.map(opt => ({
        text: typeof opt === 'string' ? opt.trim() : (opt.text || '').trim(),
        votes: typeof opt === 'object' && opt.votes ? Number(opt.votes) : 0
      }))
    };
    this.data.polls = [poll];
    this.save();
    return poll;
  }

  resetPollVotes() {
    const poll = this.getPoll();
    if (poll && poll.options) {
      poll.options.forEach(opt => opt.votes = 0);
      this.save();
      return poll;
    }
    return null;
  }

  // --- Q&A ---
  getQA() {
    return this.data.qa || [];
  }

  addQuestion(question) {
    const item = {
      id: Date.now().toString(),
      question: question.trim(),
      answer: "Thanks for asking! Sumit will review and post an answer shortly.",
      createdAt: new Date().toISOString(),
      answered: false
    };
    if (!this.data.qa) this.data.qa = [];
    this.data.qa.unshift(item);
    this.save();
    return item;
  }

  answerQuestion(id, answer) {
    const item = (this.data.qa || []).find(q => q.id === id);
    if (item) {
      item.answer = answer.trim();
      item.answered = true;
      item.answeredAt = new Date().toISOString();
      this.save();
      return item;
    }
    return null;
  }

  deleteQuestion(id) {
    if (!this.data.qa) return false;
    const idx = this.data.qa.findIndex(q => q.id === id);
    if (idx >= 0) {
      this.data.qa.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- AI CONFIG ---
  getAIConfig() {
    return this.data.aiConfig || defaultData.aiConfig;
  }

  updateAIConfig(newConfig) {
    this.data.aiConfig = {
      ...this.data.aiConfig,
      ...newConfig
    };
    this.save();
    return this.data.aiConfig;
  }

  // --- WHITEBOARD ---
  getStrokes() {
    return this.data.whiteboard_strokes || [];
  }

  addStroke(stroke) {
    if (!this.data.whiteboard_strokes) this.data.whiteboard_strokes = [];
    this.data.whiteboard_strokes.push(stroke);
    if (this.data.whiteboard_strokes.length > 5000) {
      this.data.whiteboard_strokes.shift();
    }
    if (this.data.whiteboard_strokes.length % 20 === 0) {
      this.save();
    }
  }

  clearStrokes() {
    this.data.whiteboard_strokes = [];
    this.save();
  }

  // --- TELEMETRY ---
  logVisit(pathName, userAgent, ip) {
    if (!this.data.telemetry) this.data.telemetry = [];
    this.data.telemetry.unshift({
      timestamp: new Date().toISOString(),
      path: pathName || '/',
      userAgent: (userAgent || '').substring(0, 150),
      ip: (ip || '').substring(0, 45)
    });
    if (this.data.telemetry.length > 500) this.data.telemetry.pop();
    this.save();
  }

  getTelemetry() {
    return {
      recentVisits: (this.data.telemetry || []).slice(0, 100),
      totalLoggedVisits: (this.data.telemetry || []).length
    };
  }

  // --- BACKUP & RESTORE ---
  exportJSON() {
    return JSON.stringify(this.getAllData(), null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
      
      // Preserve auth credentials unless explicitly provided
      const currentAuth = this.data.adminAuth;
      this.data = {
        ...parsed,
        adminAuth: parsed.adminAuth && parsed.adminAuth.passwordHash ? parsed.adminAuth : currentAuth
      };
      this.save();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = new Database();
