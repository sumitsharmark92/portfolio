"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Crown, Star, Gift, IndianRupee, ShoppingCart,
  ChevronRight, X, User, Mail, Phone, MapPin, Calendar, Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════
   Customer & VIP Management
   Customer directory · LTV · VIP tiers · Store credit
   ═══════════════════════════════════════════════════════════ */

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  ltv: number;
  vipTier: "Standard" | "Silver" | "Gold" | "Platinum";
  storeCredit: number;
  lastOrder: string;
  joinedAt: string;
}

const TIER_CONFIG = {
  Standard: { color: "text-ivory-muted/50", bg: "bg-ivory/5 border-ivory/10", icon: User },
  Silver: { color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/20", icon: Star },
  Gold: { color: "text-gold", bg: "bg-gold/10 border-gold/20", icon: Crown },
  Platinum: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: Crown },
};

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43210", city: "Delhi", totalOrders: 28, ltv: 1245000, vipTier: "Platinum", storeCredit: 5000, lastOrder: "2 days ago", joinedAt: "Jan 2024" },
  { id: "c2", name: "Meera Patel", email: "meera@example.com", phone: "+91 87654 32109", city: "Mumbai", totalOrders: 15, ltv: 680000, vipTier: "Gold", storeCredit: 2000, lastOrder: "1 week ago", joinedAt: "Mar 2024" },
  { id: "c3", name: "Anjali Verma", email: "anjali@example.com", phone: "+91 76543 21098", city: "Jaipur", totalOrders: 9, ltv: 320000, vipTier: "Silver", storeCredit: 0, lastOrder: "3 weeks ago", joinedAt: "Jun 2024" },
  { id: "c4", name: "Ritu Agarwal", email: "ritu@example.com", phone: "+91 65432 10987", city: "Kolkata", totalOrders: 22, ltv: 890000, vipTier: "Gold", storeCredit: 3500, lastOrder: "5 days ago", joinedAt: "Feb 2024" },
  { id: "c5", name: "Kavita Singh", email: "kavita@example.com", phone: "+91 54321 09876", city: "Chennai", totalOrders: 4, ltv: 85000, vipTier: "Standard", storeCredit: 0, lastOrder: "1 month ago", joinedAt: "Jul 2025" },
  { id: "c6", name: "Deepa Reddy", email: "deepa@example.com", phone: "+91 43210 98765", city: "Hyderabad", totalOrders: 31, ltv: 1520000, vipTier: "Platinum", storeCredit: 8000, lastOrder: "Yesterday", joinedAt: "Nov 2023" },
  { id: "c7", name: "Sunita Joshi", email: "sunita@example.com", phone: "+91 32109 87654", city: "Lucknow", totalOrders: 7, ltv: 210000, vipTier: "Silver", storeCredit: 1000, lastOrder: "2 weeks ago", joinedAt: "Sep 2024" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [creditAmount, setCreditAmount] = useState("");

  const filtered = customers.filter((c) =>
    searchQuery === "" || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()) || c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topCustomers = [...customers].sort((a, b) => b.ltv - a.ltv).slice(0, 3);

  function changeTier(id: string, tier: Customer["vipTier"]) {
    setCustomers(customers.map((c) => (c.id === id ? { ...c, vipTier: tier } : c)));
    if (selectedCustomer?.id === id) setSelectedCustomer({ ...selectedCustomer, vipTier: tier });
  }

  function issueCredit(id: string) {
    const amount = Number(creditAmount) || 0;
    if (amount <= 0) return;
    setCustomers(customers.map((c) => (c.id === id ? { ...c, storeCredit: c.storeCredit + amount } : c)));
    if (selectedCustomer?.id === id) setSelectedCustomer({ ...selectedCustomer, storeCredit: selectedCustomer.storeCredit + amount });
    setCreditAmount("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Customers</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">{customers.length} registered · {customers.filter((c) => c.vipTier !== "Standard").length} VIP</p>
        </div>
      </div>

      {/* Top Customers Leaderboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topCustomers.map((c, i) => {
          const tierConfig = TIER_CONFIG[c.vipTier];
          return (
            <div key={c.id} onClick={() => setSelectedCustomer(c)} className="rounded-xl glass p-4 cursor-pointer hover:border-gold/20 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tierConfig.bg} border`}>
                  <span className={`text-lg font-bold ${tierConfig.color}`}>#{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm text-ivory font-medium">{c.name}</p>
                  <p className="text-[10px] text-ivory-muted/40">{c.city} · {c.totalOrders} orders</p>
                </div>
                <span className={`ml-auto text-sm font-bold ${tierConfig.color}`}>{formatPrice(c.ltv)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted/40" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search customers..." className="input-dark pl-10 w-full" />
      </div>

      {/* Customer Table */}
      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold/10">
              <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Customer</th>
              <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">City</th>
              <th className="text-center px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Orders</th>
              <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">LTV</th>
              <th className="text-center px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">VIP Tier</th>
              <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Credit</th>
              <th className="text-right px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const tierConfig = TIER_CONFIG[c.vipTier];
              return (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] cursor-pointer transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm text-ivory font-medium">{c.name}</p>
                    <p className="text-[10px] text-ivory-muted/35">{c.email}</p>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-ivory-muted">{c.city}</span></td>
                  <td className="px-5 py-3 text-center"><span className="text-sm text-ivory">{c.totalOrders}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-sm text-gold font-semibold">{formatPrice(c.ltv)}</span></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-wider uppercase rounded-full border ${tierConfig.bg} ${tierConfig.color}`}>
                      <tierConfig.icon className="w-2.5 h-2.5" /> {c.vipTier}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right"><span className="text-sm text-emerald-400">{c.storeCredit > 0 ? formatPrice(c.storeCredit) : "—"}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-xs text-ivory-muted/40">{c.lastOrder}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCustomer(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-obsidian-light border-l border-gold/10 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-obsidian-light/95 backdrop-blur-md border-b border-gold/10 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-gold">{selectedCustomer.name}</h2>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-ivory-muted/40 hover:text-gold rounded-lg hover:bg-gold/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Info */}
              <div className="glass rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory">{selectedCustomer.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory">{selectedCustomer.phone}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory">{selectedCustomer.city}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory-muted/60">Joined {selectedCustomer.joinedAt}</span></div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-ivory">{selectedCustomer.totalOrders}</p>
                  <p className="text-[10px] text-ivory-muted/40">Orders</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gold">{formatPrice(selectedCustomer.ltv)}</p>
                  <p className="text-[10px] text-ivory-muted/40">Lifetime Value</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{formatPrice(selectedCustomer.storeCredit)}</p>
                  <p className="text-[10px] text-ivory-muted/40">Store Credit</p>
                </div>
              </div>

              {/* VIP Tier */}
              <div>
                <h3 className="text-xs tracking-wider uppercase text-ivory-muted/30 font-semibold mb-2">VIP Tier</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(["Standard", "Silver", "Gold", "Platinum"] as const).map((tier) => {
                    const tc = TIER_CONFIG[tier];
                    return (
                      <button key={tier} onClick={() => changeTier(selectedCustomer.id, tier)} className={`py-2 rounded-lg text-xs transition-all ${selectedCustomer.vipTier === tier ? `${tc.bg} ${tc.color} border font-semibold` : "glass text-ivory-muted/40 hover:text-gold"}`}>
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Issue Credit */}
              <div>
                <h3 className="text-xs tracking-wider uppercase text-ivory-muted/30 font-semibold mb-2">Issue Store Credit</h3>
                <div className="flex gap-2">
                  <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="₹ Amount" className="input-dark flex-1 text-sm" />
                  <button onClick={() => issueCredit(selectedCustomer.id)} className="btn-primary text-sm"><Gift className="w-4 h-4" /> Issue</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
