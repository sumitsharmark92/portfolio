import fs from "fs";
import path from "path";

export interface GuestbookEntry {
  id: string;
  name: string;
  handle: string;
  role: string;
  message: string;
  timestamp: string;
  ip: string;
  verified: boolean;
  avatarSeed?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  category: string;
  totalVotes: number;
  options: PollOption[];
}

export interface VisitorStats {
  totalVisitors: number;
  uptimeSeconds: number;
  simulatedThreatsBlocked: number;
  terminalCommandsRun: number;
  guestbookSigns: number;
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const DEFAULT_POLLS: Poll[] = [
  {
    id: "poll-soc-ai",
    question: "AI in SOC Operations: Greater Threat or Defensive Force Multiplier?",
    category: "SOC & Defensive AI",
    totalVotes: 142,
    options: [
      { id: "opt-1", text: "Defensive Superpower (Triage & Anomaly Correlation)", votes: 76 },
      { id: "opt-2", text: "Advantage Threat Actors (Polymorphic Malware & Phishing)", votes: 41 },
      { id: "opt-3", text: "Balanced Arms Race (Equally Amplifies Both Sides)", votes: 21 },
      { id: "opt-4", text: "Overhyped Marketing Term (Rules > Hallucinating LLMs)", votes: 4 },
    ],
  },
  {
    id: "poll-offensive-os",
    question: "Your Primary Penetration Testing / Security OS?",
    category: "Tooling & Distros",
    totalVotes: 118,
    options: [
      { id: "os-1", text: "Kali Linux (Battle-Tested Standard)", votes: 68 },
      { id: "os-2", text: "Parrot Security OS (Lightweight & MATE UI)", votes: 29 },
      { id: "os-3", text: "BlackArch / Custom Arch (Bleeding-Edge)", votes: 14 },
      { id: "os-4", text: "macOS / Windows WSL2 Custom Toolchain", votes: 7 },
    ],
  },
];

const DEFAULT_GUESTBOOK: GuestbookEntry[] = [
  {
    id: "gb-1",
    name: "Alex Vance",
    handle: "@vance_sec",
    role: "Senior Red Teamer",
    message: "Insane terminal interface and agentic recon framework! The UI execution is flawless. Bookmarking sumit-labs.me for sure.",
    timestamp: "2026-10-16T14:22:10.000Z",
    ip: "185.220.101.*** (Tor Exit Node)",
    verified: true,
    avatarSeed: "vance",
  },
  {
    id: "gb-2",
    name: "Priya Nair",
    handle: "@priya_cloud",
    role: "Cloud Security Architect",
    message: "Loved the Azure storage encryption & RBAC breakdown. Great to see solid security engineering from undergraduate talent!",
    timestamp: "2026-10-15T09:41:00.000Z",
    ip: "49.37.142.*** (Bengaluru, IN)",
    verified: true,
    avatarSeed: "priya",
  },
  {
    id: "gb-3",
    name: "Marcus Thorne",
    handle: "@mthorne_soc",
    role: "SOC Lead @ DefenseNet",
    message: "Tested the packet analyzer and port scanner simulation. Super realistic NSE response parsing. Keep grinding, Sumit!",
    timestamp: "2026-10-14T18:15:30.000Z",
    ip: "104.28.210.*** (Austin, TX)",
    verified: true,
    avatarSeed: "marcus",
  },
];

// In-memory fallback if filesystem write is restricted in serverless
let memoryGuestbook: GuestbookEntry[] = [...DEFAULT_GUESTBOOK];
let memoryPolls: Poll[] = [...DEFAULT_POLLS];
let memoryStats: VisitorStats = {
  totalVisitors: 1248,
  uptimeSeconds: 84600,
  simulatedThreatsBlocked: 4219,
  terminalCommandsRun: 3120,
  guestbookSigns: 3,
};

// Ensure data folder exists
function ensureDataDir() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    console.error("Could not ensure data dir:", e);
  }
}

// Read database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readDatabase(): Record<string, any> {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (!parsed.guestbook) parsed.guestbook = DEFAULT_GUESTBOOK;
      if (!parsed.polls) parsed.polls = DEFAULT_POLLS;
      if (!parsed.stats) parsed.stats = memoryStats;
      return parsed;
    }
  } catch (err) {
    console.error("Error reading db.json, using fallback:", err);
  }

  return {
    guestbook: memoryGuestbook,
    polls: memoryPolls,
    stats: memoryStats,
  };
}

// Write database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function writeDatabase(data: Record<string, any>) {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json, updated memory state:", err);
    if (data.guestbook) memoryGuestbook = data.guestbook;
    if (data.polls) memoryPolls = data.polls;
    if (data.stats) memoryStats = data.stats;
  }
}

// Guestbook Actions
export function getGuestbookEntries(): GuestbookEntry[] {
  const db = readDatabase();
  return db.guestbook || memoryGuestbook;
}

export function addGuestbookEntry(entry: Omit<GuestbookEntry, "id" | "timestamp" | "verified">): GuestbookEntry {
  const db = readDatabase();
  const entries: GuestbookEntry[] = db.guestbook || memoryGuestbook;

  const newEntry: GuestbookEntry = {
    ...entry,
    id: `gb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    verified: false,
  };

  entries.unshift(newEntry);
  db.guestbook = entries;

  if (db.stats) {
    db.stats.guestbookSigns = (db.stats.guestbookSigns || 0) + 1;
  }
  memoryGuestbook = entries;
  writeDatabase(db);
  return newEntry;
}

// Polls Actions
export function getPolls(): Poll[] {
  const db = readDatabase();
  return db.polls || memoryPolls;
}

export function voteInPoll(pollId: string, optionId: string): Poll | null {
  const db = readDatabase();
  const polls: Poll[] = db.polls || memoryPolls;

  const poll = polls.find((p) => p.id === pollId);
  if (!poll) return null;

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return null;

  option.votes += 1;
  poll.totalVotes += 1;

  db.polls = polls;
  memoryPolls = polls;
  writeDatabase(db);
  return poll;
}

// Stats Actions
export function getStats(): VisitorStats {
  const db = readDatabase();
  return db.stats || memoryStats;
}

export function incrementStat(key: keyof VisitorStats, amount = 1) {
  const db = readDatabase();
  if (!db.stats) db.stats = { ...memoryStats };
  db.stats[key] = (db.stats[key] || 0) + amount;
  memoryStats = db.stats;
  writeDatabase(db);
}
