"use client";

import React, { useState } from "react";
import {
  Cpu,
  Shield,
  Zap,
  Terminal,
  Activity,
  Radar,
  Cloud,
  Code,
  Globe,
  Info,
  CheckCircle,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA, SkillItem } from "@/lib/portfolioData";

export const SkillsMatrix: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);

  const categories = [
    "All",
    "Security & SOC",
    "Penetration Testing",
    "Cloud & Infrastructure",
    "Development & Automation",
  ];

  const filteredSkills =
    activeCategory === "All"
      ? PORTFOLIO_DATA.skills
      : PORTFOLIO_DATA.skills.filter((s) => s.category === activeCategory);

  const getIcon = (name: string) => {
    switch (name) {
      case "Activity": return <Activity className="w-5 h-5 text-neon-green" />;
      case "Radar": return <Radar className="w-5 h-5 text-neon-cyan" />;
      case "Zap": return <Zap className="w-5 h-5 text-neon-amber" />;
      case "ShieldAlert": return <Shield className="w-5 h-5 text-neon-red" />;
      case "Terminal": return <Terminal className="w-5 h-5 text-neon-green" />;
      case "Cloud": return <Cloud className="w-5 h-5 text-neon-cyan" />;
      case "Code": return <Code className="w-5 h-5 text-neon-purple" />;
      case "Cpu": return <Cpu className="w-5 h-5 text-neon-amber" />;
      default: return <Globe className="w-5 h-5 text-neon-cyan" />;
    }
  };

  return (
    <section id="skills" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-green/40 flex items-center justify-center text-neon-green">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-cyan tracking-widest font-semibold flex items-center gap-1.5">
            <span>[02 // ARSENAL]</span>
            <span className="text-white/30">•</span>
            <span>CAPABILITIES &amp; PROTOCOLS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            INTERACTIVE SKILL MATRIX &amp; TOOLING
          </h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              soundEngine.playCyberBlip(850);
              setActiveCategory(cat);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-neon-green text-cyber-black shadow-glowGreen"
                : "bg-cyber-card border border-cyber-border text-cyber-textMuted hover:text-white hover:border-neon-green/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            onClick={() => {
              soundEngine.playCyberBlip(1000);
              setSelectedSkill(skill);
            }}
            className="cyber-card p-5 rounded-xl border border-cyber-border hover:border-neon-green/40 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyber-dark border border-white/5 flex items-center justify-center group-hover:border-neon-green/40 transition-colors">
                    {getIcon(skill.iconName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">
                      {skill.name}
                    </h3>
                    <span className="text-[10px] text-cyber-textMuted uppercase">
                      {skill.category}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-dark border border-white/10 text-neon-cyan">
                  {skill.level}
                </span>
              </div>

              {/* Proficiency Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-cyber-textMuted">Proficiency:</span>
                  <span className="text-neon-green font-bold">{skill.proficiency}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-cyber-dark overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-700"
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-cyber-textLight leading-relaxed line-clamp-2">
                {skill.realWorldApplication}
              </p>
            </div>

            {/* Hover Tooltip Helper */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-cyber-textMuted">
              <span className="text-neon-cyan group-hover:underline flex items-center gap-1">
                <Info className="w-3 h-3" /> CLICK FOR SOC &amp; PENTEST APPLICATION
              </span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Skill Drilldown Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-cyber-dark border border-neon-cyan rounded-xl p-6 shadow-glowCyan space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center">
                  {getIcon(selectedSkill.iconName)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedSkill.name}</h3>
                  <span className="text-xs text-neon-cyan">{`${selectedSkill.category} // ${selectedSkill.level}`}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-cyber-textMuted hover:text-white text-xs px-2 py-1 rounded bg-cyber-card border border-cyber-border"
              >
                ESC / CLOSE
              </button>
            </div>

            <div className="space-y-3 text-xs text-cyber-textLight">
              <div className="bg-cyber-card p-3 rounded-lg border border-white/5">
                <div className="text-neon-green font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  REAL-WORLD FIELD APPLICATION:
                </div>
                <p className="text-cyber-textLight leading-relaxed">{selectedSkill.realWorldApplication}</p>
              </div>

              <div className="bg-cyber-card p-3 rounded-lg border border-white/5">
                <div className="text-neon-cyan font-bold mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  DEFENSIVE &amp; SOC TRIAGE USAGE:
                </div>
                <p className="text-cyber-textLight leading-relaxed">{selectedSkill.socUsage}</p>
              </div>

              <div className="bg-cyber-card p-3 rounded-lg border border-white/5">
                <div className="text-neon-amber font-bold mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  OFFENSIVE &amp; PENETRATION TESTING USAGE:
                </div>
                <p className="text-cyber-textLight leading-relaxed">{selectedSkill.pentestUsage}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSkill(null)}
              className="w-full py-2 bg-neon-cyan text-cyber-black font-bold text-xs rounded hover:bg-cyan-300 transition-colors"
            >
              DISMISS DETAILS
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
