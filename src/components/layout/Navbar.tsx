"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Volume2,
  VolumeX,
  Search,
  Sparkles,
  Menu,
  X,
  Shield,
  Code2,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onToggleMatrix: () => void;
  isMatrixActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onToggleMatrix,
  isMatrixActive,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsMuted(soundEngine.getIsMuted());

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.playCyberBlip(1000);
    }
  };

  const navLinks = [
    { href: "#terminal", label: "./terminal" },
    { href: "#about", label: "./about" },
    { href: "#now", label: "./now" },
    { href: "#skills", label: "./skills" },
    { href: "#projects", label: "./projects" },
    { href: "#playground", label: "./playground" },
    { href: "#guestbook", label: "./guestbook" },
    { href: "#polls", label: "./polls" },
    { href: "#draw", label: "./draw" },
    { href: "#jam", label: "./jam" },
  ];

  const handleLinkClick = () => {
    soundEngine.playCyberBlip(800);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 font-mono ${
        scrolled
          ? "bg-cyber-black/85 backdrop-blur-md border-b border-cyber-border py-2.5 shadow-lg shadow-black/50"
          : "bg-transparent py-4 border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={() => soundEngine.playCyberBlip(1200)}
          className="flex items-center gap-2 group text-sm font-bold tracking-wider"
        >
          <div className="w-8 h-8 rounded border border-neon-green/40 bg-cyber-card flex items-center justify-center group-hover:border-neon-green group-hover:shadow-glowGreen transition-all">
            <Shield className="w-4 h-4 text-neon-green" />
          </div>
          <div className="flex flex-col">
            <span className="text-white group-hover:text-neon-green transition-colors flex items-center gap-1.5">
              SUMIT.LABS
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
            </span>
            <span className="text-[10px] text-cyber-textMuted tracking-tight">SEC-OPS // v3.0</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-cyber-dark/80 border border-cyber-border/70 rounded-full px-3 py-1 backdrop-blur-sm">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className="text-xs text-cyber-textMuted hover:text-neon-green px-2.5 py-1 rounded transition-colors duration-150 hover:bg-neon-green/5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <button
            onClick={() => {
              soundEngine.playCyberBlip(950);
              onOpenCommandPalette();
            }}
            aria-label="Search and command palette"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-cyber-textMuted bg-cyber-card border border-cyber-border hover:border-neon-cyan/50 hover:text-white rounded transition-colors group"
          >
            <Search className="w-3.5 h-3.5 text-neon-cyan group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">CMD</span>
            <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-cyber-dark border border-cyber-border text-cyber-textMuted rounded">
              ⌘K
            </kbd>
          </button>

          {/* Matrix Rain Toggle */}
          <button
            onClick={() => {
              soundEngine.playCyberBlip(1100);
              onToggleMatrix();
            }}
            title="Toggle Matrix Digital Rain"
            className={`p-1.5 rounded border transition-all ${
              isMatrixActive
                ? "bg-neon-green/20 border-neon-green text-neon-green shadow-glowGreen"
                : "bg-cyber-card border-cyber-border text-cyber-textMuted hover:text-neon-green hover:border-neon-green/40"
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? "Sound Muted (Click to enable)" : "Sound Enabled (Click to mute)"}
            className={`p-1.5 rounded border transition-all ${
              !isMuted
                ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-glowCyan"
                : "bg-cyber-card border-cyber-border text-cyber-textMuted hover:text-neon-cyan"
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Quick Terminal Button */}
          <a
            href="#terminal"
            onClick={() => soundEngine.playCyberBlip(750)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-neon-green/10 border border-neon-green/40 hover:border-neon-green text-neon-green hover:bg-neon-green hover:text-cyber-black text-xs font-semibold rounded transition-all duration-200"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI</span>
          </a>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => {
              soundEngine.playCyberBlip(600);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-1.5 bg-cyber-card border border-cyber-border rounded text-cyber-textMuted hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-cyber-dark/95 border-b border-cyber-border px-4 py-4 backdrop-blur-xl mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="text-xs text-cyber-textLight hover:text-neon-green px-3 py-2 rounded bg-cyber-card/60 border border-white/5 hover:border-neon-green/30 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-cyber-textMuted">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-neon-green" />
              STATUS: OPERATIONAL
            </span>
            <a
              href="#terminal"
              onClick={handleLinkClick}
              className="text-neon-green hover:underline flex items-center gap-1"
            >
              LAUNCH TERMINAL →
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
