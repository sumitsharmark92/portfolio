"use client";

import React from "react";
import { Shield, Terminal } from "lucide-react";
import { soundEngine } from "@/lib/audio";

export const Footer: React.FC = () => {
  return (
    <footer className="pt-12 pb-24 px-4 sm:px-6 border-t border-cyber-border bg-cyber-void/80 font-mono text-xs text-cyber-textMuted">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyber-card border border-neon-green/30 flex items-center justify-center text-neon-green">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-white font-bold tracking-wider">SUMIT SHARMA</span>
            <span className="text-white/30 mx-1.5">•</span>
            <span>CYBER-OPS // v3.0</span>
          </div>
        </div>

        <div className="text-[11px] text-cyber-textLight">
          Designed &amp; Engineered by <strong className="text-white">Sumit Sharma</strong> • Vrindavan, India
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <a
            href="#terminal"
            onClick={() => soundEngine.playCyberBlip(800)}
            className="text-neon-cyan hover:underline flex items-center gap-1"
          >
            <Terminal className="w-3 h-3" />
            <span>TOP OF TERMINAL</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
