"use client";

import React, { useState, useEffect, useRef } from "react";
import { Music, Play, Square, Radio, Sparkles } from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface PadItem {
  id: string;
  name: string;
  note: string;
  freq: number;
  type: OscillatorType;
  color: string;
  keyHint: string;
}

export const JamAudioSection: React.FC = () => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [isSequencerRunning, setIsSequencerRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pads: PadItem[] = [
    { id: "p-1", name: "Sub Kick", note: "55Hz", freq: 55, type: "sine", color: "#ff2a5f", keyHint: "1" },
    { id: "p-2", name: "Cyber Snare", note: "180Hz", freq: 180, type: "triangle", color: "#ffb703", keyHint: "2" },
    { id: "p-3", name: "Neon Hi-Hat", note: "8kHz", freq: 1400, type: "square", color: "#00ff66", keyHint: "3" },
    { id: "p-4", name: "Lead Synth", note: "440Hz", freq: 440, type: "sawtooth", color: "#00f0ff", keyHint: "4" },
    { id: "p-5", name: "Arp Chime", note: "880Hz", freq: 880, type: "sine", color: "#9d4edd", keyHint: "Q" },
    { id: "p-6", name: "Deep Bass", note: "65Hz", freq: 65, type: "sawtooth", color: "#ff2a5f", keyHint: "W" },
    { id: "p-7", name: "Alarm Pulse", note: "700Hz", freq: 700, type: "sawtooth", color: "#ffb703", keyHint: "E" },
    { id: "p-8", name: "Data Ping", note: "1320Hz", freq: 1320, type: "sine", color: "#00ff66", keyHint: "R" },
  ];

  // Animated visualizer wave
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
      const height = (canvas.height = 70);

      ctx.fillStyle = "#0c0c10";
      ctx.fillRect(0, 0, width, height);

      // Draw cyber waveform
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isAmbientPlaying || isSequencerRunning ? "#00ff66" : "rgba(0, 240, 255, 0.4)";

      const amplitude = isAmbientPlaying ? 22 : isSequencerRunning ? 16 : 5;
      const frequency = 0.04;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * frequency + phase) * amplitude * Math.sin(x * 0.01);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isAmbientPlaying || isSequencerRunning ? 0.08 : 0.02;
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isAmbientPlaying, isSequencerRunning]);

  // Step Sequencer Looper
  useEffect(() => {
    if (!isSequencerRunning) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % 4;
        // Trigger beats on step
        if (next === 0) soundEngine.playNote(55, "sine", 0.2); // Kick
        if (next === 1) soundEngine.playNote(1400, "square", 0.05); // Hat
        if (next === 2) soundEngine.playNote(180, "triangle", 0.15); // Snare
        if (next === 3) soundEngine.playNote(440, "sawtooth", 0.15); // Lead
        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isSequencerRunning]);

  const triggerPad = (pad: PadItem) => {
    setActivePad(pad.id);
    soundEngine.playNote(pad.freq, pad.type, 0.35);
    setTimeout(() => setActivePad(null), 200);
  };

  const toggleAmbient = () => {
    const isPlaying = soundEngine.toggleAmbient();
    setIsAmbientPlaying(isPlaying);
  };

  return (
    <section id="jam" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-purple/40 flex items-center justify-center text-neon-purple shadow-glowGreen">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-purple tracking-widest font-semibold flex items-center gap-1.5">
            <span>[./JAM]</span>
            <span className="text-white/30">•</span>
            <span>ACOUSTIC SYNTHESIZER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            CYBERPUNK AMBIENT SOUNDBOARD &amp; DRONE
          </h2>
        </div>
      </div>

      <div className="cyber-card p-6 rounded-xl border border-cyber-border space-y-6">
        {/* Controls & Visualizer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleAmbient}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  isAmbientPlaying
                    ? "bg-neon-green text-cyber-black shadow-glowGreen"
                    : "bg-cyber-dark border border-cyber-border text-white hover:border-neon-green/40"
                }`}
              >
                {isAmbientPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isAmbientPlaying ? "HALT AMBIENT DRONE" : "START CYBER AMBIENT DRONE"}</span>
              </button>

              <button
                onClick={() => setIsSequencerRunning(!isSequencerRunning)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  isSequencerRunning
                    ? "bg-neon-cyan text-cyber-black shadow-glowCyan"
                    : "bg-cyber-dark border border-cyber-border text-white hover:border-neon-cyan/40"
                }`}
              >
                {isSequencerRunning ? <Square className="w-4 h-4 fill-current" /> : <Sparkles className="w-4 h-4" />}
                <span>{isSequencerRunning ? "STOP SEQUENCER" : "START 120BPM LOOP"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-cyber-textMuted">
              <Radio className="w-3.5 h-3.5 text-neon-green animate-pulse" />
              <span>NATIVE WEB AUDIO API SYNTHESIZER (0 EXTERNAL AUDIO ASSETS)</span>
            </div>
          </div>

          {/* Real-Time Audio Canvas Waveform */}
          <div className="md:col-span-7 bg-cyber-dark p-3 rounded-lg border border-cyber-border">
            <div className="flex items-center justify-between text-[10px] text-cyber-textMuted mb-1">
              <span>FREQUENCY SPECTRUM OSCILLOSCOPE</span>
              <span className="text-neon-cyan">
                {isAmbientPlaying ? "55Hz LOW-PASS DRONE" : isSequencerRunning ? `STEP: 0${currentStep + 1} / 04` : "STANDBY"}
              </span>
            </div>
            <canvas ref={canvasRef} className="w-full h-[65px] block rounded" />
          </div>
        </div>

        {/* 8-Pad Rhythm Grid */}
        <div>
          <div className="text-xs text-cyber-textMuted uppercase tracking-wider mb-3">
            INTERACTIVE SYNTHESIS PADS (CLICK TO TRIGGER):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pads.map((pad) => (
              <button
                key={pad.id}
                onClick={() => triggerPad(pad)}
                className={`p-5 rounded-xl border text-left transition-all duration-100 flex flex-col justify-between relative overflow-hidden group ${
                  activePad === pad.id
                    ? "scale-95 bg-cyber-card border-white shadow-2xl"
                    : "bg-cyber-dark/90 border-cyber-border hover:border-white/30 hover:bg-cyber-card"
                }`}
                style={{
                  boxShadow: activePad === pad.id ? `0 0 25px ${pad.color}` : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyber-textMuted">[{pad.keyHint}]</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: pad.color }}
                  />
                </div>

                <div className="mt-4">
                  <div className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">
                    {pad.name}
                  </div>
                  <div className="text-[11px] text-cyber-textMuted font-mono">{pad.note}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Launch Full JamSync Collaborative App */}
        <div className="mt-8 p-4 rounded-xl border border-neon-cyan/30 bg-gradient-to-r from-neon-cyan/10 via-cyber-card to-neon-purple/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan text-xl">
              🎧
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>JamSync Collaborative Music Room</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">NEW</span>
              </div>
              <div className="text-xs text-cyber-textMuted">
                Synchronized YouTube listening rooms, zero API keys required, and live room chat
              </div>
            </div>
          </div>
          <a
            href="/jam"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50 text-neon-cyan font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-glowCyan"
          >
            <span>Enter JamSync</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
};
