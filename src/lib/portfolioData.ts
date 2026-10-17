export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: "Offensive AI" | "Full-Stack / 3D" | "Cloud Security" | "Real-Time Systems";
  tags: string[];
  description: string;
  problem: string;
  solution: string;
  architecture: {
    nodes: { id: string; label: string; role: string; type: "ingress" | "engine" | "security" | "storage" }[];
    dataFlow: string[];
  };
  metrics: { label: string; value: string }[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  category: "Security & SOC" | "Penetration Testing" | "Cloud & Infrastructure" | "Development & Automation";
  proficiency: number;
  level: "Advanced" | "Proficient" | "Specialist";
  iconName: string;
  realWorldApplication: string;
  socUsage: string;
  pentestUsage: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  type: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface CertificationItem {
  id: string;
  issuer: string;
  title: string;
  date: string;
  certId: string;
  verifyUrl: string;
  skills: string[];
  badgeColor: string;
}

export interface NowItem {
  category: string;
  currentTask: string;
  progress: number;
  details: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    name: "Sumit Sharma",
    handle: "sumit-labs",
    title: "Cybersecurity Security Engineer & Full-Stack Developer",
    subtitle: "B.Tech Cybersecurity Operator // Blue Team & SOC Specialist // Cloud Security",
    email: "sumitsharmark92@gmail.com",
    backupEmail: "calista.natsu@hotmail.com",
    phone: "+91 9027051135",
    location: "Vrindavan, Uttar Pradesh, India",
    coordinates: "27.5806° N, 77.7006° E",
    status: "Available for Cybersecurity & Cloud Internships (2025 - 2026)",
    university: "Sanskriti University",
    degree: "B.Tech in Computer Science & Engineering (Specialization: Cybersecurity)",
    expectedGraduation: "June 2026",
    cgpa: "Current B.Tech Cybersecurity Major",
    github: "https://github.com/sumitsharmark92",
    linkedin: "https://www.linkedin.com/in/sumit-sharma-cybersec",
    cybrary: "https://app.cybrary.it/profile/FavouriteGoose6406",
    summary:
      "Cybersecurity practitioner and full-stack software engineer with hands-on experience in IT infrastructure administration, network penetration testing, and Azure cloud security. Currently securing operations for 100+ endpoints at Govardhan Institute for Vedic Education. Passionate about automating defensive operations through agentic AI and building resilient distributed systems.",
  },

  stats: [
    { label: "Systems Hardened", value: "100+", subtext: "Enterprise Endpoints" },
    { label: "Security Certs", value: "5", subtext: "EC-Council, Microsoft, Cybrary" },
    { label: "Vulnerabilities Audited", value: "85+", subtext: "CVEs & Misconfigs" },
    { label: "Network Uptime", value: "99.94%", subtext: "Under Administration" },
  ],

  experience: [
    {
      id: "exp-1",
      company: "Govardhan Institute for Vedic Education (GIVE)",
      role: "IT Infrastructure & Security Administrator",
      period: "2025 — Present",
      location: "Vrindavan, India",
      type: "On-site / Security Operations",
      description:
        "Lead technical and operational security management for campus enterprise systems, safeguarding infrastructure for 100+ active users.",
      achievements: [
        "Configured and maintained Active Directory domains, group policies (GPO), and Azure Role-Based Access Control (RBAC) to enforce least privilege principles.",
        "Deployed enterprise endpoint detection and response (EDR) agents, reducing malware alerts by 80% through strict application allowlisting.",
        "Architected automated offsite backup routines for mission-critical databases, achieving zero data loss during simulated recovery drills.",
        "Managed edge firewall rules, VLAN segmentations, and remote access VPN tunnels with multi-factor authentication (MFA).",
        "Conducted regular vulnerability assessments using Nmap and OpenVAS, triaging security patches and hardening Windows/Linux servers.",
      ],
      technologies: ["Active Directory", "Azure RBAC", "Firewall Rules", "VLANs", "Windows Server", "Kali Linux", "Wireshark", "Bash"],
    },
  ] as ExperienceItem[],

  certifications: [
    {
      id: "cert-1",
      issuer: "EC-COUNCIL // CODERED",
      title: "Introduction to Dark Web, Anonymity & Cryptocurrency",
      date: "January 11, 2026",
      certId: "CERT #: 465805",
      verifyUrl: "https://learn.eccouncil.org/certificate/731a7d75-f885-4bdb-9a56-254119f919f8?logged=true",
      skills: ["Tor Architecture", "Cryptocurrency Tracing", "OPSEC", "Threat Intelligence"],
      badgeColor: "#00ff66",
    },
    {
      id: "cert-2",
      issuer: "MICROSOFT",
      title: "Secure Storage for Azure Files and Azure Blob Storage",
      date: "Microsoft Verified Credential",
      certId: "17DFE2349D981EA7",
      verifyUrl: "https://learn.microsoft.com/api/credentials/share/en-us/sumitsharma-7741/17DFE2349D981EA7?sharingId=94C07DED78C82462",
      skills: ["Azure Blob Storage", "RBAC", "SAS Tokens", "At-Rest & In-Transit Encryption"],
      badgeColor: "#00f0ff",
    },
    {
      id: "cert-3",
      issuer: "CYBRARY",
      title: "Penetration Tester Career Path",
      date: "October 30, 2022",
      certId: "CC-f0a13317-f7ea-4d0a-856e-14197a3819bf",
      verifyUrl: "https://app.cybrary.it/profile/FavouriteGoose6406?tab=cert-completion&cert=CC-f0a13317-f7ea-4d0a-856e-14197a3819bf",
      skills: ["Metasploit", "Vulnerability Scanning", "Privilege Escalation", "Reconnaissance"],
      badgeColor: "#ffb703",
    },
    {
      id: "cert-4",
      issuer: "CYBRARY",
      title: "Enterprise Security Leadership: Creating a World Class SOC",
      date: "November 18, 2022",
      certId: "CC-ad8cfd65-1a4f-4a15-9c40-0177c93f8b83",
      verifyUrl: "https://app.cybrary.it/profile/FavouriteGoose6406?tab=cert-completion&cert=CC-ad8cfd65-1a4f-4a15-9c40-0177c93f8b83",
      skills: ["SOC Architecture", "SIEM Triaging", "Incident Response Playbooks", "Threat Hunting"],
      badgeColor: "#a855f7",
    },
    {
      id: "cert-5",
      issuer: "MICROSOFT APPLIED SKILLS",
      title: "Create and Manage Canvas Apps with Power Apps",
      date: "Microsoft Applied Skills Credential",
      certId: "1296AA08882B9608",
      verifyUrl: "https://learn.microsoft.com/api/credentials/share/en-us/sumitsharma-7741/1296AA08882B9608?sharingId=94C07DED78C82462",
      skills: ["Rapid App Development", "Dataverse Integration", "UI/UX Architecture"],
      badgeColor: "#38bdf8",
    },
  ] as CertificationItem[],

  education: [
    {
      institution: "Sanskriti University",
      degree: "Bachelor of Technology in Computer Science & Engineering",
      specialization: "Cybersecurity & Information Defense",
      period: "2022 — 2026 (Expected)",
      location: "Mathura / Vrindavan, India",
      courses: [
        "Network Security & Cryptography",
        "Operating System Internals (Linux/Windows)",
        "Ethical Hacking & Penetration Testing",
        "Cloud Computing & Virtualization",
        "Database Management Systems",
      ],
    },
    {
      institution: "Central Board of Secondary Education (CBSE)",
      degree: "Senior Secondary Education (Class XII)",
      specialization: "Science & Computer Science",
      period: "Graduated",
      location: "India",
      courses: ["Computer Science (Python & SQL)", "Physics", "Mathematics", "Chemistry"],
    },
  ],

  skills: [
    {
      id: "sk-1",
      name: "Wireshark & Packet Analysis",
      category: "Security & SOC",
      proficiency: 88,
      level: "Advanced",
      iconName: "Activity",
      realWorldApplication: "Deep packet inspection (DPI), anomaly detection, and decrypting TLS streams for malware traffic forensics.",
      socUsage: "Triaging alerts by analyzing TCP handshakes, DNS tunneling attempts, and suspicious HTTP payload beacons.",
      pentestUsage: "Passive network sniffing, session token interception, and ARP spoofing validation.",
    },
    {
      id: "sk-2",
      name: "Nmap Network Scanning",
      category: "Penetration Testing",
      proficiency: 92,
      level: "Specialist",
      iconName: "Radar",
      realWorldApplication: "Host discovery, port scanning, OS fingerprinting, and NSE scripting for vulnerability verification.",
      socUsage: "Automated daily asset inventory audits to detect unauthorized shadow IT open ports.",
      pentestUsage: "Stealth SYN scans (-sS), service banner grabs (-sV), and default NSE vulnerability heuristics.",
    },
    {
      id: "sk-3",
      name: "Metasploit Framework",
      category: "Penetration Testing",
      proficiency: 84,
      level: "Advanced",
      iconName: "Zap",
      realWorldApplication: "Proof-of-concept exploitation, staging Meterpreter listeners, and post-exploitation privilege assessment.",
      socUsage: "Simulating adversarial attack techniques (Adversary Emulation) to validate SIEM detection rules.",
      pentestUsage: "Testing known CVEs on legacy unpatched perimeter services during authorized penetration tests.",
    },
    {
      id: "sk-4",
      name: "Burp Suite & Web Security",
      category: "Penetration Testing",
      proficiency: 82,
      level: "Advanced",
      iconName: "ShieldAlert",
      realWorldApplication: "Intercepting HTTP/S proxies, SQL injection verification, XSS fuzzing, and CSRF token analysis.",
      socUsage: "Replaying web application firewall (WAF) bypass payloads to craft tighter ModSecurity/Cloudflare regex.",
      pentestUsage: "Automated crawling, intruder fuzzing, and manual repeater tampering on RESTful endpoints.",
    },
    {
      id: "sk-5",
      name: "Kali Linux / Arch Linux",
      category: "Security & SOC",
      proficiency: 90,
      level: "Specialist",
      iconName: "Terminal",
      realWorldApplication: "Primary offensive & defensive terminal environment, forensic tool suites, and system kernel tuning.",
      socUsage: "Executing CLI triage scripts, memory dump inspections, and sandbox log parsing.",
      pentestUsage: "Custom bash pipelines chaining recon tools (sublist3r, httpx, nuclei, masscan).",
    },
    {
      id: "sk-6",
      name: "Azure Cloud Security & RBAC",
      category: "Cloud & Infrastructure",
      proficiency: 85,
      level: "Advanced",
      iconName: "Cloud",
      realWorldApplication: "Storage account encryption, SAS token governance, Defender for Cloud, and conditional access policies.",
      socUsage: "Monitoring Azure Sentinel / Log Analytics workspaces for anomalous geographically disparate logins.",
      pentestUsage: "Auditing over-privileged service principals and misconfigured public blob containers.",
    },
    {
      id: "sk-7",
      name: "Python for Security & Automation",
      category: "Development & Automation",
      proficiency: 88,
      level: "Advanced",
      iconName: "Code",
      realWorldApplication: "Building offensive AI agents, asynchronous network port scanners, socket listeners, and SIEM parsers.",
      socUsage: "Writing automated webhook processors that correlate threat feed IP reputations against firewall logs.",
      pentestUsage: "Writing custom exploit scripts, brute-force utilities, and token permutation generators.",
    },
    {
      id: "sk-8",
      name: "Bash & Linux Shell Scripting",
      category: "Development & Automation",
      proficiency: 90,
      level: "Specialist",
      iconName: "Cpu",
      realWorldApplication: "Cron automation, Linux server hardening, automated iptables rules, and log aggregation pipelines.",
      socUsage: "Rapid grep/awk/sed one-liners across gigabytes of Apache/Nginx access logs during active incidents.",
      pentestUsage: "Quick post-exploitation discovery scripts for Linux local privilege escalation checks.",
    },
    {
      id: "sk-9",
      name: "Node.js, TypeScript & WebSockets",
      category: "Development & Automation",
      proficiency: 86,
      level: "Advanced",
      iconName: "Globe",
      realWorldApplication: "Building high-performance interactive web tools, low-latency telemetry dashboards, and API servers.",
      socUsage: "Creating real-time security telemetry monitors with live WebSocket feeds.",
      pentestUsage: "Deploying decoy honeypots and telemetry collectors to detect automated port scrapers.",
    },
  ] as SkillItem[],

  projects: [
    {
      id: "red-team-agentic-ai",
      title: "Red Team Agentic AI",
      subtitle: "Autonomous Offensive Security Agent & Vulnerability Auditor",
      category: "Offensive AI",
      tags: ["Python", "LLM Tool-Calling", "Nmap", "Metasploit", "AsyncIO"],
      description:
        "An autonomous offensive security agent framework that leverages large language models combined with deterministic security tool calling (Nmap, Nikto, SearchSploit). It performs multi-stage, non-destructive perimeter reconnaissance, maps CVE attack graphs, and drafts comprehensive executive remediation reports automatically.",
      problem:
        "Manual security reconnaissance is time-intensive and error-prone, leaving security teams struggling to triage external attack surfaces fast enough against rapid zero-day disclosures.",
      solution:
        "Engineered an agentic state machine with built-in safety boundaries. The agent executes scoped scans, parses raw XML/JSON output, formulates attack vectors, and validates findings without executing destructive exploits.",
      architecture: {
        nodes: [
          { id: "1", label: "Target Scope Guardrail", role: "CIDR / FQDN Validator", type: "ingress" },
          { id: "2", label: "Agentic Reasoning Core", role: "LLM Planner & Task Decomposition", type: "engine" },
          { id: "3", label: "Security Tool Sandbox", role: "Dockerized Nmap & Recon Engine", type: "security" },
          { id: "4", label: "CVE Knowledge Base", role: "Vector DB & NVD Feed", type: "storage" },
        ],
        dataFlow: [
          "Operator inputs target scope & permission token",
          "Guardrail enforces RFC1918 or authorized IP whitelist",
          "Agent dispatches non-intrusive port & banner audit",
          "Tool output is correlated against CVE database in real-time",
          "Synthesized executive Markdown report generated in < 90 seconds",
        ],
      },
      metrics: [
        { label: "Recon Time Reduction", value: "75%" },
        { label: "Zero Destructive Actions", value: "100% Safe" },
        { label: "Average Audit Speed", value: "85s / Host" },
      ],
      githubUrl: "https://github.com/sumitsharmark92",
      liveUrl: "#playground",
      featured: true,
    },
    {
      id: "cyber-ops-portfolio",
      title: "Cyber-Ops Command Center",
      subtitle: "Full-Stack Security Operations & Cyber Telemetry Interface",
      category: "Full-Stack / 3D",
      tags: ["Next.js 14", "TypeScript", "Three.js", "Web Audio API", "Tailwind CSS"],
      description:
        "Personal cybersecurity portfolio engineered as a tactical cyber command center. Integrates an authentic Linux terminal CLI with tab-completion and history, live security tooling mini-apps, real-time collaboration canvas, and floating AI assistant.",
      problem:
        "Traditional portfolio websites are static, generic, and fail to demonstrate real full-stack engineering competency, security expertise, or interactive mastery.",
      solution:
        "Architected an immersive cyberpunk experience combining hardware-accelerated canvas visuals, Web Audio synthesized acoustic feedback, persistent guestbook/polls, and interactive security tools.",
      architecture: {
        nodes: [
          { id: "1", label: "Next.js App Router", role: "Edge-Rendered Web Frontend", type: "ingress" },
          { id: "2", label: "Cyber Terminal Engine", role: "Virtual Shell & History State", type: "engine" },
          { id: "3", label: "Web Audio Synthesizer", role: "Synthetic Mechanical Soundboard", type: "engine" },
          { id: "4", label: "Persistent JSON Database", role: "File-backed DB & API Endpoints", type: "storage" },
        ],
        dataFlow: [
          "Visitor interacts with CLI terminal or mini-apps",
          "Client executes simulated security operations locally",
          "API routes persist guestbook, live polls, and analytics",
          "Instant responsive visual & audio feedback rendered",
        ],
      },
      metrics: [
        { label: "Lighthouse Performance", value: "98/100" },
        { label: "Interactive Tools", value: "5 Mini-Apps" },
        { label: "Audio Synthesizer", value: "Zero Latency" },
      ],
      githubUrl: "https://github.com/sumitsharmark92/sumit-labs",
      liveUrl: "https://sumit-labs.me",
      featured: true,
    },
    {
      id: "azure-cloud-hardening",
      title: "Azure Cloud Security Hardening",
      subtitle: "Enterprise RBAC, Storage Encryption & Compliance Architecture",
      category: "Cloud Security",
      tags: ["Microsoft Azure", "RBAC", "Blob Encryption", "SAS Governance", "Cloud Defense"],
      description:
        "Comprehensive blueprint and implementation for hardening Azure Storage and compute infrastructure against unauthorized data exfiltration, lateral movement, and misconfiguration vulnerabilities.",
      problem:
        "Cloud storage misconfigurations (unrestricted public blobs, shared access signatures with excessive permissions) remain the #1 vector for catastrophic cloud data breaches.",
      solution:
        "Implemented strict Azure RBAC policies, Customer-Managed Keys (CMK) encryption at rest, private endpoints disabling all public internet routing, and short-lived, IP-restricted Shared Access Signatures.",
      architecture: {
        nodes: [
          { id: "1", label: "Azure Bastion & Private Endpoint", role: "Zero Public IP Perimeter", type: "ingress" },
          { id: "2", label: "Entra ID & Conditional Access", role: "MFA & Device Health Gate", type: "security" },
          { id: "3", label: "Hardened Azure Blob / Files", role: "TLS 1.3 & AES-256 Encrypted", type: "storage" },
          { id: "4", label: "Azure Monitor & Defender", role: "Audit Logging & Threat Alerts", type: "engine" },
        ],
        dataFlow: [
          "All incoming data requests traverse isolated private endpoints",
          "Entra ID verifies caller identity and role assignment (least privilege)",
          "Data encrypted in-transit (TLS 1.3) and at-rest via Azure Key Vault",
          "Continuous compliance logs streamed to Azure Sentinel",
        ],
      },
      metrics: [
        { label: "Public Exposure", value: "0 Public Endpoints" },
        { label: "Encryption Grade", value: "AES-256 / TLS 1.3" },
        { label: "Credential Verified", value: "17DFE2349D981EA7" },
      ],
      githubUrl: "https://github.com/sumitsharmark92",
      liveUrl: "https://learn.microsoft.com/api/credentials/share/en-us/sumitsharma-7741/17DFE2349D981EA7?sharingId=94C07DED78C82462",
      featured: true,
    },
    {
      id: "syncverse-engine",
      title: "SYNCVERSE — Real-Time Authoritative Engine",
      subtitle: "High-Frequency WebSocket Synchronization for Threat Visualizers",
      category: "Real-Time Systems",
      tags: ["WebSockets", "Node.js", "TypeScript", "HTML5 Canvas", "Distributed State"],
      description:
        "Low-latency, authoritative state synchronization engine designed for real-time collaborative threat diagrams, distributed canvas doodles, and live operational intelligence telemetry.",
      problem:
        "Synchronizing rapid canvas drawing events and security indicator updates across hundreds of concurrent operators causes packet congestion and state drift.",
      solution:
        "Built a delta-compression protocol over WebSockets with client-side prediction, delta tick reconciliation, and rate-limited broadcast pipelines.",
      architecture: {
        nodes: [
          { id: "1", label: "WebSocket Gateway", role: "Dual Heartbeat & Rate Limiter", type: "ingress" },
          { id: "2", label: "Authoritative Room Hub", role: "Conflict-Free Delta Engine", type: "engine" },
          { id: "3", label: "HTML5 Canvas Renderer", role: "60 FPS Hardware-Accelerated View", type: "security" },
          { id: "4", label: "Snapshot Buffer", role: "Time-Travel Replay & Export", type: "storage" },
        ],
        dataFlow: [
          "Client inputs vector stroke or threat icon",
          "Local client renders instantly via optimistic prediction",
          "Compressed byte delta dispatched to Room Hub",
          "Server validates bounds and broadcasts delta to all connected peers",
        ],
      },
      metrics: [
        { label: "State Broadcast Latency", value: "< 18ms" },
        { label: "Delta Compression", value: "65% Bandwidth Saved" },
        { label: "FPS Stability", value: "Locked 60 FPS" },
      ],
      githubUrl: "https://github.com/sumitsharmark92",
      liveUrl: "#draw",
      featured: true,
    },
  ] as Project[],

  now: [
    {
      category: "Offensive Security & Pentesting",
      currentTask: "Practicing HackTheBox & TryHackMe active machines",
      progress: 85,
      details: "Focusing on Active Directory lateral movement, Kerberoasting, and BloodHound domain graph analysis.",
    },
    {
      category: "Cloud & DevSecOps",
      currentTask: "Automating Azure policy compliance with Terraform",
      progress: 75,
      details: "Writing infrastructure-as-code scripts to enforce zero-trust storage account configurations.",
    },
    {
      category: "AI in Cybersecurity",
      currentTask: "Building multi-agent vulnerability assessment bots",
      progress: 90,
      details: "Connecting LangChain/Llama models with local Nmap and Metasploit RPC for autonomous audit generation.",
    },
    {
      category: "Career Milestone",
      currentTask: "Seeking 2025/2026 Cybersecurity & Cloud Internships",
      progress: 100,
      details: "Ready to contribute immediately to Blue Team, SOC Analysis, Penetration Testing, or Cloud Security roles.",
    },
  ] as NowItem[],

  aiKnowledgeBase: [
    {
      trigger: ["who", "sumit", "about", "bio", "background", "introduce"],
      response:
        "Sumit Sharma is a Cybersecurity Engineer and Full-Stack Developer currently pursuing his B.Tech in Cybersecurity at Sanskriti University (Graduation 2026). He also serves as the IT Infrastructure & Security Administrator at Govardhan Institute for Vedic Education (GIVE), managing security for 100+ endpoints. He specializes in Penetration Testing, SOC Operations, Azure Cloud Security, and Agentic AI security tooling.",
    },
    {
      trigger: ["skill", "skills", "tech", "tools", "stack"],
      response:
        "Sumit's core technical toolkit includes:\n• Security & SOC: Wireshark, Nmap, Metasploit, Burp Suite, Kali Linux, SIEM log triage, incident response.\n• Cloud & Infra: Microsoft Azure (RBAC, Blob/File encryption, SAS tokens), Active Directory, firewalls, VLANs, endpoint defense.\n• Programming: Python (security automation, LLM agents), Bash scripting, TypeScript, Node.js, Next.js, and WebSockets.",
    },
    {
      trigger: ["project", "projects", "portfolio", "built", "work"],
      response:
        "Sumit's flagship projects include:\n1. Red Team Agentic AI: Autonomous LLM-driven offensive security scanner with Nmap integration.\n2. Cyber-Ops Command Center: This ultra-realistic cyberpunk portfolio with terminal CLI & live tools.\n3. Azure Cloud Security Hardening: Enterprise storage encryption, RBAC, and zero-trust private endpoints.\n4. SYNCVERSE: Real-time authoritative state engine for collaborative security visualizers.",
    },
    {
      trigger: ["hire", "intern", "internship", "job", "opportunity", "available", "contact"],
      response:
        "Sumit is actively available for Cybersecurity, Cloud Security, SOC Analyst, and Penetration Testing internships (2025-2026). You can reach him directly at sumitsharmark92@gmail.com or call +91 9027051135. Location: Vrindavan, India (open to remote and on-site roles).",
    },
    {
      trigger: ["cert", "certification", "credential", "eccouncil", "azure", "cybrary"],
      response:
        "Sumit holds 5 major industry certifications:\n• EC-Council CodeRed: Dark Web, Anonymity & Cryptocurrency (Cert #465805)\n• Microsoft: Secure Storage for Azure Files & Blob Storage (ID: 17DFE2349D981EA7)\n• Microsoft Applied Skills: Power Apps Canvas Development (ID: 1296AA08882B9608)\n• Cybrary: Penetration Tester Career Path\n• Cybrary: Enterprise Security Leadership - Creating a World Class SOC",
    },
    {
      trigger: ["experience", "give", "admin", "job"],
      response:
        "At Govardhan Institute for Vedic Education (GIVE), Sumit serves as IT Infrastructure & Security Administrator. He manages Active Directory domains, Azure RBAC, firewall and VLAN configurations for over 100 enterprise users, handles automated backup routines, and conducts regular vulnerability audits.",
    },
  ],
};
