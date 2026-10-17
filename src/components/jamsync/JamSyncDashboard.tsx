"use client";

import React, { useState } from "react";
import { GlassHeader } from "./GlassHeader";
import { GlassPlayer } from "./GlassPlayer";
import { GlassQueue } from "./GlassQueue";
import { GlassChat } from "./GlassChat";
import { useJamSync } from "@/context/JamSyncContext";
import { Disc, Search, MessageSquare } from "lucide-react";

export const JamSyncDashboard: React.FC = () => {
  const { queue } = useJamSync();
  const [mobileTab, setMobileTab] = useState<"player" | "queue" | "chat">("player");

  return (
    <div className="min-h-screen flex flex-col bg-[#08070d] text-white relative overflow-hidden select-none">
      {/* Background Ambient Mesh Glowing Orbs */}
      <div className="fixed top-12 left-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Glass Header */}
      <GlassHeader />

      {/* Mobile Tab Navigator */}
      <div className="lg:hidden px-4 pt-3 pb-1">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 glass-panel">
          <button
            onClick={() => setMobileTab("player")}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "player"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>PLAYER</span>
          </button>

          <button
            onClick={() => setMobileTab("queue")}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "queue"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>QUEUE</span>
            {queue.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {queue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileTab("chat")}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "chat"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>CHAT</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Desktop 3-Column Glass Grid */}
        <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
          {/* Left Column: Synchronized Glass Player */}
          <div className="col-span-5 sticky top-24">
            <GlassPlayer />
          </div>

          {/* Center Column: Search & Queue Manager */}
          <div className="col-span-4">
            <GlassQueue />
          </div>

          {/* Right Column: Real-Time Chat & Media Stream */}
          <div className="col-span-3">
            <GlassChat />
          </div>
        </div>

        {/* Mobile View with active tab */}
        <div className="lg:hidden">
          {mobileTab === "player" && <GlassPlayer />}
          {mobileTab === "queue" && <GlassQueue />}
          {mobileTab === "chat" && <GlassChat />}
        </div>
      </main>
    </div>
  );
};
