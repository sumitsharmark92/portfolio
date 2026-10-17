"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Send, MessageSquare } from "lucide-react";
import { soundEngine } from "@/lib/audio";
import { GuestbookEntry } from "@/lib/storage";

export const GuestbookSection: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/guestbook");
      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (e) {
      console.error("Failed to fetch guestbook:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    soundEngine.playKeyClick();
    setIsLoading(true);
    setStatusMsg("");

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          handle: handle.trim() || `@${name.toLowerCase().replace(/\s+/g, "_")}`,
          role: role.trim() || "Security Enthusiast",
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.entry) {
        soundEngine.playSuccessChirp();
        setEntries((prev) => [data.entry, ...prev]);
        setName("");
        setHandle("");
        setRole("");
        setMessage("");
        setStatusMsg("Entry successfully written to persistent ledger.");
      } else {
        soundEngine.playErrorBuzz();
        setStatusMsg(data.error || "Failed to sign guestbook.");
      }
    } catch {
      soundEngine.playErrorBuzz();
      setStatusMsg("Connection error while transmitting signature.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="guestbook" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-green/40 flex items-center justify-center text-neon-green shadow-glowGreen">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-green tracking-widest font-semibold flex items-center gap-1.5">
            <span>[./GUESTBOOK]</span>
            <span className="text-white/30">•</span>
            <span>PUBLIC AUDIT TRAIL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            COMMUNITY &amp; PEER GUESTBOOK
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-5 cyber-card p-6 rounded-xl border border-cyber-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neon-green" />
              SIGN THE CYBER LEDGER
            </h3>
            <span className="text-[10px] text-neon-cyan">LIVE RECORD</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-cyber-textMuted block mb-1">OPERATOR NAME *</label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-white focus:outline-none focus:border-neon-green font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-cyber-textMuted block mb-1">HANDLE / SOCIAL</label>
                <input
                  type="text"
                  placeholder="@alex_sec"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-white focus:outline-none focus:border-neon-green font-mono"
                />
              </div>
              <div>
                <label className="text-cyber-textMuted block mb-1">ORGANIZATION / ROLE</label>
                <input
                  type="text"
                  placeholder="Security Analyst"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-white focus:outline-none focus:border-neon-green font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-cyber-textMuted block mb-1">TRANSMISSION MESSAGE *</label>
              <textarea
                rows={3}
                placeholder="Leave feedback on projects, security notes, or collaboration shoutouts..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-white focus:outline-none focus:border-neon-green font-mono resize-none"
              />
            </div>

            {statusMsg && (
              <div className="text-xs text-neon-green p-2 bg-neon-green/10 border border-neon-green/30 rounded">
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded font-bold text-xs bg-neon-green text-cyber-black hover:bg-neon-cyan transition-colors flex items-center justify-center gap-2 shadow-glowGreen"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? "BROADCASTING..." : "COMMIT TO GUESTBOOK"}</span>
            </button>
          </form>
        </div>

        {/* Live Entries Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-cyber-textMuted px-1">
            <span>VERIFIED PEER SIGNATURES ({entries.length})</span>
            <span className="text-neon-cyan flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
              REAL-TIME FEED
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {entries.length === 0 ? (
              <div className="cyber-card p-6 rounded-xl text-center text-xs text-cyber-textMuted">
                No signatures recorded yet. Be the first to sign Sumit&apos;s cyber ledger!
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="cyber-card p-4 rounded-xl border border-cyber-border hover:border-neon-cyan/40 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyber-dark border border-neon-cyan/30 flex items-center justify-center text-neon-cyan font-bold text-xs">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{entry.name}</span>
                          <span className="text-[10px] text-neon-cyan font-medium">{entry.handle}</span>
                        </div>
                        <div className="text-[10px] text-cyber-textMuted">{entry.role}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-cyber-textMuted block">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] text-white/30">{entry.ip}</span>
                    </div>
                  </div>

                  <p className="text-xs text-cyber-textLight leading-relaxed pt-1 border-t border-white/5">
                    &quot;{entry.message}&quot;
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
