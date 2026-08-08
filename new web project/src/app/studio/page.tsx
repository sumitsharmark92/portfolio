"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Expand,
  Sun,
  Sunset,
  Lightbulb,
  Flame,
  Volume2,
  VolumeX,
  ShoppingBag,
  Layers,
  ChevronDown,
  GripVertical,
  Camera,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import CartDrawer from "@/components/ui/CartDrawer";
import {
  useCustomizerStore,
  MATERIAL_PRESETS,
  BANGLE_SIZES,
  generateBangleId,
  type BangleMaterialType,
  type LightingPreset,
} from "@/store/customizer";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/pricing";
import { playBangleSound } from "@/lib/audio";

// Dynamic import — 3D scene cannot SSR
const Scene = dynamic(() => import("@/components/3d/Scene"), { ssr: false });

/* ═══════════════════════════════════════════════════════════
   Studio Page — The 3D Bangle Customizer Experience
   ═══════════════════════════════════════════════════════════ */

const LIGHTING_OPTIONS: { key: LightingPreset; label: string; icon: any }[] = [
  { key: "royal", label: "Royal Palace", icon: Sun },
  { key: "golden-hour", label: "Golden Hour", icon: Sunset },
  { key: "studio", label: "Studio Clean", icon: Lightbulb },
  { key: "festive", label: "Festive", icon: Flame },
];

const MATERIAL_ORDER: BangleMaterialType[] = [
  "gold",
  "glass",
  "kundan",
  "pearl",
  "brass",
  "diamond",
];

const BANGLE_COLORS: Record<BangleMaterialType, string[]> = {
  gold: ["#FFD700", "#DAA520", "#F5C542", "#B8860B", "#CD853F"],
  glass: ["#E63946", "#2D6A4F", "#1D3557", "#FF6B35", "#9B2335", "#4A0E17", "#065F46", "#FF1493"],
  kundan: ["#E8C547", "#D4AF37", "#B8941F", "#FFB347"],
  pearl: ["#FFF8DC", "#FAEBD7", "#FFE4C4", "#FFF0DB"],
  brass: ["#B5A642", "#CD853F", "#8B7355", "#A0522D"],
  diamond: ["#B9F2FF", "#E0F7FA", "#F0F8FF", "#CCEFFF"],
};

export default function StudioPage() {
  const {
    stack,
    selectedIndex,
    lightingPreset,
    isExplodedView,
    isAutoRotate,
    wristSize,
    isSoundEnabled,
    addBangle,
    removeBangle,
    selectBangle,
    clearStack,
    setLightingPreset,
    toggleExplodedView,
    toggleAutoRotate,
    setWristSize,
    toggleSound,
    getTotalPrice,
  } = useCustomizerStore();

  const addToCart = useCartStore((s) => s.addToCart);

  const selectedBangle = selectedIndex !== null ? stack[selectedIndex] : null;

  // Add a new bangle to the stack
  function handleAddBangle(material: BangleMaterialType) {
    const preset = MATERIAL_PRESETS[material];
    const newBangle = {
      id: generateBangleId(),
      name: `${preset.label} Bangle`,
      type: material === "gold" || material === "brass" ? "KANGAN" as const : "CHUDI" as const,
      material,
      size: wristSize,
      colorHex: preset.colorHex,
      metalness: preset.metalness,
      roughness: preset.roughness,
      clearcoat: preset.clearcoat,
      transmission: preset.transmission,
      thickness: preset.thickness,
      ior: preset.ior,
      outerRadius: 1,
      tubeRadius: 1,
      basePrice: preset.basePrice,
      goldWeightGrams: preset.goldWeightGrams,
      makingCharge: preset.makingCharge,
    };

    addBangle(newBangle);
    if (isSoundEnabled) playBangleSound(material);
  }

  // Add current stack to cart
  function handleAddToCart() {
    if (stack.length === 0) return;
    addToCart({
      name: `Custom Stack · ${stack.length} Bangles`,
      stack: [...stack],
      quantity: 1,
      unitPrice: getTotalPrice(),
      wristSize,
    });
  }

  return (
    <main className="bg-obsidian min-h-screen">
      <Navbar />
      <CartDrawer />

      <div className="pt-20 h-screen flex flex-col lg:flex-row">
        {/* ─── 3D Viewport (Left) ─── */}
        <div className="relative flex-1 lg:flex-[2] min-h-[50vh] lg:min-h-0">
          <Scene
            className="w-full h-full"
            cameraPosition={[0, 1.5, 4.5]}
            minDistance={2.5}
            maxDistance={7}
          />

          {/* Viewport Overlay Controls */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10">
            {/* Left controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleExplodedView}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  isExplodedView
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "glass text-ivory-muted hover:text-gold"
                }`}
                title="Exploded View"
              >
                <Expand className="w-4 h-4" />
              </button>
              <button
                onClick={toggleAutoRotate}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  isAutoRotate
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "glass text-ivory-muted hover:text-gold"
                }`}
                title="Auto Rotate"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleSound}
                className="p-2.5 rounded-lg glass text-ivory-muted hover:text-gold transition-all"
                title={isSoundEnabled ? "Mute Sounds" : "Enable Sounds"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Stack info */}
            <div className="glass px-4 py-2 rounded-lg flex items-center gap-3">
              <Layers className="w-4 h-4 text-gold" />
              <span className="text-sm text-ivory">
                {stack.length} Bangles
              </span>
              <span className="text-sm font-semibold text-gold">
                {formatPrice(getTotalPrice())}
              </span>
            </div>

            {/* AR Button (Phase 2) */}
            <button
              className="p-2.5 rounded-lg glass text-ivory-muted hover:text-gold transition-all opacity-50 cursor-not-allowed"
              title="AR Try-On (Coming Soon)"
              disabled
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Control Panel (Right) ─── */}
        <div className="lg:flex-1 lg:max-w-md xl:max-w-lg border-l border-gold/5 overflow-y-auto bg-obsidian-light/50">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">
                Bangle Studio
              </h1>
              <p className="text-sm text-ivory-muted/50 mt-1">
                Build your perfect bangle stack
              </p>
            </div>

            <div className="divider-gold" />

            {/* ─── Wrist Size ─── */}
            <div>
              <label className="text-xs tracking-widest uppercase text-gold mb-3 block">
                Wrist Size
              </label>
              <div className="flex gap-2">
                {BANGLE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setWristSize(size)}
                    className={`flex-1 py-2 text-sm rounded-lg transition-all duration-300 ${
                      wristSize === size
                        ? "bg-gold text-obsidian font-semibold"
                        : "glass text-ivory-muted hover:text-gold hover:border-gold/30"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Add Bangles (Material Selector) ─── */}
            <div>
              <label className="text-xs tracking-widest uppercase text-gold mb-3 block">
                Add Bangle
              </label>
              <div className="grid grid-cols-3 gap-3">
                {MATERIAL_ORDER.map((mat) => {
                  const preset = MATERIAL_PRESETS[mat];
                  return (
                    <button
                      key={mat}
                      onClick={() => handleAddBangle(mat)}
                      className="group relative p-3 rounded-xl glass hover:glass-gold transition-all duration-300 text-center"
                    >
                      {/* Material swatch */}
                      <div className="relative mx-auto mb-2">
                        <div
                          className="w-10 h-10 rounded-full border-[3px] mx-auto transition-transform duration-300 group-hover:scale-110"
                          style={{
                            borderColor: preset.colorHex,
                            boxShadow: `0 0 15px ${preset.colorHex}25`,
                          }}
                        />
                        <Plus className="absolute -bottom-1 -right-1 w-4 h-4 text-gold bg-obsidian rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[11px] text-ivory-muted group-hover:text-gold transition-colors">
                        {preset.label}
                      </span>
                      <span className="block text-[10px] text-ivory-muted/40 mt-0.5">
                        {formatPrice(preset.basePrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Color Palette (for selected bangle) ─── */}
            <AnimatePresence>
              {selectedBangle && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="text-xs tracking-widest uppercase text-gold mb-3 block">
                    Color · {selectedBangle.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(BANGLE_COLORS[selectedBangle.material] || []).map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => {
                            useCustomizerStore
                              .getState()
                              .updateBangle(selectedBangle.id, {
                                colorHex: color,
                              });
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-300 hover:scale-110 ${
                            selectedBangle.colorHex === color
                              ? "border-gold scale-110 shadow-gold"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Lighting Presets ─── */}
            <div>
              <label className="text-xs tracking-widest uppercase text-gold mb-3 block">
                Lighting
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LIGHTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setLightingPreset(opt.key)}
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-all duration-300 ${
                      lightingPreset === opt.key
                        ? "bg-gold/15 text-gold border border-gold/25"
                        : "glass text-ivory-muted hover:text-gold"
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider-gold" />

            {/* ─── Stack List ─── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs tracking-widest uppercase text-gold">
                  Your Stack ({stack.length})
                </label>
                {stack.length > 0 && (
                  <button
                    onClick={clearStack}
                    className="text-xs text-ivory-muted/40 hover:text-ruby transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {stack.length === 0 ? (
                <div className="text-center py-8 text-ivory-muted/30 text-sm">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Add bangles to start building your stack
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stack.map((bangle, index) => (
                    <motion.div
                      key={bangle.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => selectBangle(index)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        selectedIndex === index
                          ? "bg-gold/10 border border-gold/20"
                          : "bg-obsidian/30 border border-transparent hover:border-gold/10"
                      }`}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-ivory-muted/20 flex-shrink-0" />
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 border-2"
                        style={{
                          backgroundColor: bangle.colorHex,
                          borderColor: `${bangle.colorHex}80`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ivory truncate">
                          {bangle.name}
                        </p>
                        <p className="text-[10px] text-ivory-muted/40">
                          Size {bangle.size}
                        </p>
                      </div>
                      <span className="text-xs text-gold flex-shrink-0">
                        {formatPrice(bangle.basePrice)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBangle(bangle.id);
                        }}
                        className="p-1 text-ivory-muted/30 hover:text-ruby transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Price Summary ─── */}
            {stack.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 rounded-xl glass-gold"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-ivory-muted">
                    {stack.length} Bangles
                  </span>
                  <span className="text-ivory">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ivory-muted">GST (3%)</span>
                  <span className="text-ivory">
                    {formatPrice(getTotalPrice() * 0.03)}
                  </span>
                </div>
                <div className="divider-gold" />
                <div className="flex justify-between">
                  <span className="font-serif text-lg text-ivory">Total</span>
                  <span className="font-serif text-lg text-gold font-semibold">
                    {formatPrice(getTotalPrice() * 1.03)}
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full mt-3"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add Stack to Cart
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
