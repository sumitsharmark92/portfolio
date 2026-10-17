"use client";

import React from "react";
import {
  Shield,
  Cpu,
  ChevronRight,
  Mail,
  Zap,
} from "lucide-react";
import { TerminalCLI } from "./TerminalCLI";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA } from "@/lib/portfolioData";

interface HeroSectionProps {
  onTriggerMatrix: () => void;
  onTriggerPanic: () => void;
  onTriggerCtf: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onTriggerMatrix,
  onTriggerPanic,
  onTriggerCtf,
  onSelectProject,
}) => {
  return (
    <section className="relative pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background Cyber Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Personal Brand & Hook */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-card border border-neon-green/40 shadow-glowGreen text-xs font-mono text-neon-green">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            <span>OPERATOR // SEC-OPS DEFENSE ACTIVE</span>
          </div>

          {/* Main Title */}
          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono leading-none">
              SUMIT
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-cyan to-white text-glow-green">
                SHARMA
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-cyber-textLight font-mono flex items-center gap-2">
              <Shield className="w-5 h-5 text-neon-cyan shrink-0" />
              <span>Cybersecurity Security Engineer &amp; Full-Stack Builder</span>
            </p>
          </div>

          {/* Bio Summary */}
          <p className="text-sm text-cyber-textMuted leading-relaxed max-w-xl">
            B.Tech in Cybersecurity at <strong className="text-white">Sanskriti University</strong> (Graduating 2026). Currently serving as IT Infrastructure &amp; Security Administrator at <strong className="text-neon-cyan">Govardhan Institute for Vedic Education</strong>, securing 100+ enterprise endpoints, managing Active Directory domains, and engineering autonomous offensive AI security frameworks.
          </p>

          {/* Core Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 font-mono">
            {PORTFOLIO_DATA.stats.map((st) => (
              <div
                key={st.label}
                className="p-3 rounded-lg bg-cyber-card/80 border border-cyber-border hover:border-neon-green/40 transition-colors"
              >
                <div className="text-xl sm:text-2xl font-bold text-neon-green font-mono">
                  {st.value}
                </div>
                <div className="text-[11px] font-semibold text-white mt-0.5">{st.label}</div>
                <div className="text-[10px] text-cyber-textMuted">{st.subtext}</div>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
            <a
              href="#projects"
              onClick={() => soundEngine.playCyberBlip(1000)}
              className="px-5 py-3 rounded-lg bg-neon-green text-cyber-black font-bold hover:bg-neon-cyan hover:shadow-glowCyan transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              EXPLORE PROJECTS
              <ChevronRight className="w-3.5 h-3.5" />
            </a>

            <a
              href="#playground"
              onClick={() => soundEngine.playCyberBlip(800)}
              className="px-5 py-3 rounded-lg bg-cyber-card border border-neon-cyan/40 hover:border-neon-cyan text-white hover:text-neon-cyan transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-neon-cyan" />
              RUN PORT SCANNER
            </a>

            <a
              href="mailto:sumitsharmark92@gmail.com"
              onClick={() => soundEngine.playCyberBlip(600)}
              className="px-4 py-3 rounded-lg bg-cyber-card border border-cyber-border text-cyber-textMuted hover:text-white hover:border-white transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              CONTACT
            </a>
          </div>
        </div>

        {/* Right Column: Interactive CLI Terminal */}
        <div className="lg:col-span-6 w-full">
          <div className="relative">
            {/* Terminal Corner Tech Accent */}
            <div className="absolute -top-3 -right-3 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-card border border-neon-cyan/30 text-[10px] font-mono text-neon-cyan shadow-glowCyan">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
              PORT 22 // SSH OPEN
            </div>

            <TerminalCLI
              onTriggerMatrix={onTriggerMatrix}
              onTriggerPanic={onTriggerPanic}
              onTriggerCtf={onTriggerCtf}
              onSelectProject={onSelectProject}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
