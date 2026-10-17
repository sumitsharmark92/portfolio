"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Terminal,
  User,
  Clock,
  Cpu,
  FolderGit2,
  Sliders,
  BookOpen,
  Vote,
  Palette,
  Music,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  X,
  Check,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerMatrix: () => void;
  onTriggerPanic: () => void;
  onTriggerCtf: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onTriggerMatrix,
  onTriggerPanic,
  onTriggerCtf,
}) => {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        soundEngine.playCyberBlip(900);
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
          const btn = document.querySelector('button[aria-label="Search and command palette"]') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: "terminal", label: "Jump to Terminal CLI", category: "Navigation", icon: Terminal, action: () => { window.location.hash = "#terminal"; onClose(); } },
    { id: "about", label: "Operator Profile & Bio (./about)", category: "Navigation", icon: User, action: () => { window.location.hash = "#about"; onClose(); } },
    { id: "now", label: "What I'm Doing Now (./now)", category: "Navigation", icon: Clock, action: () => { window.location.hash = "#now"; onClose(); } },
    { id: "skills", label: "Interactive Skill Matrix (./skills)", category: "Navigation", icon: Cpu, action: () => { window.location.hash = "#skills"; onClose(); } },
    { id: "projects", label: "Selected Security Projects (./projects)", category: "Navigation", icon: FolderGit2, action: () => { window.location.hash = "#projects"; onClose(); } },
    { id: "playground", label: "Port Scanner & Packet Analyzer (./playground)", category: "Tools", icon: Sliders, action: () => { window.location.hash = "#playground"; onClose(); } },
    { id: "guestbook", label: "Sign Guestbook (./guestbook)", category: "Mini-Apps", icon: BookOpen, action: () => { window.location.hash = "#guestbook"; onClose(); } },
    { id: "polls", label: "Live Cybersecurity Polls (./polls)", category: "Mini-Apps", icon: Vote, action: () => { window.location.hash = "#polls"; onClose(); } },
    { id: "draw", label: "Collaborative Threat Canvas (./draw)", category: "Mini-Apps", icon: Palette, action: () => { window.location.hash = "#draw"; onClose(); } },
    { id: "jam", label: "Cyber Synth & Rhythm Player (./jam)", category: "Mini-Apps", icon: Music, action: () => { window.location.hash = "#jam"; onClose(); } },
    {
      id: "copy-email",
      label: "Copy Email: sumitsharmark92@gmail.com",
      category: "Contact & Links",
      icon: Copy,
      action: () => {
        navigator.clipboard.writeText("sumitsharmark92@gmail.com");
        soundEngine.playSuccessChirp();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
    {
      id: "github",
      label: "Open GitHub Profile (sumitsharmark92)",
      category: "Contact & Links",
      icon: ExternalLink,
      action: () => { window.open("https://github.com/sumitsharmark92", "_blank"); onClose(); },
    },
    {
      id: "matrix-mode",
      label: "Trigger Fullscreen Matrix Digital Rain",
      category: "Special",
      icon: Sparkles,
      action: () => { onTriggerMatrix(); onClose(); },
    },
    {
      id: "ctf-challenge",
      label: "Solve Secret CTF Challenge",
      category: "Special",
      icon: Sparkles,
      action: () => { onTriggerCtf(); onClose(); },
    },
    {
      id: "panic-mode",
      label: "Simulate Kernel Panic Lockdown (sudo rm -rf /)",
      category: "Danger Zone",
      icon: ShieldAlert,
      action: () => { onTriggerPanic(); onClose(); },
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150 font-mono">
      <div className="w-full max-w-xl bg-cyber-dark border border-neon-cyan/40 rounded-lg shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-cyber-border bg-cyber-card/80">
          <Search className="w-4 h-4 text-neon-cyan mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search sections..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              soundEngine.playKeyClick();
            }}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-cyber-textMuted focus:outline-none"
          />
          {copied ? (
            <span className="text-xs text-neon-green flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-neon-green/10">
              <Check className="w-3 h-3" /> COPIED
            </span>
          ) : (
            <button
              onClick={onClose}
              className="text-cyber-textMuted hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-cyber-textMuted">
              No matching commands found for &quot;{query}&quot;. Try typing &quot;terminal&quot;, &quot;skills&quot;, or &quot;scan&quot;.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEngine.playCyberBlip(1000);
                    item.action();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded hover:bg-neon-cyan/10 hover:text-white text-left group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-neon-cyan group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-cyber-textLight group-hover:text-white">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider group-hover:text-neon-cyan">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Helper */}
        <div className="px-4 py-2 border-t border-cyber-border bg-cyber-card/40 flex items-center justify-between text-[10px] text-cyber-textMuted">
          <span>Navigate with arrow keys or click</span>
          <kbd className="px-1.5 py-0.5 bg-cyber-dark border border-cyber-border rounded">ESC to close</kbd>
        </div>
      </div>
    </div>
  );
};
