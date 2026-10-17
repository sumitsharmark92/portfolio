"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Play,
  Trash2,
  ListMusic,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";
import { useJamSync } from "@/context/JamSyncContext";
import { Track } from "@/types/jamsync";

export const GlassQueue: React.FC = () => {
  const {
    queue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
  } = useJamSync();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "queue">("search");
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    setIsSearching(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success && data.results) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchQuery]);

  const handleAdd = (track: Track, playNow = false) => {
    addToQueue(track, playNow);
    setAddedTrackId(track.videoId);
    setTimeout(() => setAddedTrackId(null), 1800);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newQueue = [...queue];
    const item = newQueue.splice(index, 1)[0];
    newQueue.splice(index - 1, 0, item);
    reorderQueue(newQueue);
  };

  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    const item = newQueue.splice(index, 1)[0];
    newQueue.splice(index + 1, 0, item);
    reorderQueue(newQueue);
  };

  const trendingTags = [
    "Lofi Hip Hop",
    "Synthwave Chill",
    "Daft Punk",
    "The Weeknd",
    "Cyberpunk 2077 OST",
    "Gaming EDM",
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col h-full min-h-[500px]">
      {/* Tab Switcher & Search Bar */}
      <div className="space-y-4 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "search"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH MUSIC</span>
            </button>

            <button
              onClick={() => setActiveTab("queue")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "queue"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>ROOM QUEUE</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {queue.length}
              </span>
            </button>
          </div>

          <span className="text-[10px] text-purple-300/80 font-mono hidden sm:inline">
            ZERO API KEY REQUIRED
          </span>
        </div>

        {/* Search Input Box */}
        {activeTab === "search" && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder="Search songs, artists, or paste YouTube URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl glass-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>

            {/* Quick Suggestion Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-1 rounded-xl glass-card text-[11px] text-slate-300 hover:text-white hover:border-purple-500/40 whitespace-nowrap transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2 max-h-[480px]">
        {activeTab === "search" && (
          <>
            {searchResults.length === 0 && !isSearching && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Search className="w-10 h-10 mx-auto text-purple-400/50 stroke-[1.5]" />
                <p className="text-xs">Type song title above or paste any YouTube URL</p>
                <p className="text-[11px] text-slate-500">
                  Search results will stream in real time with audio thumbnails and durations.
                </p>
              </div>
            )}

            {searchResults.map((track) => (
              <div
                key={track.videoId}
                className="flex items-center justify-between p-3 rounded-2xl glass-card border border-white/5 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10 relative">
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                      {track.duration}
                    </span>
                  </div>

                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{track.author}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleAdd(track, true)}
                    className="p-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-semibold transition-all flex items-center gap-1"
                    title="Play Now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline text-[10px]">PLAY</span>
                  </button>

                  <button
                    onClick={() => handleAdd(track, false)}
                    className="p-2 rounded-xl glass-card text-slate-300 hover:text-white border border-white/10 hover:border-pink-500/40 text-xs font-semibold transition-all flex items-center gap-1"
                    title="Add to Queue"
                  >
                    {addedTrackId === track.videoId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline text-[10px]">QUEUE</span>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "queue" && (
          <>
            {queue.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ListMusic className="w-10 h-10 mx-auto text-purple-400/50 stroke-[1.5]" />
                <p className="text-xs">The room queue is empty.</p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="px-4 py-2 rounded-xl glass-button-primary text-xs font-bold text-white mt-2"
                >
                  FIND SONGS TO ADD
                </button>
              </div>
            ) : (
              queue.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 rounded-2xl glass-card border border-white/5 space-x-3 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-5 text-center font-mono text-xs font-bold text-purple-400">
                      {idx + 1}
                    </span>

                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10 relative">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                        {track.duration}
                      </span>
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {track.author} • Added by <span className="text-purple-300">{track.addedBy}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === queue.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromQueue(track.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
