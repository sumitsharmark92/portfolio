"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal, Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA } from "@/lib/portfolioData";

interface TerminalCLIProps {
  onTriggerMatrix: () => void;
  onTriggerPanic: () => void;
  onTriggerCtf: () => void;
  onSelectProject?: (projectId: string) => void;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  output: React.ReactNode;
}

export const TerminalCLI: React.FC<TerminalCLIProps> = ({
  onTriggerMatrix,
  onTriggerPanic,
  onTriggerCtf,
  onSelectProject,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: "init",
      command: "welcome",
      output: (
        <div className="space-y-1 text-xs">
          <div className="text-neon-green font-bold flex items-center gap-2">
            <span>[+] SUMIT.LABS CYBER-OPS TERMINAL INITIALIZED [v3.0.4]</span>
          </div>
          <p className="text-cyber-textMuted">
            Type <span className="text-neon-cyan font-bold">&apos;help&apos;</span> to inspect all available operator commands, or use tab-completion.
          </p>
        </div>
      ),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandList, setCommandList] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const availableCommands = [
    "help",
    "about",
    "whoami",
    "skills",
    "projects",
    "contact",
    "clear",
    "sudo rm -rf /",
    "matrix",
    "ctf",
    "uptime",
    "neofetch",
    "ls",
    "date",
    "cat resume",
  ];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Keystroke mechanical sound
    soundEngine.playKeyClick();

    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(inputVal.trim());
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandList.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandList.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandList[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (commandList.length === 0 || historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandList.length) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(commandList[nextIdx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleTabCompletion();
    }
  };

  const handleTabCompletion = () => {
    const trimmed = inputVal.trim().toLowerCase();
    if (!trimmed) return;
    const match = availableCommands.find((cmd) => cmd.startsWith(trimmed));
    if (match) {
      soundEngine.playCyberBlip(1200);
      setInputVal(match);
    }
  };

  const executeCommand = (rawCmd: string) => {
    if (!rawCmd) return;

    soundEngine.playCyberBlip(700);

    // Record in history list for Up/Down
    setCommandList((prev) => [...prev, rawCmd]);
    setHistoryIndex(-1);
    setInputVal("");

    const cmd = rawCmd.toLowerCase();

    // Specific command execution
    if (cmd === "clear") {
      setHistory([]);
      return;
    }

    if (cmd === "sudo rm -rf /" || cmd === "rm -rf /") {
      onTriggerPanic();
      setHistory((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: rawCmd,
          output: (
            <span className="text-neon-red font-bold animate-pulse">
              [!] CRITICAL: UNAUTHORIZED ROOT DESTRUCTION DETECTED. ENGAGING SYSTEM LOCKDOWN...
            </span>
          ),
        },
      ]);
      return;
    }

    if (cmd === "matrix") {
      onTriggerMatrix();
      setHistory((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: rawCmd,
          output: <span className="text-neon-green">[✓] Matrix digital rain visualizer triggered.</span>,
        },
      ]);
      return;
    }

    if (cmd === "ctf") {
      onTriggerCtf();
      setHistory((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: rawCmd,
          output: <span className="text-neon-amber">[★] Initializing Mini-CTF security challenge overlay...</span>,
        },
      ]);
      return;
    }

    let outputNode: React.ReactNode = null;

    switch (cmd) {
      case "help":
        outputNode = (
          <div className="space-y-1.5 text-xs text-cyber-textLight">
            <p className="text-neon-cyan font-semibold">AVAILABLE CYBER COMMANDS:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 font-mono">
              <div><span className="text-neon-green font-bold">about / whoami</span> — Operator bio &amp; education</div>
              <div><span className="text-neon-green font-bold">skills</span> — Categorized cybersecurity skill tree</div>
              <div><span className="text-neon-green font-bold">projects</span> — Showcase projects &amp; live links</div>
              <div><span className="text-neon-green font-bold">contact</span> — Reach Sumit (Email, Phone, Socials)</div>
              <div><span className="text-neon-green font-bold">ctf</span> — Secret interactive CTF challenge</div>
              <div><span className="text-neon-green font-bold">matrix</span> — Digital rain visualizer overlay</div>
              <div><span className="text-neon-green font-bold">neofetch</span> — Cyber system specs &amp; hardware</div>
              <div><span className="text-neon-green font-bold">uptime</span> — Operational duration stats</div>
              <div><span className="text-neon-green font-bold">sudo rm -rf /</span> — ⚠️ Dangerous forbidden action</div>
              <div><span className="text-neon-green font-bold">clear</span> — Wipe current terminal display</div>
            </div>
          </div>
        );
        break;

      case "about":
      case "whoami":
        outputNode = (
          <div className="space-y-2 text-xs text-cyber-textLight border-l-2 border-neon-cyan pl-3 my-1">
            <div className="text-neon-cyan font-bold text-sm">OPERATOR: SUMIT SHARMA</div>
            <p>
              <span className="text-cyber-textMuted">Role:</span> Junior Security Analyst &amp; Full-Stack Cyber Operator
            </p>
            <p>
              <span className="text-cyber-textMuted">University:</span> Sanskriti University — B.Tech Cybersecurity (Class of 2026)
            </p>
            <p>
              <span className="text-cyber-textMuted">Active Duty:</span> IT Infrastructure &amp; Security Administrator @ Govardhan Institute for Vedic Education (GIVE)
            </p>
            <p>
              <span className="text-cyber-textMuted">Specialization:</span> Blue Team Operations, SOC Analysis, Azure Cloud Hardening, Agentic Offensive AI
            </p>
          </div>
        );
        break;

      case "skills":
        outputNode = (
          <div className="space-y-2 text-xs pt-1">
            <div className="text-neon-green font-bold">CYBERSECURITY SKILL TREE:</div>
            <div className="space-y-1 font-mono">
              <div className="flex justify-between items-center text-cyber-textLight">
                <span>[+] Network Recon (Nmap, Wireshark, DPI):</span>
                <span className="text-neon-green font-bold">92% [█████████░]</span>
              </div>
              <div className="flex justify-between items-center text-cyber-textLight">
                <span>[+] Penetration Testing (Metasploit, Kali, Burp):</span>
                <span className="text-neon-green font-bold">86% [████████░░]</span>
              </div>
              <div className="flex justify-between items-center text-cyber-textLight">
                <span>[+] Cloud Security (Azure RBAC, Storage Encryption):</span>
                <span className="text-neon-cyan font-bold">85% [████████░░]</span>
              </div>
              <div className="flex justify-between items-center text-cyber-textLight">
                <span>[+] IT Admin &amp; AD (100+ Endpoints, GPO, EDR):</span>
                <span className="text-neon-green font-bold">90% [█████████░]</span>
              </div>
              <div className="flex justify-between items-center text-cyber-textLight">
                <span>[+] Scripting (Python, Bash, Node.js, WebSockets):</span>
                <span className="text-neon-cyan font-bold">88% [████████░░]</span>
              </div>
            </div>
          </div>
        );
        break;

      case "projects":
        outputNode = (
          <div className="space-y-2 text-xs pt-1">
            <div className="text-neon-green font-bold">FEATURED OPERATIONAL PROJECTS:</div>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {PORTFOLIO_DATA.projects.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-2 bg-cyber-card/60 border border-cyber-border rounded hover:border-neon-cyan/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-neon-cyan font-bold">
                      {idx + 1}. {p.title}
                    </span>
                    <button
                      onClick={() => onSelectProject?.(p.id)}
                      className="text-[10px] text-neon-green hover:underline cursor-pointer"
                    >
                      [VIEW SCHEMATIC]
                    </button>
                  </div>
                  <p className="text-[11px] text-cyber-textMuted mt-0.5">{p.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case "contact":
        outputNode = (
          <div className="space-y-1.5 text-xs text-cyber-textLight border-l-2 border-neon-green pl-3">
            <div className="text-neon-green font-bold">DIRECT COMMUNICATIONS CHANNEL:</div>
            <p>
              Email: <a href="mailto:sumitsharmark92@gmail.com" className="text-neon-cyan underline">sumitsharmark92@gmail.com</a>
            </p>
            <p>Phone / Signal: <span className="text-white">+91 9027051135</span></p>
            <p>GitHub: <a href="https://github.com/sumitsharmark92" target="_blank" rel="noreferrer" className="text-neon-cyan underline">github.com/sumitsharmark92</a></p>
            <p>Location: <span className="text-neon-amber">Vrindavan, Uttar Pradesh, India</span></p>
          </div>
        );
        break;

      case "uptime":
        outputNode = (
          <div className="text-xs text-cyber-textLight">
            <span className="text-neon-green font-bold">SYSTEM UPTIME:</span> 14 days, 8 hours, 32 mins, 42 secs (Continuous Zero-Downtime Daemon)
          </div>
        );
        break;

      case "neofetch":
        outputNode = (
          <div className="flex flex-col sm:flex-row gap-4 text-xs font-mono py-1">
            <pre className="text-neon-green font-bold text-[10px] leading-none shrink-0">
{`   _____ _    _ __  __ _____ _______ 
  / ____| |  | |  \\/  |_   _|__   __|
 | (___ | |  | | \\  / | | |    | |   
  \\___ \\| |  | | |\\/| | | |    | |   
  ____) | |__| | |  | |_| |_   | |   
 |_____/ \\____/|_|  |_|_____|  |_|   `}
            </pre>
            <div className="space-y-1 text-cyber-textLight">
              <p><span className="text-neon-cyan font-bold">OS:</span> Cyber-Labs Linux 6.8.0-x86_64</p>
              <p><span className="text-neon-cyan font-bold">Host:</span> Sanskriti University Cyber Defense Rig</p>
              <p><span className="text-neon-cyan font-bold">Kernel:</span> 6.8.0-45-generic</p>
              <p><span className="text-neon-cyan font-bold">Uptime:</span> 14d 8h 32m</p>
              <p><span className="text-neon-cyan font-bold">Shell:</span> bash 5.2.21</p>
              <p><span className="text-neon-cyan font-bold">Specialty:</span> Penetration Testing / Blue Team / SOC</p>
              <p><span className="text-neon-cyan font-bold">Certifications:</span> EC-Council, Microsoft Azure, Cybrary</p>
            </div>
          </div>
        );
        break;

      case "ls":
        outputNode = (
          <div className="text-xs text-cyber-textLight grid grid-cols-2 sm:grid-cols-4 gap-2">
            <span className="text-neon-cyan">about.sh*</span>
            <span className="text-neon-cyan">skills_matrix.json</span>
            <span className="text-neon-green">projects/</span>
            <span className="text-neon-amber">flag_hidden.enc</span>
            <span className="text-white">resume.md</span>
            <span className="text-white">certs/</span>
            <span className="text-neon-red">panic.sh*</span>
          </div>
        );
        break;

      case "date":
        outputNode = <span className="text-xs text-cyber-textLight">{new Date().toUTCString()}</span>;
        break;

      case "cat resume":
      case "cat resume.md":
        outputNode = (
          <div className="text-xs text-cyber-textLight space-y-1">
            <p className="text-neon-green font-bold">SUMIT SHARMA // CYBERSECURITY RESUME DOSSIER</p>
            <p>B.Tech Cybersecurity | IT Admin @ GIVE | 5 Industry Certifications</p>
            <p>Download complete PDF or contact: sumitsharmark92@gmail.com</p>
          </div>
        );
        break;

      default:
        soundEngine.playErrorBuzz();
        outputNode = (
          <div className="text-xs text-neon-red">
            zsh: command not found: <span className="text-white font-bold">{rawCmd}</span>. Type <span className="text-neon-cyan font-bold">&apos;help&apos;</span> for a list of available commands.
          </div>
        );
        break;
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: rawCmd,
        output: outputNode,
      },
    ]);
  };

  const copyTerminalLog = () => {
    const textLog = history
      .map((h) => `sumit@portfolio:~$ ${h.command}`)
      .join("\n");
    navigator.clipboard.writeText(textLog);
    soundEngine.playSuccessChirp();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="terminal"
      className={`w-full transition-all duration-300 font-mono ${
        isMaximized
          ? "fixed inset-4 z-50 bg-cyber-void/95 rounded-xl border border-neon-green shadow-glowGreen flex flex-col p-4"
          : "relative rounded-xl border border-cyber-border bg-cyber-black/90 shadow-2xl backdrop-blur-md overflow-hidden"
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-cyber-dark border-b border-cyber-border select-none">
        <div className="flex items-center gap-2">
          {/* macOS / Linux style dots */}
          <div
            onClick={() => {
              soundEngine.playErrorBuzz();
              onTriggerPanic();
            }}
            title="Warning: Simulated panic trigger"
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 cursor-pointer transition-colors"
          />
          <div
            onClick={() => soundEngine.playCyberBlip(800)}
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 cursor-pointer transition-colors"
          />
          <div
            onClick={() => setIsMaximized(!isMaximized)}
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 cursor-pointer transition-colors"
          />
          <span className="text-xs font-semibold text-cyber-textMuted ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-neon-green" />
            sumit@portfolio:~
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyTerminalLog}
            title="Copy terminal session"
            className="text-cyber-textMuted hover:text-white p-1 rounded transition-colors text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="text-cyber-textMuted hover:text-white p-1 rounded transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div
        className={`p-4 overflow-y-auto space-y-3 font-mono text-xs select-text ${
          isMaximized ? "flex-1" : "min-h-[260px] max-h-[380px]"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2 text-cyber-textMuted">
              <span className="text-neon-green">sumit@portfolio</span>
              <span className="text-white/40">:</span>
              <span className="text-neon-cyan">~</span>
              <span className="text-white">$</span>
              <span className="text-white font-medium">{item.command}</span>
            </div>
            <div className="pl-2">{item.output}</div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Input Line */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-cyber-dark/80 border-t border-cyber-border">
        <span className="text-neon-green font-semibold text-xs shrink-0">sumit@portfolio:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type 'help', 'skills', 'projects', 'ctf'..."
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-xs text-white placeholder-cyber-textMuted focus:outline-none font-mono"
        />
        <button
          onClick={() => executeCommand(inputVal.trim())}
          className="px-2.5 py-1 text-[11px] bg-neon-green/10 hover:bg-neon-green hover:text-cyber-black text-neon-green rounded border border-neon-green/30 transition-all font-semibold"
        >
          EXEC
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 bg-cyber-card/40 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-cyber-textMuted mr-1">QUICK CMDS:</span>
        {["help", "whoami", "skills", "projects", "ctf", "matrix", "contact", "sudo rm -rf /"].map((cmd) => (
          <button
            key={cmd}
            onClick={() => executeCommand(cmd)}
            className="px-2 py-0.5 rounded bg-cyber-card border border-cyber-border text-cyber-textLight hover:border-neon-green hover:text-neon-green transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
};
