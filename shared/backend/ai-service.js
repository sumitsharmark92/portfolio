/* ============================================================
   AI SERVICE ENGINE (ai-service.js)
   Connects to Google Gemini API & OpenAI with full grounding
   in Sumit's resume, cybersecurity background, and dynamic DB.
   Includes smart fallback heuristic engine when offline.
   ============================================================ */

const https = require('https');
const db = require('./db.js');

/**
 * Builds the comprehensive grounding system prompt for Sumit's AI assistant.
 */
function buildGroundingPrompt() {
  const content = db.getContent();
  const aiConfig = db.getAIConfig();
  const profile = content.profile || {};
  const projects = content.projects || [];
  const skills = content.skills || [];
  const experience = content.experience || [];
  const certs = content.certifications || [];
  const education = content.education || [];

  const projectsSummary = projects.map(p => `- ${p.title}: ${p.desc} (Tags: ${(p.tags || []).join(', ')})`).join('\n');
  const skillsSummary = skills.map(s => `- ${s.category}: ${(s.tags || []).join(', ')}`).join('\n');
  const expSummary = experience.map(e => `- ${e.role} at ${e.company} (${e.period}): ${(e.details || []).join('; ')}`).join('\n');
  const certsSummary = certs.map(c => `- ${c}`).join('\n');
  const eduSummary = education.map(ed => `- ${ed.title} (${ed.subtitle})`).join('\n');
  const customKnowledgeSummary = (aiConfig.customKnowledge || []).map(k => `Q: ${k.q} -> A: ${k.a}`).join('\n');

  return `
${aiConfig.systemPrompt || "You are the AI Assistant for Sumit Sharma's Cybersecurity & Systems Portfolio."}

GROUNDED KNOWLEDGE BASE ABOUT SUMIT SHARMA:
- Full Name: ${profile.name || "Sumit Sharma"}
- Headline: ${profile.title || "Cybersecurity Engineer & Systems Developer"}
- Status / Availability: ${profile.statusBadge || "Actively available for Cybersecurity & Software Engineering internships for 2026"}
- Contact Info: Email: ${profile.contact?.email || "sumitsharmark92@gmail.com"}, Phone: ${profile.contact?.phone || "+91 90270 51135"}, Location: ${profile.contact?.location || "Vrindavan, UP · India"}
- Profiles: GitHub: ${profile.contact?.github || "https://github.com/sumitsharma"}, LinkedIn: ${profile.contact?.linkedin || "https://linkedin.com/in/sumitsharma"}
- Bio Summary: ${(profile.bioParagraphs || []).join(' ')}

KEY PROJECTS:
${projectsSummary}

CORE SKILLS & TOOLING:
${skillsSummary}

PROFESSIONAL EXPERIENCE:
${expSummary}

EDUCATION:
${eduSummary}

CERTIFICATIONS & ACHIEVEMENTS:
${certsSummary}

ADDITIONAL KNOWLEDGE:
${customKnowledgeSummary}

INSTRUCTIONS:
1. Always speak on behalf of Sumit Sharma in a helpful, sharp, professional, and knowledgeable cybersecurity persona.
2. Keep responses concise, direct, engaging, and recruiter-friendly (2-4 sentences or short bullet points).
3. If asked how to hire or contact Sumit, provide his direct email (${profile.contact?.email}) and LinkedIn.
4. If asked technical questions about cybersecurity, SOC, Wireshark, Azure, WebSockets, or his projects, answer with genuine technical clarity.
`.trim();
}

/**
 * Calls Google Gemini API
 */
async function callGemini(prompt, message, apiKey, modelName = 'gemini-1.5-flash') {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const requestData = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${prompt}\n\nUser Question: ${message}\n\nAnswer:` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    });

    const parsedUrl = new URL(url);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 12000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(body);
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) return resolve(reply.trim());
          }
          reject(new Error(`Gemini API responded with status ${res.statusCode}: ${body.substring(0, 150)}`));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API timeout'));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Calls OpenAI API (if configured)
 */
async function callOpenAI(prompt, message, apiKey, modelName = 'gpt-4o-mini') {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 12000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(body);
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return resolve(reply.trim());
          }
          reject(new Error(`OpenAI API status ${res.statusCode}`));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OpenAI timeout'));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Intelligent Rule-Based Fallback Engine
 */
function getLocalFallbackReply(message) {
  const content = db.getContent();
  const profile = content.profile || {};
  const q = (message || '').toLowerCase();

  if (q.includes('skill') || q.includes('stack') || q.includes('tool') || q.includes('language') || q.includes('technolog')) {
    return `Sumit's technical stack spans:\n• Cybersecurity: SOC Operations, Wireshark, Nmap, Metasploit, Burp Suite, Nessus, Active Directory.\n• Cloud & Platforms: Microsoft Azure (RBAC, Blob Storage), Linux/Kali, Docker.\n• Languages: Python, JavaScript/Node.js, Bash, C++, Go, SQL.\n• Architecture: Real-time WebSockets, distributed sync, and automated security pipelines.`;
  }
  
  if (q.includes('project') || q.includes('built') || q.includes('syncverse') || q.includes('portfolio') || q.includes('github')) {
    return `Notable Projects by Sumit:\n1. Red Team Agentic AI — Automated recon, port scanning, & vulnerability enumeration via LLMs.\n2. SYNCVERSE — Authoritative sub-50ms sync engine for music jams, watch parties, and whiteboard.\n3. Cyber-Ops Portfolio (sumit.sh) — High-tech terminal interface with real-time multiplayer widgets.\n4. Azure Cloud Security Hardening — RBAC, SAS tokens, and encrypted storage architecture.\n5. 3D Luxury E-Commerce — Three.js interactive product customizer.`;
  }

  if (q.includes('hire') || q.includes('job') || q.includes('intern') || q.includes('opportunity') || q.includes('resume') || q.includes('contact') || q.includes('email') || q.includes('phone')) {
    return `Sumit is actively open and interviewing for Cybersecurity (SOC, Pentesting, Security Engineering) & Software Engineering internships for 2026!\n• Email: ${profile.contact?.email || 'sumitsharmark92@gmail.com'}\n• Phone: ${profile.contact?.phone || '+91 90270 51135'}\n• LinkedIn: ${profile.contact?.linkedin || 'linkedin.com/in/sumitsharma'}\n• Resume download is available on the main page.`;
  }

  if (q.includes('education') || q.includes('college') || q.includes('university') || q.includes('degree') || q.includes('study')) {
    return `Sumit is pursuing a B.Tech in Computer Science & Engineering (Cybersecurity) at Sanskriti University, Mathura (Expected graduation 2026/2027), with practical enterprise IT and security experience.`;
  }

  if (q.includes('cert') || q.includes('credential') || q.includes('course') || q.includes('license')) {
    return `Sumit holds top security credentials including:\n• EC-Council CodeRed — Dark Web, Anonymity & Cryptocurrency (2026)\n• Cybrary — Penetration Tester Career Path & World-Class SOC Security\n• Microsoft — Secure Storage (Azure Files & Blob Storage)\n• Microsoft Applied Skills — Power Apps`;
  }

  if (q.includes('experience') || q.includes('work') || q.includes('govardhan') || q.includes('role')) {
    return `Sumit currently serves as IT Infrastructure & Security Admin at Govardhan Institute for Vedic Education, managing security & active directory policies for 100+ users, firewall rules, network traffic monitoring, and Azure cloud infrastructure.`;
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('who are you')) {
    return `Hello! I'm Sumit Sharma's AI Assistant. I can tell you all about his cybersecurity experience, projects, skills, certifications, and availability for 2026 internships. What would you like to explore?`;
  }

  return `Sumit Sharma is a B.Tech Cybersecurity student and systems engineer specializing in SOC operations, penetration testing, and cloud security. Feel free to ask about his skills, live projects (SYNCVERSE, Red Team AI), certifications, or contact info!`;
}

/**
 * Main AI Generation Function
 */
async function generateAIReply(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return { reply: "Please ask a question about Sumit's portfolio, skills, or experience!" };
  }

  const aiConfig = db.getAIConfig();
  const apiKey = aiConfig.apiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  const provider = aiConfig.provider || 'gemini';
  const model = aiConfig.model || 'gemini-1.5-flash';
  const prompt = buildGroundingPrompt();

  // If API Key is provided, call live AI API
  if (apiKey) {
    try {
      if (provider === 'gemini' || (!aiConfig.provider && apiKey.startsWith('AIza'))) {
        const reply = await callGemini(prompt, userMessage, apiKey, model);
        return { reply, source: 'gemini-api' };
      } else if (provider === 'openai' || apiKey.startsWith('sk-')) {
        const reply = await callOpenAI(prompt, userMessage, apiKey, model);
        return { reply, source: 'openai-api' };
      }
    } catch (err) {
      console.warn('[ai-service] Live API call failed, falling back to local engine:', err.message);
    }
  }

  // Smart heuristic fallback
  const reply = getLocalFallbackReply(userMessage);
  return { reply, source: 'grounded-engine' };
}

module.exports = {
  generateAIReply,
  buildGroundingPrompt,
  getLocalFallbackReply
};
