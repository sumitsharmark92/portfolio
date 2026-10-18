"use client";

import React, { useState } from "react";
import {
  Music,
  Plus,
  ArrowRight,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import { useJamSync } from "@/context/JamSyncContext";

interface RoomJoinModalProps {
  initialRoomId?: string;
}

export const RoomJoinModal: React.FC<RoomJoinModalProps> = ({ initialRoomId }) => {
  const { joinRoom, unlockAudio } = useJamSync();

  const [mode, setMode] = useState<"choose" | "join">("choose");
  const [roomCode, setRoomCode] = useState(initialRoomId || "");
  const [nickname, setNickname] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("jamsync_nickname")) || `Viber_${Math.floor(100 + Math.random() * 900)}`
  );
  const [avatar, setAvatar] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("jamsync_avatar")) || "🎧"
  );

  const avatars = ["🎧", "🎵", "👾", "🚀", "✨", "🔥", "🦊", "🐯", "⚡", "💎"];

  const handleCreateRoom = () => {
    // Explicit user interaction unlocks Web Audio & YouTube IFrame API
    unlockAudio();
    // Generate random 4-digit room code
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    joinRoom(generated, nickname, avatar);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/jam/${generated}`);
    }
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    const cleanCode = roomCode.trim();
    if (!cleanCode) return;
    joinRoom(cleanCode, nickname, avatar);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/jam/${cleanCode}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glass Modal Card */}
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-0.5 mx-auto shadow-2xl shadow-purple-500/40 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            JAMSYNC
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Real-time collaborative music listening with synchronized playback, zero API keys, and glassmorphic UI.
          </p>
        </div>

        {/* Profile Customizer */}
        <div className="space-y-3 p-4 rounded-2xl glass-card border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              YOUR LISTENER IDENTITY
            </span>
            <span className="text-[10px] text-purple-400 font-mono">STEP 1</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">NICKNAME</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={25}
              placeholder="e.g. NeonGroove"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">AVATAR</label>
            <div className="grid grid-cols-5 gap-1.5">
              {avatars.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`text-lg p-2 rounded-xl transition-all ${
                    avatar === av
                      ? "bg-purple-600/40 border border-purple-400 scale-110 shadow-lg shadow-purple-900/50"
                      : "glass-card hover:bg-white/10 border-transparent"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Choice: Create or Join */}
        {mode === "choose" && (
          <div className="space-y-3 pt-1">
            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 rounded-2xl glass-button-primary font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>START A NEW JAM ROOM</span>
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full py-3 rounded-2xl glass-card border border-white/10 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:border-purple-500/40 transition-colors flex items-center justify-center gap-2"
            >
              <span>JOIN WITH 4-DIGIT CODE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Join by Code Form */}
        {mode === "join" && (
          <form onSubmit={handleJoinExisting} className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">ENTER 4-DIGIT ROOM CODE</label>
              <input
                type="text"
                placeholder="e.g. 7842"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                autoFocus
                maxLength={8}
                className="w-full px-4 py-3 rounded-2xl glass-input text-center text-lg sm:text-xl font-mono tracking-widest text-white focus:outline-none uppercase font-bold"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="flex-1 py-3 rounded-2xl glass-button-primary font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span>ENTER ROOM</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMode("choose")}
                className="px-4 py-3 rounded-2xl glass-card border border-white/10 text-xs text-slate-400 hover:text-white"
              >
                BACK
              </button>
            </div>
          </form>
        )}

        {/* Feature Highlights */}
        <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 font-mono">
          <div className="flex flex-col items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>SYNC AUDIO</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>NO API KEYS</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>REAL-TIME</span>
          </div>
        </div>
      </div>
    </div>
  );
};
