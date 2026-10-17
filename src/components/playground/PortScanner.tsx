"use client";

import React, { useState } from "react";
import {
  Radar,
  Play,
  Binary,
} from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface ScanResult {
  port: number;
  protocol: string;
  state: "OPEN" | "FILTERED" | "CLOSED";
  service: string;
  version: string;
  risk: "SAFE" | "LOW" | "MEDIUM" | "HIGH";
  cve?: string;
}

export const PortScanner: React.FC = () => {
  const [targetIp, setTargetIp] = useState("192.168.1.42");
  const [scanType, setScanType] = useState<"-sS" | "-sV" | "--vuln">("-sS");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Ready for reconnaissance audit. Select target host and click INITIATE RECON SCAN.",
  ]);
  const [results, setResults] = useState<ScanResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<"results" | "packet">("results");

  const runScan = () => {
    if (isScanning) return;

    soundEngine.playCyberBlip(1200);
    setIsScanning(true);
    setProgress(0);
    setResults(null);
    setTerminalLogs([
      `[+] Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString()}`,
      `[+] Target initialized: ${targetIp}`,
      `[+] Initiating ARP Ping Scan & TCP SYN Stealth Probe...`,
    ]);

    const steps = [
      { p: 20, log: `[+] Host ${targetIp} is UP (0.0028s RTT latency).` },
      { p: 40, log: `[+] Scanning 1,000 top TCP ports on ${targetIp}...` },
      { p: 65, log: `[+] Received SYN-ACK on Port 22 (TCP) [OpenSSH]` },
      { p: 80, log: `[+] Received SYN-ACK on Port 80 (TCP) [HTTP / nginx]` },
      { p: 90, log: `[+] Received SYN-ACK on Port 443 (TCP) [HTTPS / TLS 1.3]` },
      { p: 100, log: `[✓] Nmap scan report completed in 1.42s. 3 ports open, 997 closed.` },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        soundEngine.playKeyClick();
        const step = steps[currentStep];
        setProgress(step.p);
        setTerminalLogs((prev) => [...prev, step.log]);
        currentStep++;
      } else {
        clearInterval(interval);
        soundEngine.playSuccessChirp();
        setIsScanning(false);
        setResults([
          {
            port: 22,
            protocol: "TCP",
            state: "OPEN",
            service: "ssh",
            version: "OpenSSH 8.9p1 Ubuntu 3ubuntu0.7",
            risk: "SAFE",
          },
          {
            port: 80,
            protocol: "TCP",
            state: "OPEN",
            service: "http",
            version: "nginx 1.24.0 (Secure 301 Redirect to HTTPS)",
            risk: "LOW",
          },
          {
            port: 443,
            protocol: "TCP",
            state: "OPEN",
            service: "https",
            version: "nginx 1.24.0 (TLS 1.3 Strict-Transport-Security)",
            risk: "SAFE",
          },
          {
            port: 3389,
            protocol: "TCP",
            state: "FILTERED",
            service: "ms-wbt-server",
            version: "GPO Firewall Drop (Zero Public RDP Exposure)",
            risk: "SAFE",
          },
          {
            port: 8080,
            protocol: "TCP",
            state: "CLOSED",
            service: "http-proxy",
            version: "RST returned by kernel",
            risk: "SAFE",
          },
        ]);
      }
    }, 450);
  };

  return (
    <div className="cyber-card p-6 rounded-xl border border-neon-cyan/40 bg-cyber-dark/80 font-mono space-y-5">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-card border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-glowCyan">
            <Radar className="w-5 h-5 animate-spin" style={{ animationDuration: "8s" }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              SIMULATED PORT SCANNER &amp; PACKET ANALYZER
            </h3>
            <p className="text-xs text-cyber-textMuted">
              Interactive offensive security reconnaissance &amp; SYN probe telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === "results"
                ? "bg-neon-cyan text-cyber-black"
                : "bg-cyber-card border border-cyber-border text-cyber-textMuted hover:text-white"
            }`}
          >
            FINDINGS TABLE
          </button>
          <button
            onClick={() => setActiveTab("packet")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === "packet"
                ? "bg-neon-cyan text-cyber-black"
                : "bg-cyber-card border border-cyber-border text-cyber-textMuted hover:text-white"
            }`}
          >
            HEX PACKET DECODER
          </button>
        </div>
      </div>

      {/* Target & Options Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-5 space-y-1">
          <label className="text-xs text-cyber-textMuted">TARGET HOST / IP ADDRESS:</label>
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            disabled={isScanning}
            className="w-full px-3 py-2 bg-cyber-card border border-cyber-border rounded text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
          />
        </div>

        <div className="sm:col-span-4 space-y-1">
          <label className="text-xs text-cyber-textMuted">PROBE PROFILE:</label>
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value as "-sS" | "-sV" | "--vuln")}
            disabled={isScanning}
            className="w-full px-3 py-2 bg-cyber-card border border-cyber-border rounded text-xs text-white focus:outline-none focus:border-neon-cyan font-mono"
          >
            <option value="-sS">TCP SYN Stealth (-sS)</option>
            <option value="-sV">Version Detection (-sV)</option>
            <option value="--vuln">Vulnerability Audit Script (--vuln)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <button
            onClick={runScan}
            disabled={isScanning}
            className={`w-full py-2.5 rounded font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              isScanning
                ? "bg-cyber-card text-cyber-textMuted border border-cyber-border cursor-not-allowed"
                : "bg-neon-green text-cyber-black hover:bg-neon-cyan shadow-glowGreen"
            }`}
          >
            {isScanning ? (
              <>
                <Radar className="w-4 h-4 animate-spin" />
                <span>SCANNING ({progress}%)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>INITIATE RECON SCAN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Animated Scan Progress */}
      {isScanning && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neon-cyan font-semibold">
            <span>PACKET TRANSMISSION PROGRESS:</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-cyber-card rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Terminal Output Log */}
      <div className="bg-black/90 border border-cyber-border p-3.5 rounded-lg max-h-36 overflow-y-auto space-y-1 text-xs">
        {terminalLogs.map((log, i) => (
          <div
            key={i}
            className={
              log.includes("[✓]")
                ? "text-neon-green font-bold"
                : log.includes("SYN-ACK")
                ? "text-neon-cyan"
                : "text-cyber-textMuted"
            }
          >
            {log}
          </div>
        ))}
      </div>

      {/* Results Table View */}
      {activeTab === "results" && results && (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyber-border text-cyber-textMuted text-[10px] uppercase">
                <th className="py-2 px-3">Port</th>
                <th className="py-2 px-3">State</th>
                <th className="py-2 px-3">Service</th>
                <th className="py-2 px-3">Version / Banner</th>
                <th className="py-2 px-3">Risk Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {results.map((r) => (
                <tr key={r.port} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 text-neon-cyan font-bold">
                    {r.port}/{r.protocol}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.state === "OPEN"
                          ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                          : r.state === "FILTERED"
                          ? "bg-neon-amber/10 text-neon-amber border border-neon-amber/30"
                          : "bg-red-950/40 text-red-400 border border-red-800/40"
                      }`}
                    >
                      {r.state}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white font-medium">{r.service}</td>
                  <td className="py-2.5 px-3 text-cyber-textLight truncate max-w-xs">{r.version}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-neon-green font-semibold">{r.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Packet Hex View */}
      {activeTab === "packet" && (
        <div className="bg-cyber-card p-4 rounded-lg border border-cyber-border space-y-2">
          <div className="flex items-center justify-between text-xs text-neon-cyan font-bold">
            <span className="flex items-center gap-1.5">
              <Binary className="w-4 h-4" />
              WIRESHARK DISSECTED TCP SYN-ACK PACKET CAPTURE (PORT 443):
            </span>
            <span className="text-[10px] text-cyber-textMuted">FRAME SIZE: 74 BYTES</span>
          </div>

          <pre className="text-[11px] text-neon-green font-mono overflow-x-auto p-3 bg-black/95 rounded border border-white/5 leading-relaxed">
{`0000   00 15 5d 01 2a 34  52 54 00 12 34 56  08 00 45 00   ..].*4RT..4V..E.
0010   00 3c 1a 4e 40 00  40 06 c8 1e c0 a8  01 2a c0 a8   .<.N@.@......*..
0020   01 01 01 bb d4 31  8c a1 40 00 00 00  00 00 a0 02   .......1..@.....
0030   fa f0 b3 24 00 00  02 04 05 b4 04 02  08 0a 34 b1   ...$..........4.
0040   2c 88 00 00 00 00  01 03 03 07                       ,.........`}
          </pre>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] text-cyber-textLight">
            <div>Flags: <span className="text-neon-green font-bold">SYN, ACK (0x012)</span></div>
            <div>Sequence: <span className="text-neon-cyan">2359377920</span></div>
            <div>Window Size: <span className="text-white">64240</span></div>
            <div>Checksum: <span className="text-neon-green">0xb324 [Valid]</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
