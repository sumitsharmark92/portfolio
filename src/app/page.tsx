"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { MatrixRainCanvas } from "@/components/layout/MatrixRainCanvas";
import { HeroSection } from "@/components/hero/HeroSection";
import { AboutSection } from "@/components/about/AboutSection";
import { NowSection } from "@/components/about/NowSection";
import { SkillsMatrix } from "@/components/skills/SkillsMatrix";
import { ProjectsSection } from "@/components/projects/ProjectsSection";
import { PortScanner } from "@/components/playground/PortScanner";
import { GuestbookSection } from "@/components/miniapps/GuestbookSection";
import { PollsSection } from "@/components/miniapps/PollsSection";
import { DrawSection } from "@/components/miniapps/DrawSection";
import { JamAudioSection } from "@/components/miniapps/JamAudioSection";
import { ContactSection } from "@/components/layout/ContactSection";
import { SumitAIAssistant } from "@/components/ai/SumitAIAssistant";
import { KonamiHandler } from "@/components/eastereggs/KonamiHandler";
import { KernelPanicModal } from "@/components/eastereggs/KernelPanicModal";
import { CtfChallengeModal } from "@/components/eastereggs/CtfChallengeModal";

export default function Home() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMatrixOverlayOpen, setIsMatrixOverlayOpen] = useState(false);
  const [isKernelPanicOpen, setIsKernelPanicOpen] = useState(false);
  const [isCtfOpen, setIsCtfOpen] = useState(false);

  return (
    <main className="min-h-screen bg-cyber-black text-white relative selection:bg-neon-green/30 selection:text-neon-green">
      {/* Background Matrix Rain (Ambient Mode) */}
      <MatrixRainCanvas opacity={0.08} />

      {/* Fullscreen Matrix Overlay (Triggered by command/button) */}
      {isMatrixOverlayOpen && (
        <MatrixRainCanvas
          isFullOverlay={true}
          onClose={() => setIsMatrixOverlayOpen(false)}
        />
      )}

      {/* Cyberpunk Top Navbar */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMatrix={() => setIsMatrixOverlayOpen(!isMatrixOverlayOpen)}
        isMatrixActive={isMatrixOverlayOpen}
      />

      {/* Hero Section & Terminal CLI */}
      <HeroSection
        onTriggerMatrix={() => setIsMatrixOverlayOpen(true)}
        onTriggerPanic={() => setIsKernelPanicOpen(true)}
        onTriggerCtf={() => setIsCtfOpen(true)}
      />

      {/* Operator Profile & Experience (./about) */}
      <AboutSection />

      {/* What I'm Doing Now (./now) */}
      <NowSection />

      {/* Skills Matrix & Capabilities (./skills) */}
      <SkillsMatrix />

      {/* Selected Security Projects (./projects) */}
      <ProjectsSection />

      {/* Interactive Tool Playground (./playground) */}
      <section id="playground" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-cyber-border">
          <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-glowCyan">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <div className="text-xs text-neon-cyan tracking-widest font-semibold flex items-center gap-1.5">
              <span>[./PLAYGROUND]</span>
              <span className="text-white/30">•</span>
              <span>TACTICAL UTILITIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              PORT SCANNER &amp; PACKET ANALYZER
            </h2>
          </div>
        </div>

        <PortScanner />
      </section>

      {/* Collaborative Whiteboard (./draw) */}
      <DrawSection />

      {/* Cyber Soundboard & Drone (./jam) */}
      <JamAudioSection />

      {/* Live Consensus Polls (./polls) */}
      <PollsSection />

      {/* Community Guestbook (./guestbook) */}
      <GuestbookSection />

      {/* Contact Section (./contact) */}
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* Persistent Bottom Status Bar */}
      <StatusBar />

      {/* Floating Sumit.AI Assistant Bot */}
      <SumitAIAssistant />

      {/* Easter Egg: Konami Code Listener */}
      <KonamiHandler onTriggerMatrix={() => setIsMatrixOverlayOpen(true)} />

      {/* Easter Egg: Kernel Panic Simulation Modal */}
      <KernelPanicModal
        isOpen={isKernelPanicOpen}
        onRecover={() => setIsKernelPanicOpen(false)}
      />

      {/* Easter Egg: CTF Challenge Modal */}
      <CtfChallengeModal
        isOpen={isCtfOpen}
        onClose={() => setIsCtfOpen(false)}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onTriggerMatrix={() => setIsMatrixOverlayOpen(true)}
        onTriggerPanic={() => setIsKernelPanicOpen(true)}
        onTriggerCtf={() => setIsCtfOpen(true)}
      />
    </main>
  );
}
