"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Disc,
  Tv,
  X,
  Sparkles,
} from "lucide-react";
import { useJamSync } from "@/context/JamSyncContext";

export const GlassPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    users,
    voteSkips,
    playMusic,
    pauseMusic,
    seekMusic,
    nextTrack,
    voteSkip,
    setVolumeLevel,
    toggleMute,
  } = useJamSync();

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekVal(val);
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    if (isSeeking) {
      seekMusic(seekVal);
      setIsSeeking(false);
    }
  };

  const effectiveTime = isSeeking ? seekVal : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (effectiveTime / duration) * 100) : 0;

  const totalUsers = Math.max(1, users.length);
  const requiredSkips = Math.ceil(totalUsers / 2);
  const skipVotesCount = voteSkips.length;

  return (
    <div className="relative glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between">
      {/* Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Sync status & Video preview toggle */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-emerald-300">
            AUDIO SYNC ACTIVE
          </span>
        </div>

        {currentTrack && (
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card text-xs text-slate-300 hover:text-white hover:border-purple-500/40 transition-colors"
          >
            <Tv className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px]">WATCH VIDEO</span>
          </button>
        )}
      </div>

      {/* Main Track Display */}
      <div className="relative z-10 my-6 sm:my-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {/* Album Artwork / Vinyl Disc */}
        <div className="relative group shrink-0">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden glass-card p-1.5 shadow-2xl shadow-purple-900/30 border border-white/15">
            {currentTrack ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className={`w-full h-full object-cover rounded-xl transition-transform duration-500 ${
                  isPlaying ? "scale-105" : "scale-100"
                }`}
              />
            ) : (
              <div className="w-full h-full bg-slate-900/70 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-2">
                <Disc className="w-12 h-12 stroke-[1.5]" />
                <span className="text-[10px] font-mono">QUEUE EMPTY</span>
              </div>
            )}
          </div>

          {isPlaying && (
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg animate-spin" style={{ animationDuration: "6s" }}>
              <Disc className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Track Metadata Info */}
        <div className="flex-1 text-center sm:text-left overflow-hidden w-full">
          {currentTrack ? (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono">
                <span>ADDED BY</span>
                <span className="font-bold text-white">{currentTrack.addedBy}</span>
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight line-clamp-2 leading-snug">
                {currentTrack.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {currentTrack.author}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-300">
                Nothing Playing Right Now
              </h2>
              <p className="text-xs text-slate-400">
                Search for any song in the search bar or pick a trending track from below to start jamming!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scrubbing Timeline */}
      <div className="relative z-10 space-y-2">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={effectiveTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            disabled={!currentTrack}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-all hover:h-2"
          />
          <div
            className="absolute top-0 left-0 h-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 pointer-events-none transition-all group-hover:h-2"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(effectiveTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="relative z-10 pt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl glass-card text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-purple-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolumeLevel(parseInt(e.target.value, 10))}
            className="w-20 sm:w-28 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Center: Playback Buttons */}
        <div className="flex items-center gap-3">
          {/* Main Play / Pause Button */}
          <button
            onClick={isPlaying ? pauseMusic : playMusic}
            disabled={!currentTrack}
            className="w-14 h-14 rounded-2xl glass-button-primary flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip / Next Button */}
          <button
            onClick={nextTrack}
            disabled={!currentTrack}
            className="p-3.5 rounded-2xl glass-card border border-white/10 text-slate-200 hover:text-white hover:border-purple-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Right: Vote Skip */}
        <div className="flex items-center gap-2">
          <button
            onClick={voteSkip}
            disabled={!currentTrack}
            className="glass-card px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-pink-500/40 transition-all flex items-center gap-1.5 disabled:opacity-40"
            title="Vote to skip current track"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>VOTE SKIP</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
              {skipVotesCount}/{requiredSkips}
            </span>
          </button>
        </div>
      </div>

      {/* Optional Video Modal Popup */}
      {showVideoModal && currentTrack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel rounded-2xl overflow-hidden border border-white/15">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/60">
              <h4 className="text-xs font-bold text-white truncate max-w-md">
                {currentTrack.title}
              </h4>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1&controls=1&enablejsapi=1`}
                title={currentTrack.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
