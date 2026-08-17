/* ============================================================
   VERCEL SERVERLESS ENTRYPOINT (api/index.js)
   Serverless HTTP router for 24/7 backend execution on Vercel.
   ============================================================ */

const db = require('../shared/backend/db.js');
const aiService = require('../shared/backend/ai-service.js');
const { sanitizeText, sanitizeLink } = require('../shared/backend/sanitize.js');
const { rateLimit } = require('../shared/backend/utils.js');

module.exports = async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  let reqPath = url.pathname;

  // Normalization
  if (reqPath === '/status' || reqPath === '/health') {
    return res.status(200).json({
      status: 'online',
      environment: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  // Extract Bearer Token
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  const requireAdmin = () => {
    if (!token || !db.validateSession(token)) {
      res.status(401).json({ error: 'Unauthorized. Admin session required.' });
      return false;
    }
    return true;
  };

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  // Body Parsing Helper (handles both parsed body and stream)
  const getBody = async () => {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (_) { return {}; }
    }
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); } catch (_) { resolve({}); }
      });
      req.on('error', () => resolve({}));
    });
  };

  try {
    // 0. Public Content API
    if (reqPath === '/api/content' && req.method === 'GET') {
      db.logVisit('/api/content', req.headers['user-agent'], clientIp);
      return res.status(200).json(db.getContent());
    }

    // 1. Guestbook API
    if (reqPath === '/api/guestbook') {
      if (req.method === 'GET') {
        return res.status(200).json(db.getGuestbook());
      }
      if (req.method === 'POST') {
        if (!rateLimit(clientIp, 20, 60000)) {
          return res.status(429).json({ error: 'Too many requests. Please slow down.' });
        }
        const data = await getBody();
        const message = sanitizeText(data.message, 500);
        if (!message) return res.status(400).json({ error: 'Message required' });
        const name = sanitizeText(data.name, 50);
        const link = sanitizeLink(data.link);
        const entry = db.addGuestbookEntry(name, message, link);
        return res.status(201).json(entry);
      }
    }

    // Guestbook Admin Actions
    if (reqPath.startsWith('/api/guestbook/')) {
      const parts = reqPath.split('/');
      const entryId = parts[3];
      const action = parts[4];

      if (action === 'pin' && req.method === 'POST') {
        if (!requireAdmin()) return;
        const entry = db.togglePinGuestbook(entryId);
        return res.status(200).json({ success: true, entry });
      }
      if (req.method === 'DELETE') {
        if (!requireAdmin()) return;
        const deleted = db.deleteGuestbookEntry(entryId);
        return res.status(deleted ? 200 : 404).json({ success: deleted });
      }
    }

    // 2. Polls API
    if (reqPath === '/api/polls') {
      if (req.method === 'GET') return res.status(200).json(db.getPoll());
    }
    if (reqPath === '/api/polls/vote' && req.method === 'POST') {
      if (!rateLimit(clientIp, 40, 60000)) {
        return res.status(429).json({ error: 'Too many votes. Please slow down.' });
      }
      const data = await getBody();
      if (data.optionIdx === undefined) return res.status(400).json({ error: 'Option index required' });
      const updated = db.votePoll(Number(data.optionIdx));
      if (updated) return res.status(200).json(updated);
      return res.status(400).json({ error: 'Invalid option' });
    }

    // 3. Q&A API
    if (reqPath === '/api/qa') {
      if (req.method === 'GET') return res.status(200).json(db.getQA());
      if (req.method === 'POST') {
        if (!rateLimit(clientIp, 20, 60000)) {
          return res.status(429).json({ error: 'Too many submissions. Please slow down.' });
        }
        const data = await getBody();
        const sanitizedQuestion = sanitizeText(data.question, 300);
        if (!sanitizedQuestion) return res.status(400).json({ error: 'Question required' });
        const item = db.addQuestion(sanitizedQuestion);
        return res.status(201).json(item);
      }
    }

    // Q&A Admin Actions
    if (reqPath.startsWith('/api/qa/')) {
      const parts = reqPath.split('/');
      const qId = parts[3];
      const action = parts[4];

      if (action === 'answer' && req.method === 'POST') {
        if (!requireAdmin()) return;
        const data = await getBody();
        if (!data.answer) return res.status(400).json({ error: 'Answer required' });
        const item = db.answerQuestion(qId, data.answer);
        return res.status(item ? 200 : 404).json({ success: !!item, item });
      }
      if (req.method === 'DELETE') {
        if (!requireAdmin()) return;
        const deleted = db.deleteQuestion(qId);
        return res.status(deleted ? 200 : 404).json({ success: deleted });
      }
    }

    // 4. AI Chatbot API
    if (reqPath === '/api/ai-chat' && req.method === 'POST') {
      if (!rateLimit(clientIp, 40, 60000)) {
        return res.status(429).json({ error: 'Too many queries. Please slow down.' });
      }
      const data = await getBody();
      const userMsg = data.message || '';
      try {
        const result = await aiService.generateAIReply(userMsg);
        return res.status(200).json(result);
      } catch (err) {
        return res.status(200).json({ reply: aiService.getLocalFallbackReply(userMsg) });
      }
    }

    // 5. Admin Endpoints
    if (reqPath === '/api/admin/login' && req.method === 'POST') {
      const data = await getBody();
      if (!data.password) return res.status(400).json({ error: 'Password required' });
      if (db.verifyAdminPassword(data.password)) {
        const sessionToken = db.createSession();
        return res.status(200).json({ success: true, token: sessionToken });
      }
      return res.status(401).json({ error: 'Incorrect master password' });
    }

    if (reqPath === '/api/admin/auth-check' && req.method === 'GET') {
      if (token && db.validateSession(token)) {
        return res.status(200).json({ authenticated: true });
      }
      return res.status(401).json({ authenticated: false });
    }

    if (reqPath === '/api/admin/logout' && req.method === 'POST') {
      if (token) db.logoutSession(token);
      return res.status(200).json({ success: true });
    }

    if (reqPath === '/api/admin/data' && req.method === 'GET') {
      if (!requireAdmin()) return;
      return res.status(200).json(db.getAllData());
    }

    if (reqPath === '/api/admin/update' && req.method === 'POST') {
      if (!requireAdmin()) return;
      const data = await getBody();
      if (!data.section) return res.status(400).json({ error: 'Section required' });
      const success = db.updateSection(data.section, data.data);
      return res.status(success ? 200 : 400).json({ success });
    }

    if (reqPath === '/api/admin/change-password' && req.method === 'POST') {
      if (!requireAdmin()) return;
      const data = await getBody();
      if (!data.currentPassword || !data.newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
      }
      if (!db.verifyAdminPassword(data.currentPassword)) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }
      const success = db.changeAdminPassword(data.newPassword);
      return res.status(success ? 200 : 400).json({ success });
    }

    if (reqPath === '/api/admin/restore' && req.method === 'POST') {
      if (!requireAdmin()) return;
      const data = await getBody();
      if (!data.data) return res.status(400).json({ error: 'Data required' });
      const result = db.importJSON(data.data);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (reqPath === '/api/telemetry' && req.method === 'GET') {
      return res.status(200).json(db.getTelemetry());
    }

    return res.status(404).json({ error: `Not found: ${reqPath}` });
  } catch (err) {
    console.error('[vercel-api] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
