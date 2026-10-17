"use client";

import React, { useState, useEffect } from "react";
import { Vote, CheckCircle, Radio } from "lucide-react";
import { soundEngine } from "@/lib/audio";
import { Poll } from "@/lib/storage";

export const PollsSection: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPolls();
    if (typeof window !== "undefined") {
      const savedVotes = localStorage.getItem("sumit_user_votes");
      if (savedVotes) {
        try {
          setVotedPolls(JSON.parse(savedVotes));
        } catch {}
      }
    }
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls");
      const data = await res.json();
      if (data.success && data.polls) {
        setPolls(data.polls);
      }
    } catch (e) {
      console.error("Failed to fetch polls:", e);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return; // already voted in this poll

    soundEngine.playCyberBlip(1000);

    // Optimistically update
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          totalVotes: p.totalVotes + 1,
          options: p.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
        };
      })
    );

    const updatedVoted = { ...votedPolls, [pollId]: optionId };
    setVotedPolls(updatedVoted);
    if (typeof window !== "undefined") {
      localStorage.setItem("sumit_user_votes", JSON.stringify(updatedVoted));
    }

    try {
      await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId }),
      });
      soundEngine.playSuccessChirp();
    } catch {
      soundEngine.playErrorBuzz();
    }
  };

  return (
    <section id="polls" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-glowCyan">
          <Vote className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-cyan tracking-widest font-semibold flex items-center gap-1.5">
            <span>{"[./POLLS]"}</span>
            <span className="text-white/30">•</span>
            <span>CONSENSUS PROTOCOL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            LIVE CYBERSECURITY CONSENSUS POLLS
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.map((poll) => {
          const hasVoted = Boolean(votedPolls[poll.id]);
          const selectedOption = votedPolls[poll.id];

          return (
            <div
              key={poll.id}
              className="cyber-card p-6 rounded-xl border border-cyber-border hover:border-neon-cyan/40 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-wider">
                  {poll.category}
                </span>
                <span className="text-xs text-neon-green font-semibold">
                  {poll.totalVotes} TOTAL VOTES
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {poll.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {poll.options.map((opt) => {
                  const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  const isUserPick = selectedOption === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !hasVoted && handleVote(poll.id, opt.id)}
                      className={`p-3 rounded-lg border transition-all relative overflow-hidden select-none ${
                        hasVoted
                          ? "bg-cyber-dark border-cyber-border cursor-default"
                          : "bg-cyber-dark/80 border-cyber-border hover:border-neon-cyan/50 hover:bg-cyber-card cursor-pointer"
                      } ${isUserPick ? "border-neon-green shadow-glowGreen" : ""}`}
                    >
                      {/* Fluid Background Bar */}
                      {hasVoted && (
                        <div
                          className={`absolute top-0 bottom-0 left-0 transition-all duration-700 opacity-20 ${
                            isUserPick ? "bg-neon-green" : "bg-neon-cyan"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      )}

                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isUserPick
                                ? "border-neon-green bg-neon-green/20 text-neon-green"
                                : "border-white/20"
                            }`}
                          >
                            {isUserPick && <CheckCircle className="w-3 h-3" />}
                          </span>
                          <span className={isUserPick ? "text-neon-green font-bold" : "text-white"}>
                            {opt.text}
                          </span>
                        </div>

                        {hasVoted && (
                          <div className="text-right shrink-0 ml-3">
                            <span className="text-neon-cyan font-bold">{pct}%</span>
                            <span className="text-[10px] text-cyber-textMuted ml-1">
                              ({opt.votes})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Banner */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-cyber-textMuted">
                {hasVoted ? (
                  <span className="text-neon-green flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> YOUR VOTE HAS BEEN RECORDED
                  </span>
                ) : (
                  <span>Click any option to cast your live vote</span>
                )}
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-neon-cyan animate-pulse" /> LIVE SYNC
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
