"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Palette,
  Download,
  RotateCcw,
  Eraser,
  PenTool,
  Shield,
  Radio,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";

export const DrawSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "glow" | "eraser" | "stamp">("pen");
  const [stampType, setStampType] = useState<"FW" | "SRV" | "CLOUD" | "DB">("FW");
  const [color, setColor] = useState<string>("#00ff66");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [strokesHistory, setStrokesHistory] = useState<ImageData[]>([]);
  const [peerCursors, setPeerCursors] = useState<{ id: string; name: string; x: number; y: number; color: string }[]>([
    { id: "p1", name: "Agent_Specter", x: 140, y: 120, color: "#00f0ff" },
    { id: "p2", name: "ZeroDay_Hunter", x: 380, y: 190, color: "#ffb703" },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Initial background
    ctx.fillStyle = "#0c0c10";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Initial cyber grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Save blank state
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokesHistory([initialData]);

    // Simulated peer cursor movement
    const peerTimer = setInterval(() => {
      setPeerCursors((prev) =>
        prev.map((p) => ({
          ...p,
          x: Math.min(rect.width - 40, Math.max(30, p.x + (Math.random() - 0.5) * 30)),
          y: Math.min(rect.height - 40, Math.max(30, p.y + (Math.random() - 0.5) * 30)),
        }))
      );
    }, 1500);

    return () => clearInterval(peerTimer);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    soundEngine.playKeyClick();
    const { x, y } = getCoordinates(e);

    if (tool === "stamp") {
      drawStamp(ctx, x, y, stampType);
      saveState();
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === "eraser") {
      ctx.strokeStyle = "#0c0c10";
      ctx.lineWidth = brushSize * 4;
      ctx.shadowBlur = 0;
    } else if (tool === "glow") {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize * 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.shadowBlur = 3;
      ctx.shadowColor = color;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === "stamp") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
    ctx.save();
    ctx.fillStyle = "#161622";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;

    // Draw node box
    ctx.fillRect(x - 35, y - 20, 70, 40);
    ctx.strokeRect(x - 35, y - 20, 70, 40);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`[${type}]`, x, y);
    ctx.restore();
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokesHistory((prev) => [...prev.slice(-10), data]);
  };

  const undo = () => {
    if (strokesHistory.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    soundEngine.playCyberBlip(700);
    const newHistory = [...strokesHistory];
    newHistory.pop();
    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setStrokesHistory(newHistory);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    soundEngine.playCyberBlip(600);
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0c0c10";
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundEngine.playSuccessChirp();
    const link = document.createElement("a");
    link.download = `threat-diagram-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const colorPalette = ["#00ff66", "#00f0ff", "#ffb703", "#ff2a5f", "#9d4edd", "#ffffff"];

  return (
    <section id="draw" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-glowCyan">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-cyan tracking-widest font-semibold flex items-center gap-1.5">
            <span>{"[./DRAW]"}</span>
            <span className="text-white/30">•</span>
            <span>COLLABORATIVE WHITEBOARD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            MULTI-USER THREAT DIAGRAMMING CANVAS
          </h2>
        </div>
      </div>

      <div className="cyber-card p-4 sm:p-6 rounded-xl border border-cyber-border space-y-4">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          {/* Tools */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                soundEngine.playCyberBlip(800);
                setTool("pen");
              }}
              className={`p-2 rounded text-xs flex items-center gap-1 transition-colors ${
                tool === "pen"
                  ? "bg-neon-green text-cyber-black font-bold"
                  : "bg-cyber-dark text-cyber-textMuted hover:text-white border border-cyber-border"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PEN</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playCyberBlip(900);
                setTool("glow");
              }}
              className={`p-2 rounded text-xs flex items-center gap-1 transition-colors ${
                tool === "glow"
                  ? "bg-neon-cyan text-cyber-black font-bold"
                  : "bg-cyber-dark text-cyber-textMuted hover:text-white border border-cyber-border"
              }`}
            >
              <span>GLOW</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playCyberBlip(700);
                setTool("eraser");
              }}
              className={`p-2 rounded text-xs flex items-center gap-1 transition-colors ${
                tool === "eraser"
                  ? "bg-neon-red text-white font-bold"
                  : "bg-cyber-dark text-cyber-textMuted hover:text-white border border-cyber-border"
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ERASER</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playCyberBlip(1000);
                setTool("stamp");
              }}
              className={`p-2 rounded text-xs flex items-center gap-1 transition-colors ${
                tool === "stamp"
                  ? "bg-neon-amber text-cyber-black font-bold"
                  : "bg-cyber-dark text-cyber-textMuted hover:text-white border border-cyber-border"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">THREAT STAMP</span>
            </button>

            {tool === "stamp" && (
              <div className="flex items-center gap-1 ml-1 bg-cyber-dark p-1 rounded border border-cyber-border">
                {(["FW", "SRV", "CLOUD", "DB"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStampType(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stampType === st ? "bg-neon-amber text-black" : "text-cyber-textMuted hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            {/* Brush Size Selector */}
            <div className="flex items-center gap-1 ml-2 bg-cyber-dark px-2 py-1 rounded border border-cyber-border text-[10px] text-cyber-textMuted">
              <span>SIZE:</span>
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`px-1.5 py-0.5 rounded ${brushSize === s ? "bg-neon-green text-black font-bold" : "hover:text-white"}`}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {colorPalette.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    color === c ? "scale-125 border-white shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={undo}
                title="Undo last action"
                className="p-1.5 bg-cyber-dark border border-cyber-border rounded text-cyber-textMuted hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={clearCanvas}
                className="px-2.5 py-1.5 bg-cyber-dark border border-cyber-border rounded text-xs text-cyber-textMuted hover:text-neon-red"
              >
                CLEAR
              </button>
              <button
                onClick={exportCanvas}
                className="px-3 py-1.5 bg-neon-green text-cyber-black font-bold rounded text-xs flex items-center gap-1 hover:bg-neon-cyan transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">EXPORT PNG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Peer Telemetry Bar */}
        <div className="flex items-center justify-between text-xs text-cyber-textMuted px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-neon-green animate-pulse" />
            <span>SYNC PROTOCOL ACTIVE // 3 OPERATORS CONNECTED</span>
          </div>
          <div className="flex items-center gap-3">
            {peerCursors.map((p) => (
              <span key={p.id} className="text-[10px] flex items-center gap-1" style={{ color: p.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Canvas Workspace with Simulated Live Peers */}
        <div className="relative rounded-lg overflow-hidden border border-cyber-border bg-[#0c0c10] cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-[400px] block"
          />

          {/* Render Active Peer Cursors */}
          {peerCursors.map((peer) => (
            <div
              key={peer.id}
              className="absolute pointer-events-none transition-all duration-700 ease-out flex items-center gap-1"
              style={{
                left: `${peer.x}px`,
                top: `${peer.y}px`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full border border-black animate-ping opacity-60"
                style={{ backgroundColor: peer.color }}
              />
              <span
                className="text-[9px] px-1.5 py-0.5 rounded bg-black/80 font-mono font-bold border border-white/10"
                style={{ color: peer.color }}
              >
                {peer.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
