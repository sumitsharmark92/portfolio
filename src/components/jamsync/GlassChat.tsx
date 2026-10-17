"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Smile,
  X,
} from "lucide-react";
import { useJamSync } from "@/context/JamSyncContext";

export const GlassChat: React.FC = () => {
  const { messages, currentUser, sendChatMessage } = useJamSync();

  const [inputText, setInputText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !mediaUrl.trim()) return;

    sendChatMessage(inputText.trim(), mediaUrl.trim() || undefined);
    setInputText("");
    setMediaUrl("");
    setShowMediaInput(false);
    setShowEmojiPicker(false);
  };

  const emojis = ["🔥", "❤️", "⚡", "🎉", "💃", "🙌", "🤯", "💯", "🎶", "👏"];

  return (
    <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col h-full min-h-[500px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              ROOM CHAT &amp; ACTIVITY
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">REAL-TIME MEDIA STREAM</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          CONNECTED
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3 max-h-[420px] text-xs">
        {messages.map((m) => {
          if (m.isSystem) {
            return (
              <div
                key={m.id}
                className="py-1.5 px-3 rounded-xl bg-white/[0.03] border border-white/5 text-center text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2"
              >
                <span>{m.sender.avatar}</span>
                <span className="text-slate-300">{m.text}</span>
              </div>
            );
          }

          const isMe = m.sender.id === currentUser?.id;

          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm shrink-0">
                  {m.sender.avatar}
                </div>
              )}

              <div className={`max-w-[85%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`flex items-center gap-1.5 text-[10px] text-slate-400 font-mono ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <span className={isMe ? "text-purple-300 font-bold" : "text-white font-medium"}>
                    {m.sender.nickname}
                  </span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl leading-relaxed text-xs break-words ${
                    isMe
                      ? "bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-medium rounded-tr-none shadow-md shadow-purple-900/30"
                      : "glass-card text-slate-200 border border-white/10 rounded-tl-none"
                  }`}
                >
                  {m.text && <p>{m.text}</p>}

                  {/* Inline Image/GIF Media Attachment */}
                  {m.mediaUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/20 max-h-48">
                      <img
                        src={m.mediaUrl}
                        alt="Shared media"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Attachment URL Preview */}
      {showMediaInput && (
        <div className="p-2.5 mb-2 rounded-xl glass-card border border-pink-500/30 flex items-center gap-2 animate-in fade-in duration-150">
          <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
          <input
            type="url"
            placeholder="Paste image or GIF URL (e.g. https://...)..."
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => {
              setShowMediaInput(false);
              setMediaUrl("");
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Emoji Picker Strip */}
      {showEmojiPicker && (
        <div className="flex items-center gap-1.5 p-2 mb-2 rounded-xl glass-card border border-white/10 overflow-x-auto no-scrollbar animate-in fade-in duration-150">
          {emojis.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + em);
                setShowEmojiPicker(false);
              }}
              className="text-base p-1 hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2">
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder="Type a message or react..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full pl-3.5 pr-16 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400 focus:outline-none"
          />

          <div className="absolute right-2 flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:text-white transition-colors"
              title="Add Emoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className="p-1 hover:text-white transition-colors"
              title="Attach Image/GIF URL"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() && !mediaUrl.trim()}
          className="p-2.5 rounded-xl glass-button-primary text-white disabled:opacity-40 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
