"use client";

import React, { useState } from "react";
import { Flag, Copy, Check, X, Award, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { soundEngine } from "@/lib/audio";

interface CtfChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CtfChallengeModal: React.FC<CtfChallengeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [ans1, setAns1] = useState("");
  const [ans2, setAns2] = useState("");
  const [ans3, setAns3] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (ans1.trim() === "sumit-labs:2026") {
      soundEngine.playSuccessChirp();
      setErrorMsg("");
      setStep(2);
    } else {
      soundEngine.playErrorBuzz();
      setErrorMsg("Incorrect decryption. Hint: Standard Base64 decode the string.");
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (ans2.trim() === "22") {
      soundEngine.playSuccessChirp();
      setErrorMsg("");
      setStep(3);
    } else {
      soundEngine.playErrorBuzz();
      setErrorMsg("Incorrect port. Hint: The default standard port for OpenSSH remote terminal daemon.");
    }
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ans3.trim().toUpperCase();
    if (clean === "FIRST" || clean === "F1RST") {
      soundEngine.playSuccessChirp();
      setErrorMsg("");
      setStep(4);

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00ff66", "#00f0ff", "#ffb703"],
        });
      } catch {}
    } else {
      soundEngine.playErrorBuzz();
      setErrorMsg("Incorrect ROT13 decode. Hint: Shift letters backward 13 places (S -> F, I -> V, etc).");
    }
  };

  const secretFlag = "FLAG{s3cur1ty_f1rst_sumit_labs}";

  const copyFlag = () => {
    navigator.clipboard.writeText(secretFlag);
    soundEngine.playSuccessChirp();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-lg bg-cyber-dark border border-neon-green/40 rounded-lg shadow-glowGreen overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyber-border bg-cyber-card">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-neon-green" />
            <span className="text-sm font-bold text-white tracking-wider">
              MINI-CTF // RECRUITER VERIFICATION CHALLENGE
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-cyber-textMuted hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-neon-cyan mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>CHALLENGE 1 / 3: BASE64 CIPHER</span>
              </div>
              <p className="text-xs text-cyber-textLight mb-3">
                Decode the following Base64 encoded reconnaissance string:
              </p>
              <div className="bg-black/80 border border-cyber-border p-3 rounded text-center text-neon-green font-bold text-sm tracking-widest mb-4">
                c3VtaXQtbGFiczoyMDI2
              </div>

              <form onSubmit={handleStep1} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter decoded plaintext..."
                  value={ans1}
                  onChange={(e) => setAns1(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-cyber-card border border-cyber-border rounded text-sm text-white focus:outline-none focus:border-neon-green"
                />
                {errorMsg && <p className="text-xs text-neon-red">{errorMsg}</p>}
                <button
                  type="submit"
                  className="w-full py-2 bg-neon-green text-cyber-black font-bold text-xs rounded hover:bg-neon-cyan transition-colors"
                >
                  VERIFY SOLUTION →
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-neon-cyan mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>CHALLENGE 2 / 3: PROTOCOL INTERNALS</span>
              </div>
              <p className="text-xs text-cyber-textLight mb-3">
                What standard TCP port number is utilized by OpenSSH for encrypted remote shell administration?
              </p>

              <form onSubmit={handleStep2} className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. 80, 443..."
                  value={ans2}
                  onChange={(e) => setAns2(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-cyber-card border border-cyber-border rounded text-sm text-white focus:outline-none focus:border-neon-green"
                />
                {errorMsg && <p className="text-xs text-neon-red">{errorMsg}</p>}
                <button
                  type="submit"
                  className="w-full py-2 bg-neon-green text-cyber-black font-bold text-xs rounded hover:bg-neon-cyan transition-colors"
                >
                  CONFIRM PORT →
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 text-xs text-neon-cyan mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>CHALLENGE 3 / 3: ROT13 CAESAR CIPHER</span>
              </div>
              <p className="text-xs text-cyber-textLight mb-3">
                Decrypt this Caesar ROT13 token to reveal the security keyword:
              </p>
              <div className="bg-black/80 border border-cyber-border p-3 rounded text-center text-neon-amber font-bold text-sm tracking-widest mb-4">
                S1EFE
              </div>

              <form onSubmit={handleStep3} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter decrypted word..."
                  value={ans3}
                  onChange={(e) => setAns3(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-cyber-card border border-cyber-border rounded text-sm text-white focus:outline-none focus:border-neon-green"
                />
                {errorMsg && <p className="text-xs text-neon-red">{errorMsg}</p>}
                <button
                  type="submit"
                  className="w-full py-2 bg-neon-green text-cyber-black font-bold text-xs rounded hover:bg-neon-cyan transition-colors"
                >
                  SOLVE FINAL PUZZLE →
                </button>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-neon-green/20 border border-neon-green flex items-center justify-center mx-auto mb-3 text-neon-green shadow-glowGreen">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                ACCESS GRANTED // CTF COMPLETED!
              </h3>
              <p className="text-xs text-cyber-textMuted mb-4">
                You proved your cybersecurity credentials. Here is your official recruiter validation flag:
              </p>

              <div className="bg-black/90 border border-neon-green p-3 rounded flex items-center justify-between mb-4 shadow-glowGreen">
                <span className="text-neon-green font-bold text-xs tracking-wider">
                  {secretFlag}
                </span>
                <button
                  onClick={copyFlag}
                  className="p-1.5 rounded bg-neon-green/10 text-neon-green hover:bg-neon-green hover:text-black transition-colors"
                  title="Copy flag to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-cyber-textMuted mb-4">
                Send this flag in your contact message to fast-track your internship interview with Sumit!
              </p>

              <button
                onClick={onClose}
                className="w-full py-2 bg-cyber-card border border-cyber-border text-white text-xs font-semibold rounded hover:border-neon-green transition-colors"
              >
                CLOSE CHALLENGE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
