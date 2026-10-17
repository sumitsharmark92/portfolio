"use client";

import React, { useState } from "react";
import {
  Shield,
  Briefcase,
  GraduationCap,
  Award,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA } from "@/lib/portfolioData";

export const AboutSection: React.FC = () => {
  const [activeCert, setActiveCert] = useState<string | null>(null);

  return (
    <section id="about" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-green tracking-widest font-semibold flex items-center gap-1.5">
            <span>{"[01 // DOSSIER]"}</span>
            <span className="text-white/30">{"•"}</span>
            <span>BACKGROUND &amp; CREDENTIALS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            OPERATOR PROFILE &amp; EXPERIENCE
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Bio & Academic Dossier */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operator ID Card */}
          <div className="cyber-card p-6 rounded-xl relative overflow-hidden border border-cyber-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-green/20 via-cyber-card to-neon-cyan/20 border border-neon-green/50 flex items-center justify-center text-2xl font-bold text-neon-green shadow-glowGreen">
                  ⚡
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">SUMIT SHARMA</h3>
                  <p className="text-xs text-neon-cyan">Junior Security Analyst</p>
                  <p className="text-[11px] text-cyber-textMuted mt-0.5">Vrindavan, Uttar Pradesh, IN</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neon-green/10 text-neon-green border border-neon-green/30">
                ACTIVE
              </span>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-cyber-textMuted">PRIMARY FOCUS:</span>
                <span className="text-white font-medium">Blue Team / SOC / Cloud</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-textMuted">SECURITY CLEARANCE:</span>
                <span className="text-neon-green font-medium">Verified Operator</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-textMuted">TARGET GRADUATION:</span>
                <span className="text-neon-cyan font-medium">June 2026</span>
              </div>
            </div>
          </div>

          {/* Academic Background */}
          <div className="cyber-card p-6 rounded-xl border border-cyber-border space-y-4">
            <div className="flex items-center gap-2 text-neon-green text-sm font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>EDUCATION &amp; SPECIALIZATION</span>
            </div>

            <div className="space-y-4">
              {PORTFOLIO_DATA.education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-neon-green/40 pl-3 space-y-1">
                  <div className="text-sm font-bold text-white">{edu.institution}</div>
                  <div className="text-xs text-neon-cyan">{edu.degree}</div>
                  <div className="text-[11px] text-cyber-textMuted flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{edu.period}</span>
                    <span>•</span>
                    <span>{edu.location}</span>
                  </div>
                  {edu.courses && (
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      {edu.courses.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded bg-cyber-dark border border-white/5 text-cyber-textLight"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real-World Experience & Industry Certifications */}
        <div className="lg:col-span-7 space-y-6">
          {/* Work Experience */}
          <div className="cyber-card p-6 rounded-xl border border-cyber-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon-cyan text-sm font-bold">
                <Briefcase className="w-4 h-4" />
                <span>ENTERPRISE SECURITY ADMINISTRATION</span>
              </div>
              <span className="text-[10px] text-cyber-textMuted">PRODUCTION DEPLOYMENT</span>
            </div>

            {PORTFOLIO_DATA.experience.map((exp) => (
              <div key={exp.id} className="space-y-3">
                <div>
                  <div className="text-base font-bold text-white flex items-center justify-between">
                    <span>{exp.company}</span>
                    <span className="text-xs font-normal text-neon-green">{exp.period}</span>
                  </div>
                  <div className="text-xs text-neon-cyan flex items-center gap-2 mt-0.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{exp.role}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-cyber-textMuted">{exp.location}</span>
                  </div>
                </div>

                <p className="text-xs text-cyber-textLight leading-relaxed">{exp.description}</p>

                <div className="space-y-2 pt-2">
                  <span className="text-[11px] text-cyber-textMuted font-semibold">
                    KEY OPERATIONAL ACHIEVEMENTS:
                  </span>
                  <ul className="space-y-1.5 text-xs text-cyber-textLight">
                    {exp.achievements.map((ach, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neon-green shrink-0 mt-0.5" />
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {exp.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded bg-cyber-dark border border-neon-cyan/20 text-neon-cyan"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Industry Certifications */}
          <div className="cyber-card p-6 rounded-xl border border-cyber-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon-amber text-sm font-bold">
                <Award className="w-4 h-4" />
                <span>VERIFIED INDUSTRY CERTIFICATIONS</span>
              </div>
              <span className="text-[10px] text-neon-green font-semibold">5 CREDENTIALS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PORTFOLIO_DATA.certifications.map((cert) => (
                <div
                  key={cert.id}
                  onMouseEnter={() => {
                    soundEngine.playCyberBlip(1100);
                    setActiveCert(cert.id);
                  }}
                  onMouseLeave={() => setActiveCert(null)}
                  className={`p-3.5 rounded-lg bg-cyber-dark/80 border transition-all duration-200 flex flex-col justify-between ${
                    activeCert === cert.id
                      ? "border-neon-cyan shadow-glowCyan bg-cyber-dark"
                      : "border-cyber-border hover:border-neon-cyan/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold tracking-wider" style={{ color: cert.badgeColor }}>
                      {cert.issuer}
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-2">{cert.title}</div>
                    <div className="text-[10px] text-cyber-textMuted">{cert.date}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] text-cyber-textMuted truncate max-w-[140px]">
                      ID: {cert.certId}
                    </span>
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => soundEngine.playCyberBlip(900)}
                      className="text-[10px] font-semibold text-neon-cyan hover:text-white flex items-center gap-1"
                    >
                      <span>VERIFY</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
