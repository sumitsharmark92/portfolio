"use client";

import React, { useEffect, useState, useRef } from "react";
import { Terminal, Shield, Zap, X, Copy, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { soundEngine } from "@/lib/audio";

interface KonamiHandlerProps {
  onTriggerMatrix: () => void;
}

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export const KonamiHandler: React.FC<KonamiHandlerProps> = ({ onTriggerMatrix }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const bufferRef = useRef<string[]>([]);

  useEffect(() => {
    // Print Cyberpunk Recruiter ASCII Art & Secret CTF Flag to Developer Console
    console.log(
      `%c
   _____ _    _ __  __ _____ _______   _            ____   _____ 
  / ____| |  | |  \\/  |_   _|__   __| | |        /\\  |  _ \\ / ____|
 | (___ | |  | | \\  / | | |    | |    | |       /  \\ | |_) | (___  
  \\___ \\| |  | | |\\/| | | |    | |    | |      / /\\ \\|  _ < \\___ \\ 
  ____) | |__| | |  | |_| |_   | |    | |____ / ____ \\ |_) |____) |
 |_____/ \\____/|_|  |_|_____|  |_|    |______/_/    \\_\\____/|_____/ 
                                                                    
 [=] WELCOME TO SUMIT SHARMA'S CYBER-OPS TERMINAL
 [=] Target: sumit-labs.me | vrindavan, india
 [=] Secret Recruiter Flag: FLAG{s3cur1ty_f1rst_sumit_labs}
 [=] Looking for elite talent? Email: sumitsharmark92@gmail.com
 [=] Try typing in the website CLI: 'help', 'skills', 'ctf', 'matrix', 'sudo rm -rf /'
      `,
      "color: #00ff66; font-family: monospace; font-size: 11px; font-weight: bold;"
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const next = [...bufferRef.current, key].slice(-KONAMI_CODE.length);
      bufferRef.current = next;

      const matches = next.every((val, index) => val.toLowerCase() === KONAMI_CODE[index].toLowerCase());

      if (matches) {
        soundEngine.playSuccessChirp();
        setIsUnlocked(true);
        onTriggerMatrix();

        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
            colors: ["#00ff66", "#00f0ff", "#ff2a5f"],
          });
        } catch {}
        bufferRef.current = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTriggerMatrix]);

  const copyFlag = () => {
    navigator.clipboard.writeText("FLAG{s3cur1ty_f1rst_sumit_labs}");
    soundEngine.playSuccessChirp();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isUnlocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-cyber-dark border-2 border-neon-cyan rounded-lg shadow-glowCyan overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-border bg-cyber-card">
          <div className="flex items-center gap-2 text-neon-cyan">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-bold tracking-wider">
              [CLASSIFIED] KONAMI CODE LEVEL 9 ACCESS UNLOCKED
            </span>
          </div>
          <button
            onClick={() => setIsUnlocked(false)}
            className="text-cyber-textMuted hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-black/80 border border-neon-cyan/40 p-4 rounded text-xs space-y-2">
            <p className="text-neon-green font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-neon-green" />
              SPECIAL SECURITY RECONNAISSANCE DOSSIER
            </p>
            <p className="text-cyber-textLight">
              Operator: <span className="text-white font-semibold">Sumit Sharma</span>
            </p>
            <p className="text-cyber-textLight">
              Affiliation: <span className="text-neon-cyan">Govardhan Institute for Vedic Education (GIVE)</span>
            </p>
            <p className="text-cyber-textLight">
              Education: <span className="text-white">B.Tech Cybersecurity @ Sanskriti University (2026)</span>
            </p>
            <p className="text-cyber-textLight">
              Clearance Level: <span className="text-neon-amber font-bold">TOP SECRET // RECRUITER VERIFIED</span>
            </p>
          </div>

          <div>
            <span className="text-xs text-cyber-textMuted block mb-1">
              RECRUITER SECRET PROOF FLAG:
            </span>
            <div className="flex items-center justify-between p-3 bg-cyber-card border border-neon-green/40 rounded">
              <span className="text-xs text-neon-green font-bold">
                FLAG&#123;s3cur1ty_f1rst_sumit_labs&#125;
              </span>
              <button
                onClick={copyFlag}
                className="px-2.5 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded text-xs hover:bg-neon-green hover:text-black transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setIsUnlocked(false);
                window.location.hash = "#terminal";
              }}
              className="flex-1 py-2 bg-neon-cyan text-cyber-black font-bold text-xs rounded hover:bg-cyan-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Terminal className="w-4 h-4" />
              OPEN INTERACTIVE CLI
            </button>
            <button
              onClick={() => setIsUnlocked(false)}
              className="px-4 py-2 bg-cyber-card border border-cyber-border text-xs text-white rounded hover:border-white transition-colors"
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
