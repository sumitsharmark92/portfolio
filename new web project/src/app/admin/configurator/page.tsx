"use client";

import { useState, Suspense, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Save, RotateCcw, Eye, Palette, Sliders, Sparkles } from "lucide-react";

// Dynamic Canvas for admin 3D configurator
const AdminCanvas = dynamic(() => import("./AdminCanvas"), { ssr: false });

/* ═══════════════════════════════════════════════════════════
   Admin 3D Configurator — Real-time PBR Material Editor
   ═══════════════════════════════════════════════════════════ */

interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  envMapIntensity: number;
  emissiveIntensity: number;
}

const DEFAULT_CONFIG: MaterialConfig = {
  color: "#FFD700",
  metalness: 1.0,
  roughness: 0.15,
  clearcoat: 0.3,
  clearcoatRoughness: 0.1,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  envMapIntensity: 1.5,
  emissiveIntensity: 0,
};

const PRESET_MATERIALS: { name: string; config: MaterialConfig }[] = [
  {
    name: "24K Gold",
    config: { ...DEFAULT_CONFIG, color: "#FFD700", metalness: 1, roughness: 0.12, clearcoat: 0.3, transmission: 0 },
  },
  {
    name: "Red Glass",
    config: { ...DEFAULT_CONFIG, color: "#E63946", metalness: 0, roughness: 0.05, clearcoat: 1, transmission: 0.95, thickness: 1.5, ior: 1.52 },
  },
  {
    name: "Kundan Gold",
    config: { ...DEFAULT_CONFIG, color: "#E8C547", metalness: 0.9, roughness: 0.2, clearcoat: 1 },
  },
  {
    name: "Pearl",
    config: { ...DEFAULT_CONFIG, color: "#FFF8DC", metalness: 0.1, roughness: 0.3, clearcoat: 0.8 },
  },
  {
    name: "Brass",
    config: { ...DEFAULT_CONFIG, color: "#B5A642", metalness: 0.85, roughness: 0.35, clearcoat: 0.2 },
  },
  {
    name: "Diamond",
    config: { ...DEFAULT_CONFIG, color: "#B9F2FF", metalness: 0.05, roughness: 0.02, clearcoat: 1, transmission: 0.95, thickness: 0.8, ior: 2.42 },
  },
];

export default function AdminConfiguratorPage() {
  const [config, setConfig] = useState<MaterialConfig>(DEFAULT_CONFIG);

  function updateConfig(key: keyof MaterialConfig, value: number | string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(preset: MaterialConfig) {
    setConfig(preset);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">
            3D Material Configurator
          </h1>
          <p className="text-sm text-ivory-muted/50 mt-1">
            Adjust PBR material properties in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfig(DEFAULT_CONFIG)}
            className="btn-secondary"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button className="btn-primary">
            <Save className="w-4 h-4" />
            Save Preset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* 3D Preview */}
        <div className="xl:col-span-2 rounded-xl glass overflow-hidden relative">
          <AdminCanvas config={config} />

          {/* Preview badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-ivory-muted">
            <Eye className="w-3.5 h-3.5 text-gold" />
            Live Preview
          </div>
        </div>

        {/* Controls Panel */}
        <div className="rounded-xl glass overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Material Presets */}
            <div>
              <label className="text-xs tracking-widest uppercase text-gold mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Quick Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_MATERIALS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.config)}
                    className="p-2 rounded-lg glass hover:glass-gold transition-all text-center text-xs group"
                  >
                    <div
                      className="w-6 h-6 rounded-full mx-auto mb-1 border-2 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: preset.config.color,
                        borderColor: `${preset.config.color}80`,
                      }}
                    />
                    <span className="text-ivory-muted group-hover:text-gold transition-colors">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divider-gold" />

            {/* Color Picker */}
            <div>
              <label className="text-xs tracking-widest uppercase text-gold mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => updateConfig("color", e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gold/20 bg-transparent"
                />
                <input
                  type="text"
                  value={config.color}
                  onChange={(e) => updateConfig("color", e.target.value)}
                  className="input-dark flex-1 uppercase text-sm"
                />
              </div>
            </div>

            <div className="divider-gold" />

            {/* PBR Sliders */}
            <div>
              <label className="text-xs tracking-widest uppercase text-gold mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                PBR Properties
              </label>
              <div className="space-y-4">
                <SliderControl
                  label="Metalness"
                  value={config.metalness}
                  onChange={(v) => updateConfig("metalness", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <SliderControl
                  label="Roughness"
                  value={config.roughness}
                  onChange={(v) => updateConfig("roughness", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <SliderControl
                  label="Clearcoat"
                  value={config.clearcoat}
                  onChange={(v) => updateConfig("clearcoat", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <SliderControl
                  label="Clearcoat Roughness"
                  value={config.clearcoatRoughness}
                  onChange={(v) => updateConfig("clearcoatRoughness", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <SliderControl
                  label="Transmission"
                  value={config.transmission}
                  onChange={(v) => updateConfig("transmission", v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <SliderControl
                  label="Thickness"
                  value={config.thickness}
                  onChange={(v) => updateConfig("thickness", v)}
                  min={0}
                  max={5}
                  step={0.1}
                />
                <SliderControl
                  label="IOR"
                  value={config.ior}
                  onChange={(v) => updateConfig("ior", v)}
                  min={1}
                  max={3}
                  step={0.01}
                />
                <SliderControl
                  label="Environment Intensity"
                  value={config.envMapIntensity}
                  onChange={(v) => updateConfig("envMapIntensity", v)}
                  min={0}
                  max={3}
                  step={0.1}
                />
                <SliderControl
                  label="Emissive Intensity"
                  value={config.emissiveIntensity}
                  onChange={(v) => updateConfig("emissiveIntensity", v)}
                  min={0}
                  max={2}
                  step={0.05}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Slider Control Component ─── */
function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-ivory-muted/60">{label}</span>
        <span className="text-xs text-gold font-mono">{value.toFixed(2)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-obsidian-lighter"
          style={{
            background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${percentage}%, #252530 ${percentage}%, #252530 100%)`,
          }}
        />
      </div>
    </div>
  );
}
