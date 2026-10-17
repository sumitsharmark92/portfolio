"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  RotateCcw,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA } from "@/lib/portfolioData";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export const SumitAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      sender: "bot",
      text: "Operator authenticated. I am Sumit.AI, an interactive intelligence assistant trained on Sumit Sharma's engineering resume, security credentials, and research projects. Ask me anything or select a quick topic below!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const chips = [
    { label: "⚡ Skills & Tools", query: "What are your core cybersecurity skills and tools?" },
    { label: "💻 Projects", query: "Tell me about your featured security projects." },
    { label: "🎯 Hire / Internships", query: "Are you available for cybersecurity internships?" },
    { label: "📜 Certifications", query: "What industry certifications do you hold?" },
    { label: "🛡️ SOC Experience", query: "Tell me about your IT Administrator and SOC role at GIVE." },
  ];

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    soundEngine.playCyberBlip(900);

    const newMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    // AI Knowledge Base matching
    setTimeout(() => {
      const botResponse = generateAIResponse(userText);
      soundEngine.playKeyClick();
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase();

    // Check knowledge base vectors
    for (const kb of PORTFOLIO_DATA.aiKnowledgeBase) {
      if (kb.trigger.some((t) => q.includes(t))) {
        return kb.response;
      }
    }

    if (q.includes("education") || q.includes("college") || q.includes("university")) {
      return `Sumit is pursuing his Bachelor of Technology in Cybersecurity at Sanskriti University (Expected graduation: June 2026). His coursework includes Network Security, Cryptography, Linux Internals, and Ethical Hacking.`;
    }

    if (q.includes("phone") || q.includes("email") || q.includes("reach") || q.includes("location")) {
      return `You can contact Sumit directly:\n• Email: sumitsharmark92@gmail.com\n• Phone: +91 9027051135\n• Location: Vrindavan, Uttar Pradesh, India\n• GitHub: https://github.com/sumitsharmark92`;
    }

    if (q.includes("flag") || q.includes("ctf") || q.includes("secret")) {
      return `Looking for the secret CTF flag? Inspect the HTTP response headers in DevTools Network tab or press F12 to check the developer console logs! Flag format: FLAG{...}`;
    }

    return `Thanks for your inquiry! Sumit is a junior cybersecurity engineer focusing on Blue Team SOC operations, penetration testing, and Azure cloud security. Feel free to ask about his specific certifications (EC-Council, Microsoft Azure, Cybrary), projects like Red Team Agentic AI, or his availability for 2025/2026 internships!`;
  };

  return (
    <div className="fixed bottom-10 right-4 sm:right-6 z-40 font-mono">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            soundEngine.playCyberBlip(1100);
            setIsOpen(true);
          }}
          className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-cyber-dark border-2 border-neon-cyan/70 text-white shadow-glowCyan hover:border-neon-green hover:shadow-glowGreen transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan group-hover:text-neon-green transition-colors">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white group-hover:text-neon-green transition-colors flex items-center gap-1.5">
            SUMIT.AI
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
          </span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[520px] bg-cyber-dark border-2 border-neon-cyan/50 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-cyber-card border-b border-cyber-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  SUMIT.AI
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                </div>
                <div className="text-[10px] text-cyber-textMuted">KNOWLEDGE BASE ASSISTANT</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundEngine.playCyberBlip(600);
                  setMessages([messages[0]]);
                }}
                title="Reset conversation"
                className="p-1 text-cyber-textMuted hover:text-white rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  soundEngine.playCyberBlip(600);
                  setIsOpen(false);
                }}
                className="p-1 text-cyber-textMuted hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === "user"
                      ? "bg-neon-cyan text-cyber-black font-medium"
                      : "bg-cyber-card border border-white/5 text-cyber-textLight"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`text-[9px] block text-right mt-1 ${
                      m.sender === "user" ? "text-cyber-black/70" : "text-cyber-textMuted"
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-cyber-card border border-white/5 rounded-xl flex items-center gap-1.5 text-cyber-textMuted text-xs">
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-cyber-card/60 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={() => handleSend(c.query)}
                className="px-2.5 py-1 rounded bg-cyber-dark border border-cyber-border text-[10px] text-cyber-textLight hover:text-neon-cyan hover:border-neon-cyan/40 whitespace-nowrap transition-colors shrink-0"
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Input Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-cyber-card border-t border-cyber-border flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about skills, certs, projects..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-white placeholder-cyber-textMuted focus:outline-none focus:border-neon-cyan font-mono"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-neon-cyan text-cyber-black rounded-lg disabled:opacity-40 hover:bg-cyan-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
