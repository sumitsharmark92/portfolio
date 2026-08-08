"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import { useUIStore } from "@/store/ui";

/* ═══════════════════════════════════════════════════════════
   Loading Screen — Full-viewport overlay with progress bar
   ═══════════════════════════════════════════════════════════ */

export default function LoadingScreen() {
  const isLoading = useUIStore((s) => s.isLoading);
  const progress = useUIStore((s) => s.loadingProgress);
  const loadingText = useUIStore((s) => s.loadingText);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center"
        >
          {/* Decorative glow */}
          <div className="absolute w-64 h-64 rounded-full bg-gold/5 animate-glow" />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <Crown className="w-8 h-8 text-gold" strokeWidth={1.5} />
            <span className="font-serif text-2xl tracking-wider text-gradient-gold">
              RESPLENDENCE
            </span>
          </motion.div>

          {/* Progress Bar */}
          <div className="w-48 h-[2px] bg-obsidian-lighter rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-gold to-gold-deep rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Loading Text */}
          <p className="text-xs text-ivory-muted/50 tracking-widest uppercase">
            {loadingText}
          </p>
          <p className="text-xs text-gold/40 mt-1">{Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
