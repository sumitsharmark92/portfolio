"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee, RefreshCw, TrendingUp, TrendingDown, Clock,
  AlertTriangle, CheckCircle2, Zap, Calculator,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════
   Gold Rate & Tax Control Center
   Live rates · Manual override · Bulk price recalculation
   ═══════════════════════════════════════════════════════════ */

interface GoldRate {
  karat: string;
  rate: number;
  previousRate: number;
  updatedAt: string;
}

const RATE_HISTORY = [
  { date: "Aug 7, 2026", k24: 7800, k22: 7200, k18: 5900 },
  { date: "Aug 6, 2026", k24: 7755, k22: 7155, k18: 5850 },
  { date: "Aug 5, 2026", k24: 7710, k22: 7110, k18: 5810 },
  { date: "Aug 4, 2026", k24: 7680, k22: 7090, k18: 5790 },
  { date: "Aug 3, 2026", k24: 7720, k22: 7120, k18: 5820 },
];

export default function GoldRatesPage() {
  const [rates, setRates] = useState<GoldRate[]>([
    { karat: "24K Pure Gold", rate: 7800, previousRate: 7755, updatedAt: "Today, 10:30 AM" },
    { karat: "22K Gold", rate: 7200, previousRate: 7155, updatedAt: "Today, 10:30 AM" },
    { karat: "18K Gold", rate: 5900, previousRate: 5850, updatedAt: "Today, 10:30 AM" },
  ]);
  const [autoSync, setAutoSync] = useState(true);
  const [gst, setGst] = useState(3);
  const [makingChargePercent, setMakingChargePercent] = useState(12);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcDone, setRecalcDone] = useState(false);

  function updateRate(index: number, newRate: number) {
    setRates(rates.map((r, i) => (i === index ? { ...r, rate: newRate, updatedAt: "Just now (Manual)" } : r)));
  }

  async function bulkRecalculate() {
    setRecalculating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setRecalculating(false);
    setRecalcDone(true);
    setTimeout(() => setRecalcDone(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Gold Rate Control</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">Manage live gold rates, GST, and making charges</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ivory-muted/50">Auto-Sync API</span>
            <button onClick={() => setAutoSync(!autoSync)} className={`relative w-10 h-5 rounded-full transition-colors ${autoSync ? "bg-emerald-500" : "bg-ivory/10"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoSync ? "left-5.5 translate-x-0" : "left-0.5"}`} style={{ left: autoSync ? "22px" : "2px" }} />
            </button>
          </div>
          <button onClick={bulkRecalculate} disabled={recalculating} className="btn-primary disabled:opacity-50">
            {recalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : recalcDone ? <CheckCircle2 className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
            {recalculating ? "Recalculating..." : recalcDone ? "Done!" : "Recalculate All Prices"}
          </button>
        </div>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rates.map((rate, i) => {
          const diff = rate.rate - rate.previousRate;
          const isUp = diff > 0;
          return (
            <div key={rate.karat} className="rounded-xl glass p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-wider uppercase text-gold/70 font-semibold">{rate.karat}</span>
                <div className={`flex items-center gap-0.5 text-xs ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isUp ? "+" : ""}{diff}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-ivory font-serif">₹{rate.rate.toLocaleString("en-IN")}</span>
                <span className="text-xs text-ivory-muted/30">/gram</span>
              </div>
              <input type="number" value={rate.rate} onChange={(e) => updateRate(i, Number(e.target.value))} className="input-dark w-full text-sm" />
              <p className="text-[10px] text-ivory-muted/30 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {rate.updatedAt}</p>
            </div>
          );
        })}
      </div>

      {/* GST & Making Charges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl glass p-5">
          <h3 className="text-xs tracking-wider uppercase text-ivory-muted/30 font-semibold mb-3">GST Rate (%)</h3>
          <input type="number" value={gst} onChange={(e) => setGst(Number(e.target.value))} className="input-dark w-full text-lg font-bold text-gold" />
          <p className="text-[10px] text-ivory-muted/30 mt-2">Applied on all gold & jewelry products</p>
        </div>
        <div className="rounded-xl glass p-5">
          <h3 className="text-xs tracking-wider uppercase text-ivory-muted/30 font-semibold mb-3">Default Making Charge (%)</h3>
          <input type="number" value={makingChargePercent} onChange={(e) => setMakingChargePercent(Number(e.target.value))} className="input-dark w-full text-lg font-bold text-gold" />
          <p className="text-[10px] text-ivory-muted/30 mt-2">Default making charge on gold items</p>
        </div>
      </div>

      {/* Rate History */}
      <div className="rounded-xl glass overflow-hidden">
        <div className="px-5 py-3 border-b border-gold/10">
          <h3 className="text-sm font-semibold text-ivory">Rate History (Last 5 Days)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold/10">
              <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Date</th>
              <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">24K</th>
              <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">22K</th>
              <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">18K</th>
            </tr>
          </thead>
          <tbody>
            {RATE_HISTORY.map((row) => (
              <tr key={row.date} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] transition-colors">
                <td className="px-5 py-3 text-sm text-ivory-muted">{row.date}</td>
                <td className="px-5 py-3 text-right text-sm text-ivory">₹{row.k24.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 text-right text-sm text-ivory">₹{row.k22.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3 text-right text-sm text-ivory">₹{row.k18.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
