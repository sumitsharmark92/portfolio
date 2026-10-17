"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Radio,
  CheckCircle,
  Volume2,
  VolumeX,
  KeyRound,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";

export const StatusBar: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [latency, setLatency] = useState(24);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(soundEngine.getIsMuted());

    // Live uptime ticker
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Subtle realistic latency fluctuation
    const pingTimer = setInterval(() => {
      setLatency(Math.floor(18 + Math.random() * 12));
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(pingTimer);
    };
  }, []);

  // Format uptime into DD:HH:MM:SS
  const formatUptime = (totalSec: number) => {
    const baseOffset = 14 * 86400 + 8 * 3600 + 32 * 60; // 14 days base
    const current = baseOffset + totalSec;
    const days = Math.floor(current / 86400);
    const hours = Math.floor((current % 86400) / 3600);
    const minutes = Math.floor((current % 3600) / 60);
    const secs = current % 60;
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) soundEngine.playCyberBlip(1000);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-cyber-void/90 border-t border-cyber-border/80 backdrop-blur-md px-3 py-1.5 font-mono text-[11px] text-cyber-textMuted select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1 gap-x-4">
        {/* Left: Uptime & Latency */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyber-textLight">
            <Clock className="w-3.5 h-3.5 text-neon-green" />
            <span className="hidden sm:inline text-cyber-textMuted">UPTIME:</span>
            <span className="text-neon-green font-semibold">{formatUptime(seconds)}</span>
          </div>

          <div className="hidden xs:flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-neon-cyan animate-pulse" />
            <span>RTT:</span>
            <span className="text-neon-cyan">{latency}ms</span>
          </div>
        </div>

        {/* Center: Geolocation & Availability Status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1">
            <MapPin className="w-3 h-3 text-neon-amber" />
            <span>VRINDAVAN, IN</span>
            <span className="text-[9px] text-white/30">[27.58°N, 77.70°E]</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green">
            <CheckCircle className="w-3 h-3" />
            <span className="font-medium tracking-tight">AVAILABLE FOR CYBERSECURITY INTERNSHIPS</span>
          </div>
        </div>

        {/* Right: Sound & CTF Flag Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1 text-cyber-textMuted hover:text-white transition-colors"
            title="Toggle Mechanical Keystroke and Cyber SFX"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3 h-3 text-neon-red" />
                <span className="hidden sm:inline">SFX: MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-neon-cyan" />
                <span className="hidden sm:inline text-neon-cyan">SFX: ACTIVE</span>
              </>
            )}
          </button>

          <div
            onClick={() => {
              soundEngine.playCyberBlip(1200);
              console.log("%c[FLAG INSPECTION]%c You're looking in the right place! FLAG{s3cur1ty_f1rst_sumit_labs}", "color: #00ff66; font-weight: bold; font-size: 14px", "color: #00f0ff;");
            }}
            className="cursor-pointer flex items-center gap-1 text-[10px] text-neon-amber/70 hover:text-neon-amber transition-colors"
            title="Click to check DevTools console!"
          >
            <KeyRound className="w-3 h-3 text-neon-amber" />
            <span className="hidden sm:inline">CTF: F12</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
