"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Flame, Eye, ShoppingCart, Package, AlertTriangle,
  Search, Users, Zap, Activity, BarChart3, ArrowUpRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Module B — Demand Intelligence & Predictive Analytics
   Native SVG Visualizations (Zero external chart dependencies)
   ═══════════════════════════════════════════════════════════ */

const REVENUE_DATA = [
  { date: "Mon", revenue: 48000 },
  { date: "Tue", revenue: 62000 },
  { date: "Wed", revenue: 55000 },
  { date: "Thu", revenue: 78000 },
  { date: "Fri", revenue: 95000 },
  { date: "Sat", revenue: 120000 },
  { date: "Sun", revenue: 105000 },
];

const TOP_PRODUCTS = [
  { name: "Yellow Kundan Set", views: 1240, carted: 320, converted: 85, revenue: 850000 },
  { name: "Blue Crystal Stack", views: 980, carted: 250, converted: 72, revenue: 720000 },
  { name: "Magenta Velvet Set", views: 890, carted: 210, converted: 58, revenue: 580000 },
  { name: "Floral Kangan Pair", views: 760, carted: 180, converted: 45, revenue: 450000 },
  { name: "Golden Paved Kangan", views: 650, carted: 150, converted: 38, revenue: 380000 },
];

const CATEGORY_DATA = [
  { name: "Chudi", value: 38, color: "#F43F5E" },
  { name: "Kangan", value: 28, color: "#D4AF37" },
  { name: "Sets", value: 22, color: "#10B981" },
  { name: "Bracelets", value: 12, color: "#6366F1" },
];

const SIZE_DATA = [
  { size: "2.2", demand: 15 },
  { size: "2.4", demand: 35 },
  { size: "2.6", demand: 30 },
  { size: "2.8", demand: 15 },
  { size: "2.10", demand: 5 },
];

const POPULAR_STACKS = [
  { combo: "Gold Kangan + 6x Red Glass Chudi + Kundan Center", frequency: 234, conversion: "18.2%" },
  { combo: "2x Pearl Bracelet + 4x Velvet Chudi + Diamond Kada", frequency: 189, conversion: "14.7%" },
  { combo: "Brass Kada + 8x Glass Chudi + Gold Kangan", frequency: 156, conversion: "12.1%" },
  { combo: "Full Kundan Chura (24-piece bridal set)", frequency: 98, conversion: "22.5%" },
];

const LIVE_ACTIVITY = [
  { time: "Just now", action: "Building a Kundan Chura Set", location: "Delhi", icon: Zap },
  { time: "2m ago", action: "Added Gold Kangan to cart", location: "Mumbai", icon: ShoppingCart },
  { time: "5m ago", action: "Viewed Magenta Velvet Set", location: "Jaipur", icon: Eye },
  { time: "8m ago", action: "Placed order #ORD-2851 (₹1,85,600)", location: "Kolkata", icon: Package },
  { time: "12m ago", action: "Searched 'emerald green glass chudi'", location: "Chennai", icon: Search },
  { time: "15m ago", action: "Added 3 items to wishlist", location: "Lucknow", icon: Activity },
];

const LOW_STOCK_ALERTS = [
  { sku: "SKU-204", name: "Yellow Kundan Set (Size 2.6)", stock: 5, daysLeft: 4, velocity: "1.2/day" },
  { sku: "SKU-112", name: "Blue Crystal Stack (Size 2.4)", stock: 8, daysLeft: 6, velocity: "1.3/day" },
  { sku: "SKU-301", name: "Golden Paved Kangan (Size 2.8)", stock: 3, daysLeft: 2, velocity: "1.5/day" },
];

const ZERO_RESULT_SEARCHES = [
  { query: "emerald green glass chudi", count: 47 },
  { query: "temple design gold kangan", count: 35 },
  { query: "rose gold pearl bracelet", count: 28 },
  { query: "oxidized silver kada", count: 22 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const maxRevenue = Math.max(...REVENUE_DATA.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Demand Intelligence</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">Real-time analytics & predictive insights</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1.5 text-xs rounded-lg transition-all ${timeRange === range ? "bg-gold text-obsidian font-semibold" : "glass text-ivory-muted/50 hover:text-gold"}`}>
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold text-rose-400">Low Stock Risk Predictor</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LOW_STOCK_ALERTS.map((alert) => (
            <div key={alert.sku} className="flex items-center justify-between p-3 rounded-lg glass">
              <div>
                <p className="text-xs text-ivory font-medium">{alert.name}</p>
                <p className="text-[10px] text-ivory-muted/40 mt-0.5">{alert.sku} · Selling {alert.velocity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-400">{alert.stock} left</p>
                <p className="text-[10px] text-rose-400/60">~{alert.daysLeft} days</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue + Category Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Native SVG Revenue Trend Chart */}
        <div className="lg:col-span-2 rounded-xl glass p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-semibold text-ivory">Revenue Trend</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> +18.2%</span>
              <span className="text-ivory-muted/30">vs last period</span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="h-56 w-full relative">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 45, 90, 135, 180].map((y, idx) => (
                <line key={idx} x1="0" y1={y} x2="500" y2={y} stroke="rgba(212,175,55,0.08)" strokeDasharray="4 4" />
              ))}

              {/* Area path */}
              <path
                d={`M 0,180 ${REVENUE_DATA.map((d, i) => `L ${(i * 500) / 6},${160 - (d.revenue / maxRevenue) * 140}`).join(" ")} L 500,180 Z`}
                fill="url(#goldGradient)"
              />

              {/* Line path */}
              <path
                d={`M 0,${160 - (REVENUE_DATA[0].revenue / maxRevenue) * 140} ${REVENUE_DATA.map((d, i) => `L ${(i * 500) / 6},${160 - (d.revenue / maxRevenue) * 140}`).join(" ")}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Points */}
              {REVENUE_DATA.map((d, i) => {
                const cx = (i * 500) / 6;
                const cy = 160 - (d.revenue / maxRevenue) * 140;
                return (
                  <g key={i} className="group cursor-pointer">
                    <circle cx={cx} cy={cy} r="5" fill="#D4AF37" className="transition-transform group-hover:scale-150" />
                    <circle cx={cx} cy={cy} r="9" fill="#D4AF37" opacity="0.2" />
                  </g>
                );
              })}
            </svg>

            {/* X Axis labels */}
            <div className="flex justify-between mt-3 text-[10px] text-ivory-muted/40 font-mono">
              {REVENUE_DATA.map((d) => (
                <span key={d.date}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Category Split */}
        <div className="rounded-xl glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-ivory">Category Split</h3>
          </div>

          <div className="space-y-4">
            {CATEGORY_DATA.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ivory-muted/70">{cat.name}</span>
                  <span className="text-gold font-bold">{cat.value}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ivory/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products + Size Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-xl glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-ivory">Top Trending Products</h3>
          </div>
          <div className="space-y-2">
            {TOP_PRODUCTS.map((product, i) => (
              <div key={product.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gold/[0.02] transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-gold text-obsidian" : i === 1 ? "bg-ivory/10 text-ivory" : "bg-ivory/5 text-ivory-muted/40"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ivory truncate">{product.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-ivory-muted/40"><Eye className="w-2.5 h-2.5 inline mr-0.5" /> {product.views}</span>
                    <span className="text-[10px] text-ivory-muted/40"><ShoppingCart className="w-2.5 h-2.5 inline mr-0.5" /> {product.carted}</span>
                    <span className="text-[10px] text-emerald-400/70"><Package className="w-2.5 h-2.5 inline mr-0.5" /> {product.converted}</span>
                  </div>
                </div>
                <span className="text-xs text-gold font-semibold">₹{(product.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

        {/* Size Popularity Bar List */}
        <div className="rounded-xl glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-ivory">Size Demand Distribution</h3>
          </div>
          <div className="space-y-3.5 pt-2">
            {SIZE_DATA.map((item) => (
              <div key={item.size} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ivory font-medium">Size {item.size}</span>
                  <span className="text-indigo-400 font-semibold">{item.demand}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ivory/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                    style={{ width: `${item.demand * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Stack Intelligence + Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Stack Combos */}
        <div className="rounded-xl glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-ivory">Custom 3D Stack Intelligence</h3>
          </div>
          <p className="text-xs text-ivory-muted/40 mb-3">Most popular bangle combinations from the 3D Customizer</p>
          <div className="space-y-2">
            {POPULAR_STACKS.map((stack, i) => (
              <div key={i} className="p-3 rounded-lg glass hover:bg-gold/[0.02] transition-colors">
                <p className="text-xs text-ivory leading-relaxed">{stack.combo}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-ivory-muted/40"><Users className="w-2.5 h-2.5 inline mr-0.5" /> {stack.frequency}× built</span>
                  <span className="text-[10px] text-emerald-400"><TrendingUp className="w-2.5 h-2.5 inline mr-0.5" /> {stack.conversion} convert</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="rounded-xl glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-ivory">Live Activity Stream</h3>
          </div>
          <div className="space-y-2">
            {LIVE_ACTIVITY.map((activity, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gold/[0.02] transition-colors">
                <div className="w-7 h-7 rounded-full glass flex items-center justify-center flex-shrink-0 mt-0.5">
                  <activity.icon className="w-3.5 h-3.5 text-gold/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ivory">{activity.action}</p>
                  <p className="text-[10px] text-ivory-muted/35 mt-0.5">{activity.location} · {activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Zero-result searches */}
          <div className="mt-4 pt-4 border-t border-gold/10">
            <p className="text-[10px] tracking-wider uppercase text-ivory-muted/30 mb-2">Missing Product Searches</p>
            <div className="flex flex-wrap gap-1.5">
              {ZERO_RESULT_SEARCHES.map((s) => (
                <span key={s.query} className="px-2 py-1 text-[10px] rounded-full glass text-ivory-muted/50 border border-gold/10">
                  &ldquo;{s.query}&rdquo; ({s.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
