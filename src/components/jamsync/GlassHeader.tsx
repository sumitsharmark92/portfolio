"use client";

import React, { useState } from "react";
import {
  Share2,
  Check,
  Users,
  LogOut,
  Crown,
  Sparkles,
  Music,
} from "lucide-react";
import { useJamSync } from "@/context/JamSyncContext";

export const GlassHeader: React.FC = () => {
  const {
    roomId,
    users,
    currentUser,
    isPlaying,
    leaveRoom,
    updateUser,
  } = useJamSync();

  const [copied, setCopied] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(currentUser?.nickname || "");
  const [avatarInput, setAvatarInput] = useState(currentUser?.avatar || "🎧");

  const avatarOptions = ["🎧", "🎵", "👾", "🚀", "✨", "🔥", "🦊", "🐯", "⚡", "💎"];

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/jam/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    updateUser(nicknameInput.trim(), avatarInput);
    setShowProfileModal(false);
  };

  return (
    <header className="sticky top-0 z-40 glass-header px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 shadow-lg shadow-black/40">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
              <Music className="w-4 h-4 text-purple-300" />
            </div>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
              JAMSYNC
              <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-medium">
                LIVE
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span>SYNCED ROOM</span>
              <span className="text-white/40">•</span>
              <span className="text-purple-400 font-bold">#{roomId}</span>
            </p>
          </div>
        </div>

        {/* Live Equalizer Animation */}
        <div className="hidden md:flex items-center gap-1 h-5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <span className={`w-1 rounded-full bg-purple-400 ${isPlaying ? "equalizer-bar-1" : "h-1"}`} />
          <span className={`w-1 rounded-full bg-pink-400 ${isPlaying ? "equalizer-bar-2" : "h-1.5"}`} />
          <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? "equalizer-bar-3" : "h-1"}`} />
          <span className={`w-1 rounded-full bg-amber-400 ${isPlaying ? "equalizer-bar-4" : "h-2"}`} />
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Copy Share Link Button */}
        <button
          onClick={handleCopyLink}
          className="glass-card px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 border border-white/10 hover:border-purple-500/40 transition-all"
          title="Share room link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-mono text-[11px]">COPIED LINK</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline text-[11px]">INVITE</span>
              <span className="font-mono text-xs text-purple-300 font-bold">#{roomId}</span>
            </>
          )}
        </button>

        {/* Connected Users Modal Trigger */}
        <button
          onClick={() => setShowUsersModal(true)}
          className="glass-card px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 border border-white/10 hover:border-cyan-500/40 transition-all"
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-cyan-300">{users.length}</span>
          <span className="hidden sm:inline text-[11px] text-slate-400">ONLINE</span>
        </button>

        {/* Profile Avatar / Nickname Trigger */}
        {currentUser && (
          <button
            onClick={() => {
              setNicknameInput(currentUser.nickname);
              setAvatarInput(currentUser.avatar);
              setShowProfileModal(true);
            }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl glass-card border border-white/10 hover:border-pink-500/40 transition-all"
          >
            <span className="text-base">{currentUser.avatar}</span>
            <span className="hidden md:inline text-xs font-semibold text-slate-200 truncate max-w-[90px]">
              {currentUser.nickname}
            </span>
            {currentUser.isHost && (
              <span title="Room Host">
                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
              </span>
            )}
          </button>
        )}

        {/* Leave Room Button */}
        <button
          onClick={leaveRoom}
          className="p-2 rounded-xl glass-card border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
          title="Leave Room"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Users Dropdown Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm glass-panel p-5 rounded-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">ROOM LISTENERS ({users.length})</h3>
              </div>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl glass-card border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{u.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {u.nickname}
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-purple-400 font-normal">(You)</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.isHost ? "Session Host" : "Listener"}
                      </span>
                    </div>
                  </div>

                  {u.isHost && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                      <Crown className="w-3 h-3" /> HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                EDIT YOUR PROFILE
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
              >
                CANCEL
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1.5">YOUR NICKNAME</label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={25}
                  required
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5">PICK AN AVATAR</label>
                <div className="grid grid-cols-5 gap-2">
                  {avatarOptions.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarInput(av)}
                      className={`text-xl p-2 rounded-xl transition-all ${
                        avatarInput === av
                          ? "bg-purple-600/40 border border-purple-400 scale-110 shadow-lg"
                          : "glass-card hover:bg-white/10 border-transparent"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl glass-button-primary font-bold text-xs text-white"
              >
                SAVE CHANGES
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
