"use client";

import React, { useEffect, useRef } from "react";

interface MatrixRainCanvasProps {
  isFullOverlay?: boolean;
  opacity?: number;
  onClose?: () => void;
}

export const MatrixRainCanvas: React.FC<MatrixRainCanvasProps> = ({
  isFullOverlay = false,
  opacity = 0.12,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Characters: katakana, numbers, hex, binary
    const chars = "0123456789ABCDEF01010101XYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));

    let lastDrawTime = 0;
    const fpsInterval = 1000 / 30; // 30 FPS for authentic matrix look

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsed = currentTime - lastDrawTime;
      if (elapsed < fpsInterval) return;
      lastDrawTime = currentTime - (elapsed % fpsInterval);

      // Translucent black fade to create trails
      ctx.fillStyle = isFullOverlay ? "rgba(10, 10, 12, 0.08)" : "rgba(10, 10, 12, 0.12)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading char is bright white, trailing is phosphor green
        if (Math.random() > 0.88) {
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00ff66";
        } else {
          ctx.fillStyle = "#00ff66";
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#00ff66";
        }

        ctx.fillText(text, x, y);

        // Reset drop
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFullOverlay]);

  return (
    <div
      className={
        isFullOverlay
          ? "fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto"
          : "fixed inset-0 pointer-events-none z-0 overflow-hidden"
      }
      style={{ opacity: isFullOverlay ? 1 : opacity }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {isFullOverlay && (
        <div className="relative z-10 text-center px-4">
          <div className="inline-block border border-neon-green/40 bg-cyber-card/90 backdrop-blur-md p-6 rounded-lg shadow-glowGreen max-w-md">
            <div className="text-neon-green font-mono text-xl font-bold mb-2 tracking-widest flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 bg-neon-green rounded-full animate-ping"></span>
              MATRIX RAIN PROTOCOL ACTIVE
            </div>
            <p className="text-cyber-textMuted text-xs font-mono mb-4">
              CYBER DECK OVERLAY INITIATED. PRESS ESCAPE OR CLICK DISMISS TO RETURN TO MAIN INTERFACE.
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2 font-mono text-xs font-semibold bg-neon-green text-cyber-black hover:bg-neon-cyan transition-colors rounded shadow-glowGreen"
              >
                [ DISMISS OVERLAY ]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
