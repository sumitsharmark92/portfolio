"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, RotateCcw } from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface KernelPanicModalProps {
  isOpen: boolean;
  onRecover: () => void;
}

export const KernelPanicModal: React.FC<KernelPanicModalProps> = ({
  isOpen,
  onRecover,
}) => {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(6);
      return;
    }

    soundEngine.playAlarmSound();
    const soundInterval = setInterval(() => {
      soundEngine.playAlarmSound();
    }, 1500);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(soundInterval);
          soundEngine.playSuccessChirp();
          onRecover();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(soundInterval);
    };
  }, [isOpen, onRecover]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 font-mono select-none overflow-hidden animate-pulse">
      {/* Glitch Overlay */}
      <div className="absolute inset-0 bg-red-950/20 pointer-events-none mix-blend-color-burn"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-black pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl w-full border-2 border-neon-red bg-cyber-void/95 p-6 rounded-lg shadow-glowRed text-left">
        {/* Header Alert */}
        <div className="flex items-center gap-3 border-b border-neon-red/40 pb-4 mb-4">
          <ShieldAlert className="w-8 h-8 text-neon-red animate-bounce" />
          <div>
            <h2 className="text-neon-red text-lg font-bold tracking-widest flex items-center gap-2">
              [CRITICAL ERROR] KERNEL PANIC // ROOT COMPROMISE ATTEMPT
            </h2>
            <p className="text-xs text-red-400/80">SECURITY ENCLAVE LOCKDOWN ENGAGED</p>
          </div>
        </div>

        {/* Panic Log Stack Dump */}
        <div className="bg-black/90 border border-red-900/60 p-4 rounded text-xs text-red-400 space-y-1 overflow-x-auto max-h-60 mb-6 font-mono leading-relaxed">
          <p className="text-neon-red font-bold">&gt;&gt; DETECTED MALICIOUS CALL: sudo rm -rf /</p>
          <p>[ 0.004121] Kernel panic - not syncing: Attempted to kill init! exitcode=0x0000000b</p>
          <p>[ 0.004128] CPU: 0 PID: 1 Comm: rm Tainted: G        W  O  (6.8.0-45-generic)</p>
          <p>[ 0.004134] Hardware Enclave: SUMIT_LABS_SECURE_BOOT tripped</p>
          <p>[ 0.004140] Call Trace:</p>
          <p className="pl-4 text-red-500/80">&lt;TASK&gt; dump_stack_lvl+0x48/0x70</p>
          <p className="pl-4 text-red-500/80">panic+0x345/0x390</p>
          <p className="pl-4 text-red-500/80">do_exit+0x8a1/0x910</p>
          <p className="pl-4 text-red-500/80">sys_unlinkat+0x3f/0x70</p>
          <p className="pl-4 text-red-500/80">&lt;/TASK&gt;</p>
          <p className="text-yellow-400 pt-2">
            [+] Automated Snapshot Rollback initiated. Restoring sandbox integrity...
          </p>
        </div>

        {/* Recovery Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-white">
            <AlertTriangle className="w-4 h-4 text-yellow-400 animate-spin" />
            <span>Automatic system recovery in:</span>
            <span className="text-neon-red font-bold text-base px-2 py-0.5 rounded bg-red-950 border border-red-700">
              {countdown}s
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playSuccessChirp();
              onRecover();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-neon-red hover:bg-red-600 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-glowRed"
          >
            <RotateCcw className="w-4 h-4" />
            OVERRIDE &amp; RESTORE NOW
          </button>
        </div>
      </div>
    </div>
  );
};
