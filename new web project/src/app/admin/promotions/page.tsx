"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Plus, X, Calendar, Percent, IndianRupee, Eye, Trash2,
  Copy, CheckCircle2, Megaphone, Sparkles, Gift, Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Promotions & Festive Campaign Studio
   Discount codes · Festive banners · Announcement bar CMS
   ═══════════════════════════════════════════════════════════ */

interface PromoCode {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  usageCount: number;
  maxUses: number;
  expiresAt: string;
  isActive: boolean;
  category: string;
}

interface Campaign {
  id: string;
  title: string;
  bannerText: string;
  ctaText: string;
  startDate: string;
  endDate: string;
  targetCategory: string;
  isActive: boolean;
}

const INITIAL_PROMOS: PromoCode[] = [
  { id: "p1", code: "WEDDING25", type: "percent", value: 25, minOrder: 50000, usageCount: 142, maxUses: 500, expiresAt: "Dec 31, 2026", isActive: true, category: "All" },
  { id: "p2", code: "FLAT2000", type: "flat", value: 2000, minOrder: 15000, usageCount: 89, maxUses: 200, expiresAt: "Sep 15, 2026", isActive: true, category: "Kangan" },
  { id: "p3", code: "FESTIVE10", type: "percent", value: 10, minOrder: 10000, usageCount: 310, maxUses: 1000, expiresAt: "Nov 30, 2026", isActive: true, category: "Chudi" },
  { id: "p4", code: "SUMMER500", type: "flat", value: 500, minOrder: 5000, usageCount: 500, maxUses: 500, expiresAt: "Aug 1, 2026", isActive: false, category: "All" },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: "c1", title: "Karwa Chauth Special", bannerText: "✨ Karwa Chauth Collection — Up to 30% Off on Bridal Chura Sets!", ctaText: "Shop Bridal", startDate: "Oct 1, 2026", endDate: "Oct 15, 2026", targetCategory: "Full Chura Set", isActive: false },
  { id: "c2", title: "Wedding Season", bannerText: "💍 Wedding Season Sale — Free Customization on Orders Above ₹1 Lakh", ctaText: "Customize Now", startDate: "Aug 1, 2026", endDate: "Sep 30, 2026", targetCategory: "All", isActive: true },
];

export default function PromotionsPage() {
  const [promos, setPromos] = useState(INITIAL_PROMOS);
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [announcementBar, setAnnouncementBar] = useState("🎉 Free shipping on orders above ₹25,000 · Use code SHIP25");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [tab, setTab] = useState<"codes" | "campaigns" | "banner">("codes");

  // New promo form
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"percent" | "flat">("percent");
  const [newValue, setNewValue] = useState("");
  const [newMin, setNewMin] = useState("10000");
  const [newMax, setNewMax] = useState("500");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function addPromo() {
    if (!newCode) return;
    const promo: PromoCode = {
      id: `p-${Date.now()}`,
      code: newCode.toUpperCase(),
      type: newType,
      value: Number(newValue) || 10,
      minOrder: Number(newMin) || 0,
      usageCount: 0,
      maxUses: Number(newMax) || 500,
      expiresAt: "Dec 31, 2026",
      isActive: true,
      category: "All",
    };
    setPromos([promo, ...promos]);
    setShowAddPromo(false);
    setNewCode("");
    setNewValue("");
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Promotions</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">Discount codes, festive campaigns & announcements</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {([["codes", "Discount Codes", Tag], ["campaigns", "Campaigns", Megaphone], ["banner", "Announcement Bar", Sparkles]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg transition-all ${tab === key ? "bg-gold/10 text-gold border border-gold/15 font-semibold" : "glass text-ivory-muted/50 hover:text-gold"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Discount Codes */}
      {tab === "codes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddPromo(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Code</button>
          </div>

          {/* Add promo inline */}
          <AnimatePresence>
            {showAddPromo && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-xl glass-gold p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gold">New Discount Code</h3>
                  <button onClick={() => setShowAddPromo(false)} className="text-ivory-muted/40 hover:text-gold"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="CODE" className="input-dark uppercase font-mono text-sm" />
                  <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="input-dark text-sm">
                    <option value="percent">Percentage</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                  <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={newType === "percent" ? "10%" : "₹500"} className="input-dark text-sm" />
                  <input type="number" value={newMin} onChange={(e) => setNewMin(e.target.value)} placeholder="Min ₹" className="input-dark text-sm" />
                  <button onClick={addPromo} className="btn-primary text-sm"><CheckCircle2 className="w-4 h-4" /> Create</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Code</th>
                  <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Discount</th>
                  <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Min Order</th>
                  <th className="text-center px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Usage</th>
                  <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Expires</th>
                  <th className="text-center px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Status</th>
                  <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] transition-colors">
                    <td className="px-5 py-3"><span className="font-mono text-sm text-gold font-semibold">{p.code}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ivory">{p.type === "percent" ? `${p.value}%` : `₹${p.value}`}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ivory-muted/60">₹{p.minOrder.toLocaleString("en-IN")}</span></td>
                    <td className="px-5 py-3 text-center"><span className="text-sm text-ivory-muted">{p.usageCount}/{p.maxUses}</span></td>
                    <td className="px-5 py-3"><span className="text-xs text-ivory-muted/50">{p.expiresAt}</span></td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => setPromos(promos.map((pr) => (pr.id === p.id ? { ...pr, isActive: !pr.isActive } : pr)))} className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-full transition-all ${p.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-ivory/5 text-ivory-muted/40 border border-ivory/10"}`}>
                        {p.isActive ? "Active" : "Expired"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copyCode(p.id, p.code)} className="p-1.5 text-ivory-muted/40 hover:text-gold rounded-md transition-colors">
                          {copiedId === p.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setPromos(promos.filter((pr) => pr.id !== p.id))} className="p-1.5 text-ivory-muted/40 hover:text-rose-400 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className={`rounded-xl glass p-5 border-l-4 ${campaign.isActive ? "border-l-emerald-500" : "border-l-ivory/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-ivory">{campaign.title}</h3>
                <button onClick={() => setCampaigns(campaigns.map((c) => (c.id === campaign.id ? { ...c, isActive: !c.isActive } : c)))} className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-full transition-all ${campaign.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-ivory/5 text-ivory-muted/40 border border-ivory/10"}`}>
                  {campaign.isActive ? "Live" : "Scheduled"}
                </button>
              </div>
              <p className="text-sm text-gold">{campaign.bannerText}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-ivory-muted/40">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {campaign.startDate} → {campaign.endDate}</span>
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {campaign.targetCategory}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcement Bar */}
      {tab === "banner" && (
        <div className="space-y-4">
          <div className="rounded-xl glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ivory">Announcement Bar Text</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ivory-muted/40">Enabled</span>
                <button onClick={() => setAnnouncementEnabled(!announcementEnabled)} className={`relative w-10 h-5 rounded-full transition-colors ${announcementEnabled ? "bg-emerald-500" : "bg-ivory/10"}`}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: announcementEnabled ? "22px" : "2px" }} />
                </button>
              </div>
            </div>
            <textarea value={announcementBar} onChange={(e) => setAnnouncementBar(e.target.value)} rows={2} className="input-dark w-full text-sm" />
            {/* Preview */}
            <div>
              <p className="text-xs text-ivory-muted/30 mb-2">Preview:</p>
              <div className="w-full py-2 px-4 bg-gold text-obsidian text-xs text-center font-medium rounded-lg">
                {announcementBar}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
