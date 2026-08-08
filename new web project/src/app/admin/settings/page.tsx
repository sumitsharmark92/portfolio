"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Shield, Globe, Bell, Database, Users,
  CheckCircle2, X, Eye, EyeOff, AlertTriangle, Save,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Settings — RBAC · Site Config · Maintenance Mode
   ═══════════════════════════════════════════════════════════ */

const ROLES = ["Super Admin", "Store Manager", "Workshop Goldsmith", "Customer Support"];

const MODULES = [
  "Dashboard",
  "Products",
  "3D Configurator",
  "Orders",
  "Analytics",
  "Gold Rates",
  "Promotions",
  "Customers",
  "Settings",
];

type PermissionMatrix = Record<string, Record<string, boolean>>;

const INITIAL_PERMS: PermissionMatrix = {
  "Super Admin": Object.fromEntries(MODULES.map((m) => [m, true])),
  "Store Manager": Object.fromEntries(
    MODULES.map((m) => [m, !["Settings", "Gold Rates"].includes(m)])
  ),
  "Workshop Goldsmith": Object.fromEntries(
    MODULES.map((m) => [m, ["Dashboard", "Orders", "3D Configurator"].includes(m)])
  ),
  "Customer Support": Object.fromEntries(
    MODULES.map((m) => [m, ["Dashboard", "Orders", "Customers"].includes(m)])
  ),
};

export default function SettingsPage() {
  const [tab, setTab] = useState<"rbac" | "site" | "maintenance">("rbac");
  const [perms, setPerms] = useState<PermissionMatrix>(INITIAL_PERMS);
  const [siteTitle, setSiteTitle] = useState("Resplendence 3D");
  const [siteDescription, setSiteDescription] = useState(
    "Luxury Bangles & Kangan Collection — 3D Customizer"
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(
    "We're upgrading our platform. Back soon with new features!"
  );
  const [saved, setSaved] = useState(false);

  function togglePerm(role: string, module: string) {
    if (role === "Super Admin") return; // Can't modify super admin
    setPerms({
      ...perms,
      [role]: { ...perms[role], [module]: !perms[role][module] },
    });
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Settings</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">System configuration & access control</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {([["rbac", "Access Control", Shield], ["site", "Site Config", Globe], ["maintenance", "Maintenance", AlertTriangle]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg transition-all ${tab === key ? "bg-gold/10 text-gold border border-gold/15 font-semibold" : "glass text-ivory-muted/50 hover:text-gold"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* RBAC */}
      {tab === "rbac" && (
        <div className="rounded-xl glass overflow-hidden">
          <div className="px-5 py-3 border-b border-gold/10">
            <h3 className="text-sm font-semibold text-ivory">Role-Based Access Control</h3>
            <p className="text-[10px] text-ivory-muted/30 mt-0.5">Configure module access per role. Super Admin always has full access.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left px-5 py-3 text-xs tracking-wider uppercase text-ivory-muted/40 sticky left-0 bg-obsidian-light z-10">Module</th>
                  {ROLES.map((role) => (
                    <th key={role} className="text-center px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40 whitespace-nowrap">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((module) => (
                  <tr key={module} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] transition-colors">
                    <td className="px-5 py-3 text-sm text-ivory sticky left-0 bg-obsidian-light z-10">{module}</td>
                    {ROLES.map((role) => (
                      <td key={role} className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePerm(role, module)}
                          disabled={role === "Super Admin"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto ${
                            perms[role]?.[module]
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-ivory/5 text-ivory-muted/20 border border-ivory/5"
                          } ${role === "Super Admin" ? "opacity-60 cursor-not-allowed" : "hover:scale-110"}`}
                        >
                          {perms[role]?.[module] ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Config */}
      {tab === "site" && (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-xl glass p-5 space-y-4">
            <h3 className="text-sm font-semibold text-ivory flex items-center gap-2"><Globe className="w-4 h-4 text-gold" /> Site Metadata</h3>
            <div>
              <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">Site Title</label>
              <input type="text" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} className="input-dark w-full" />
            </div>
            <div>
              <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">Meta Description</label>
              <textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={2} className="input-dark w-full resize-none" />
            </div>
          </div>

          <div className="rounded-xl glass p-5 space-y-3">
            <h3 className="text-sm font-semibold text-ivory flex items-center gap-2"><Bell className="w-4 h-4 text-gold" /> Notification Preferences</h3>
            {["New order alerts", "Low stock notifications", "Customer registration", "Review submissions"].map((pref) => (
              <label key={pref} className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-sm text-ivory-muted/70">{pref}</span>
                <input type="checkbox" defaultChecked className="accent-gold w-4 h-4" />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance */}
      {tab === "maintenance" && (
        <div className="max-w-2xl space-y-4">
          <div className={`rounded-xl p-5 space-y-4 border ${maintenanceMode ? "bg-rose-500/5 border-rose-500/20" : "glass"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${maintenanceMode ? "text-rose-400" : "text-ivory-muted/40"}`} />
                <h3 className="text-sm font-semibold text-ivory">Maintenance Mode</h3>
              </div>
              <button onClick={() => setMaintenanceMode(!maintenanceMode)} className={`relative w-12 h-6 rounded-full transition-colors ${maintenanceMode ? "bg-rose-500" : "bg-ivory/10"}`}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: maintenanceMode ? "26px" : "4px" }} />
              </button>
            </div>
            {maintenanceMode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                <p className="text-xs text-rose-400/70">⚠️ The storefront will be inaccessible to customers while maintenance mode is active.</p>
                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">Maintenance Message</label>
                  <textarea value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} rows={2} className="input-dark w-full resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
