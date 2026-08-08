"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Paintbrush,
  ShoppingCart,
  BarChart3,
  Settings,
  Crown,
  ChevronLeft,
  LogOut,
  Bell,
  User,
  Search,
  Command,
  TrendingUp,
  Tag,
  Users,
  IndianRupee,
  Flame,
  Sun,
  Moon,
  X,
  ArrowRight,
  Zap,
  Eye,
} from "lucide-react";
import { getAssetUrl } from "@/lib/assets";

/* ═══════════════════════════════════════════════════════════
   Admin Layout — Enterprise Shell
   Cmd+K Command Palette · KPI Ambient Header · Collapsible Sidebar
   ═══════════════════════════════════════════════════════════ */

const SIDEBAR_SECTIONS = [
  {
    title: "Core",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { href: "/admin/analytics", label: "Demand Intel", icon: BarChart3 },
      { href: "/admin/configurator", label: "3D Configurator", icon: Paintbrush },
    ],
  },
  {
    title: "Governance",
    links: [
      { href: "/admin/gold-rates", label: "Gold Rates", icon: IndianRupee },
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_LINKS = SIDEBAR_SECTIONS.flatMap((s) => s.links);

const LIVE_KPIS = [
  { label: "Revenue Today", value: "₹3,42,800", change: "+12.4%", positive: true, icon: IndianRupee },
  { label: "Orders Today", value: "47", change: "+8", positive: true, icon: ShoppingCart },
  { label: "Live Visitors", value: "312", change: "", positive: true, icon: Eye },
  { label: "Gold Rate 22K", value: "₹7,200/g", change: "+₹45", positive: true, icon: TrendingUp },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showCmdK, setShowCmdK] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [notifications, setNotifications] = useState(3);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdK((v) => !v);
        setCmdSearch("");
      }
      if (e.key === "Escape") {
        setShowCmdK(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus search input when command palette opens
  useEffect(() => {
    if (showCmdK) {
      setTimeout(() => cmdInputRef.current?.focus(), 100);
    }
  }, [showCmdK]);

  const filteredLinks = cmdSearch
    ? ALL_LINKS.filter((l) =>
        l.label.toLowerCase().includes(cmdSearch.toLowerCase())
      )
    : ALL_LINKS;

  const currentPageTitle =
    ALL_LINKS.find((l) => l.href === pathname)?.label || "Dashboard";

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-obsidian" : "bg-[#F8FAFC]"
      }`}
    >
      {/* ═══ Sidebar ═══ */}
      <aside
        className={`flex flex-col transition-all duration-300 border-r ${
          collapsed ? "w-[68px]" : "w-64"
        } ${
          isDark
            ? "bg-obsidian-light/50 border-gold/5"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Logo */}
        <div
          className={`p-4 flex items-center justify-between border-b ${
            isDark ? "border-gold/5" : "border-gray-100"
          }`}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden border border-gold/40 shadow-gold flex-shrink-0">
              <img
                src={getAssetUrl("/logo.jpg")}
                alt="Anand Kangan Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {!collapsed && (
              <span
                className={`font-serif text-sm tracking-wider whitespace-nowrap ${
                  isDark ? "text-gradient-gold" : "text-gray-900 font-bold"
                }`}
              >
                ANAND KANGAN
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-md transition-colors ${
              isDark
                ? "text-ivory-muted/40 hover:text-gold hover:bg-gold/5"
                : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-full ${
                isDark
                  ? "bg-maroon/20 text-ruby border border-maroon/30"
                  : "bg-indigo-50 text-indigo-600 border border-indigo-200"
              }`}
            >
              <Zap className="w-3 h-3" />
              Super Admin
            </span>
          </div>
        )}

        {/* Nav Sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p
                  className={`px-3 mb-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase ${
                    isDark ? "text-ivory-muted/25" : "text-gray-400"
                  }`}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        collapsed ? "justify-center px-0" : ""
                      } ${
                        isActive
                          ? isDark
                            ? "bg-gold/10 text-gold border border-gold/15"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : isDark
                          ? "text-ivory-muted/60 hover:text-gold hover:bg-gold/5 border border-transparent"
                          : "text-gray-600 hover:text-indigo-700 hover:bg-indigo-50/50 border border-transparent"
                      }`}
                      title={collapsed ? link.label : undefined}
                    >
                      <link.icon
                        className="w-4 h-4 flex-shrink-0"
                        strokeWidth={1.5}
                      />
                      {!collapsed && <span>{link.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div
          className={`p-2 border-t ${
            isDark ? "border-gold/5" : "border-gray-100"
          }`}
        >
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              collapsed ? "justify-center px-0" : ""
            } ${
              isDark
                ? "text-ivory-muted/50 hover:text-gold hover:bg-gold/5"
                : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Back to Store</span>}
          </Link>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header
          className={`h-14 border-b flex items-center justify-between px-6 flex-shrink-0 ${
            isDark
              ? "bg-obsidian-light/30 border-gold/5"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <h2
              className={`text-sm font-semibold ${
                isDark ? "text-ivory" : "text-gray-900"
              }`}
            >
              {currentPageTitle}
            </h2>

            {/* Search trigger */}
            <button
              onClick={() => setShowCmdK(true)}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isDark
                  ? "bg-obsidian border border-gold/10 text-ivory-muted/40 hover:border-gold/25 hover:text-gold"
                  : "bg-gray-50 border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd
                className={`ml-4 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isDark
                    ? "bg-gold/10 text-gold/60 border border-gold/15"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark/Light toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "text-ivory-muted/50 hover:text-gold hover:bg-gold/5"
                  : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Notifications */}
            <button
              className={`relative p-2 rounded-lg transition-colors ${
                isDark
                  ? "text-ivory-muted/50 hover:text-gold hover:bg-gold/5"
                  : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark
                  ? "bg-gold/10 border border-gold/20"
                  : "bg-indigo-100 border border-indigo-200"
              }`}
            >
              <User
                className={`w-4 h-4 ${
                  isDark ? "text-gold" : "text-indigo-600"
                }`}
                strokeWidth={1.5}
              />
            </div>
          </div>
        </header>

        {/* KPI Ambient Strip */}
        <div
          className={`flex items-center gap-6 px-6 py-2.5 border-b overflow-x-auto flex-shrink-0 ${
            isDark
              ? "bg-obsidian border-gold/5"
              : "bg-gradient-to-r from-indigo-50/50 to-white border-gray-100"
          }`}
        >
          {LIVE_KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="flex items-center gap-2.5 flex-shrink-0"
            >
              <kpi.icon
                className={`w-3.5 h-3.5 ${
                  isDark ? "text-gold/50" : "text-indigo-400"
                }`}
                strokeWidth={1.5}
              />
              <div>
                <p
                  className={`text-[10px] tracking-wider uppercase ${
                    isDark ? "text-ivory-muted/30" : "text-gray-400"
                  }`}
                >
                  {kpi.label}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold ${
                      isDark ? "text-ivory" : "text-gray-900"
                    }`}
                  >
                    {kpi.value}
                  </span>
                  {kpi.change && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {kpi.change}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Page Content */}
        <main
          className={`flex-1 overflow-y-auto p-6 ${
            isDark ? "" : "bg-[#F8FAFC]"
          }`}
        >
          {children}
        </main>
      </div>

      {/* ═══ Command Palette (Cmd+K) ═══ */}
      <AnimatePresence>
        {showCmdK && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCmdK(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`fixed top-[15%] left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl ${
                isDark
                  ? "bg-obsidian-light border border-gold/10"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Search input */}
              <div
                className={`flex items-center gap-3 px-4 py-3 border-b ${
                  isDark ? "border-gold/10" : "border-gray-100"
                }`}
              >
                <Search
                  className={`w-5 h-5 flex-shrink-0 ${
                    isDark ? "text-gold/60" : "text-indigo-400"
                  }`}
                />
                <input
                  ref={cmdInputRef}
                  type="text"
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  placeholder="Search pages, products, orders..."
                  className={`flex-1 bg-transparent outline-none text-sm ${
                    isDark
                      ? "text-ivory placeholder:text-ivory-muted/30"
                      : "text-gray-900 placeholder:text-gray-400"
                  }`}
                />
                <kbd
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isDark
                      ? "bg-gold/10 text-gold/40 border border-gold/15"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                <p
                  className={`px-4 py-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase ${
                    isDark ? "text-ivory-muted/25" : "text-gray-400"
                  }`}
                >
                  Navigate to
                </p>
                {filteredLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowCmdK(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      isDark
                        ? "hover:bg-gold/5 text-ivory-muted/70 hover:text-gold"
                        : "hover:bg-indigo-50 text-gray-600 hover:text-indigo-700"
                    }`}
                  >
                    <link.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm">{link.label}</span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 ${
                        isDark ? "text-gold/40" : "text-indigo-300"
                      }`}
                    />
                  </Link>
                ))}
                {filteredLinks.length === 0 && (
                  <p
                    className={`px-4 py-6 text-center text-sm ${
                      isDark ? "text-ivory-muted/30" : "text-gray-400"
                    }`}
                  >
                    No results for &ldquo;{cmdSearch}&rdquo;
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
