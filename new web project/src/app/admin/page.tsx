"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  IndianRupee, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowRight, Hammer, CheckCircle2, Truck, Gift,
  Eye, Flame, AlertTriangle, BarChart3, Clock,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════
   Admin Dashboard — Executive Overview
   Revenue · Orders · Products · Customers · Activity Feed
   ═══════════════════════════════════════════════════════════ */

const KPI_CARDS = [
  { label: "Revenue (Month)", value: "₹12,45,800", change: "+18.2%", positive: true, icon: IndianRupee, color: "text-gold", bg: "bg-gold/10 border-gold/20" },
  { label: "Total Orders", value: "847", change: "+12.5%", positive: true, icon: ShoppingCart, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { label: "Active Products", value: "234", change: "+5", positive: true, icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "New Customers", value: "1,203", change: "-3.1%", positive: false, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

const RECENT_ORDERS = [
  { id: "ORD-2851", customer: "Priya Sharma", items: "3 Gold Kangan + 12 Glass Chudi", amount: 185600, status: "New", statusColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "ORD-2850", customer: "Meera Patel", items: "Bridal Kundan Set (24 pcs)", amount: 325000, status: "Crafting", statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "ORD-2849", customer: "Anjali Verma", items: "6 Pearl Bangles + 2 Brass Kada", amount: 42300, status: "QC", statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "ORD-2848", customer: "Ritu Agarwal", items: "Diamond Tennis Bracelet", amount: 75000, status: "Shipped", statusColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { id: "ORD-2847", customer: "Kavita Singh", items: "Custom Stack (18 Bangles)", amount: 210500, status: "Delivered", statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
];

const MATERIAL_BREAKDOWN = [
  { name: "Gold (22K)", pct: 42, color: "#D4AF37" },
  { name: "Glass", pct: 28, color: "#F43F5E" },
  { name: "Kundan", pct: 15, color: "#F59E0B" },
  { name: "Pearl", pct: 8, color: "#E5E7EB" },
  { name: "Brass", pct: 5, color: "#D97706" },
  { name: "Diamond", pct: 2, color: "#6366F1" },
];

const QUICK_ACTIONS = [
  { label: "Add Product", href: "/admin/products", icon: Package, color: "text-emerald-400" },
  { label: "View Orders", href: "/admin/orders", icon: ShoppingCart, color: "text-blue-400" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "text-purple-400" },
  { label: "Gold Rates", href: "/admin/gold-rates", icon: IndianRupee, color: "text-gold" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl glass p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} border flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} strokeWidth={1.5} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.positive ? "text-emerald-400" : "text-rose-400"}`}>
                {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-ivory font-serif">{kpi.value}</p>
            <p className="text-[10px] text-ivory-muted/40 mt-1 tracking-wider uppercase">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} href={action.href} className="rounded-xl glass p-3 flex items-center gap-3 hover:bg-gold/[0.03] transition-colors group">
            <action.icon className={`w-5 h-5 ${action.color}`} strokeWidth={1.5} />
            <span className="text-sm text-ivory-muted/70 group-hover:text-ivory transition-colors">{action.label}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-ivory-muted/20 group-hover:text-gold transition-colors" />
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl glass overflow-hidden">
          <div className="px-5 py-3 border-b border-gold/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ivory flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold/60" /> Recent Orders
            </h3>
            <Link href="/admin/orders" className="text-xs text-gold/60 hover:text-gold transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold/10">
                <th className="text-left px-5 py-2.5 text-[10px] tracking-wider uppercase text-ivory-muted/40">Order</th>
                <th className="text-left px-5 py-2.5 text-[10px] tracking-wider uppercase text-ivory-muted/40">Customer</th>
                <th className="text-left px-5 py-2.5 text-[10px] tracking-wider uppercase text-ivory-muted/40">Items</th>
                <th className="text-right px-5 py-2.5 text-[10px] tracking-wider uppercase text-ivory-muted/40">Amount</th>
                <th className="text-right px-5 py-2.5 text-[10px] tracking-wider uppercase text-ivory-muted/40">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] transition-colors">
                  <td className="px-5 py-3"><span className="text-xs text-gold font-semibold">{order.id}</span></td>
                  <td className="px-5 py-3"><span className="text-sm text-ivory">{order.customer}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-ivory-muted/50 truncate block max-w-xs">{order.items}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-sm text-gold font-bold">{formatPrice(order.amount)}</span></td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] tracking-wider uppercase rounded-full border ${order.statusColor}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Material Breakdown + Gold Rate */}
        <div className="space-y-4">
          <div className="rounded-xl glass p-5">
            <h3 className="text-sm font-semibold text-ivory flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-rose-400" /> Top Materials
            </h3>
            <div className="space-y-2.5">
              {MATERIAL_BREAKDOWN.map((mat) => (
                <div key={mat.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: mat.color }} />
                  <span className="text-xs text-ivory-muted/70 flex-1">{mat.name}</span>
                  <div className="w-24 h-1.5 rounded-full bg-ivory/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mat.pct}%`, backgroundColor: mat.color }} />
                  </div>
                  <span className="text-xs text-ivory font-medium w-8 text-right">{mat.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl glass-gold p-5">
            <p className="text-[10px] tracking-wider uppercase text-ivory-muted/40">Today&apos;s Gold Rate (22K)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gold font-serif">₹7,200</span>
              <span className="text-xs text-ivory-muted/30">/gram</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
              <ArrowUpRight className="w-3 h-3" /> +₹45 from yesterday
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-rose-400">Low Stock Alert</span>
            </div>
            <p className="text-xs text-ivory-muted/60">
              <strong className="text-ivory">Yellow Kundan Set (2.6)</strong> — 5 units left, ~4 days at current velocity
            </p>
            <Link href="/admin/analytics" className="text-[10px] text-rose-400 hover:text-rose-300 mt-2 inline-flex items-center gap-1">
              View Demand Intel <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
