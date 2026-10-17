"use client";

import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Lock,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { soundEngine } from "@/lib/audio";
import { PORTFOLIO_DATA } from "@/lib/portfolioData";

export const ContactSection: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    soundEngine.playKeyClick();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const data = await res.json();
      if (data.success) {
        soundEngine.playSuccessChirp();
        setStatus({
          type: "success",
          text: "Message securely encrypted and dispatched directly to Sumit Sharma.",
        });
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        soundEngine.playErrorBuzz();
        setStatus({ type: "error", text: data.error || "Failed to deliver message." });
      }
    } catch {
      soundEngine.playErrorBuzz();
      setStatus({ type: "error", text: "Transmission error. Please email directly." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(PORTFOLIO_DATA.profile.email);
    soundEngine.playSuccessChirp();
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section id="contact" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10 pb-4 border-b border-cyber-border">
        <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-glowCyan">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neon-cyan tracking-widest font-semibold flex items-center gap-1.5">
            <span>[./CONTACT]</span>
            <span className="text-white/30">•</span>
            <span>SECURE INGRESS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            INITIATE COMMUNICATIONS
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info & Channels */}
        <div className="lg:col-span-5 space-y-4">
          <div className="cyber-card p-6 rounded-xl border border-cyber-border space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-neon-green" />
              DIRECT CONTACT ENDPOINTS
            </h3>

            {/* Email Item */}
            <div className="p-3 bg-cyber-dark rounded-lg border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-cyber-card flex items-center justify-center text-neon-cyan">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-cyber-textMuted uppercase">PRIMARY EMAIL</div>
                  <div className="text-xs text-white font-semibold">{PORTFOLIO_DATA.profile.email}</div>
                </div>
              </div>
              <button
                onClick={copyEmail}
                className="p-1.5 bg-cyber-card border border-cyber-border rounded text-cyber-textMuted hover:text-white"
                title="Copy Email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Phone Item */}
            <div className="p-3 bg-cyber-dark rounded-lg border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-cyber-card flex items-center justify-center text-neon-green">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-cyber-textMuted uppercase">PHONE / SIGNAL</div>
                  <div className="text-xs text-white font-semibold">{PORTFOLIO_DATA.profile.phone}</div>
                </div>
              </div>
            </div>

            {/* Location Item */}
            <div className="p-3 bg-cyber-dark rounded-lg border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-cyber-card flex items-center justify-center text-neon-amber">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-cyber-textMuted uppercase">LOCATION</div>
                <div className="text-xs text-white font-semibold">{PORTFOLIO_DATA.profile.location}</div>
                <div className="text-[10px] text-cyber-textMuted">Open to Remote &amp; On-site Opportunities</div>
              </div>
            </div>

            {/* GitHub Item */}
            <a
              href={PORTFOLIO_DATA.profile.github}
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-cyber-dark rounded-lg border border-white/5 flex items-center justify-between hover:border-neon-cyan/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-cyber-card flex items-center justify-center text-white">
                  <GithubIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-cyber-textMuted uppercase">GITHUB</div>
                  <div className="text-xs text-white font-semibold">github.com/sumitsharmark92</div>
                </div>
              </div>
              <span className="text-neon-cyan text-xs">→</span>
            </a>
          </div>
        </div>

        {/* Right: Encrypted Transmission Form */}
        <div className="lg:col-span-7 cyber-card p-6 sm:p-8 rounded-xl border border-cyber-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-neon-cyan" />
              SEND SECURE TRANSMISSION
            </h3>
            <span className="text-[10px] text-neon-green">ENCRYPTED TLS 1.3</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-cyber-textMuted block mb-1.5 font-semibold">YOUR FULL NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-cyan font-mono"
                />
              </div>

              <div>
                <label className="text-cyber-textMuted block mb-1.5 font-semibold">YOUR EMAIL ADDRESS *</label>
                <input
                  type="email"
                  placeholder="elena@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-cyan font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-cyber-textMuted block mb-1.5 font-semibold">PHONE / SIGNAL (OPTIONAL)</label>
              <input
                type="tel"
                placeholder="+1 / +91 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>

            <div>
              <label className="text-cyber-textMuted block mb-1.5 font-semibold">TRANSMISSION CONTENT *</label>
              <textarea
                rows={4}
                placeholder="Inquire about internship availability, penetration testing roles, or engineering collaboration..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-cyan font-mono resize-none leading-relaxed"
              />
            </div>

            {status && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  status.type === "success"
                    ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                    : "bg-neon-red/10 border border-neon-red/30 text-neon-red"
                }`}
              >
                {status.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{status.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-neon-cyan text-cyber-black font-bold text-xs rounded-lg hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 shadow-glowCyan"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "DISPATCHING ENCRYPTED PAYLOAD..." : "DISPATCH TRANSMISSION TO SUMIT"}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
