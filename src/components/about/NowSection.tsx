"use client";

import React from "react";
import { Clock, Radio, Target } from "lucide-react";
import { PORTFOLIO_DATA } from "@/lib/portfolioData";

export const NowSection: React.FC = () => {
  return (
    <section id="now" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      <div className="cyber-card p-6 sm:p-8 rounded-xl border border-neon-cyan/30 bg-cyber-card/70 backdrop-blur-md relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />

        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-dark border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-neon-cyan tracking-widest font-semibold flex items-center gap-1.5">
                <span>{"[./NOW]"}</span>
                <span className="text-white/30">•</span>
                <span>REAL-TIME OPERATIONAL FOCUS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                WHAT I&apos;M WORKING ON RIGHT NOW
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-dark border border-neon-green/30 text-xs text-neon-green self-start sm:self-auto">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE STATUS: ACTIVE RESEARCH &amp; DEFENSE</span>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {PORTFOLIO_DATA.now.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-cyber-dark/80 border border-cyber-border hover:border-neon-cyan/40 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neon-cyan uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="text-xs text-neon-green font-bold">{item.progress}%</span>
              </div>

              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-neon-green shrink-0" />
                <span>{item.currentTask}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-cyber-card h-1.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-neon-green to-neon-cyan h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <p className="text-xs text-cyber-textMuted leading-relaxed">{item.details}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
