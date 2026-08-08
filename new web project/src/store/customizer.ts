"use client";

import { create } from "zustand";

/* ═══════════════════════════════════════════════════════════
   Bangle Customizer Store
   Controls the 3D studio: bangle stack, materials, lighting
   ═══════════════════════════════════════════════════════════ */

export type BangleMaterialType =
  | "gold"
  | "glass"
  | "kundan"
  | "pearl"
  | "brass"
  | "diamond";

export type BangleCategory = "CHUDI" | "KANGAN" | "KUNDAN" | "BRACELET" | "SET";

export type LightingPreset = "royal" | "golden-hour" | "studio" | "festive";

export interface BangleItem {
  id: string;
  name: string;
  type: BangleCategory;
  material: BangleMaterialType;
  size: string;
  colorHex: string;
  // PBR Material Properties
  metalness: number;
  roughness: number;
  clearcoat: number;
  transmission: number;
  thickness: number;
  ior: number;
  // Geometry
  outerRadius: number;
  tubeRadius: number;
  // Pricing
  basePrice: number;
  goldWeightGrams: number;
  makingCharge: number;
}

export interface CustomizerState {
  // Stack
  stack: BangleItem[];
  selectedIndex: number | null;
  // Scene
  lightingPreset: LightingPreset;
  isExplodedView: boolean;
  isAutoRotate: boolean;
  wristSize: string;
  // Audio
  isSoundEnabled: boolean;
  // Actions
  addBangle: (bangle: BangleItem) => void;
  removeBangle: (id: string) => void;
  selectBangle: (index: number | null) => void;
  reorderStack: (fromIndex: number, toIndex: number) => void;
  updateBangle: (id: string, updates: Partial<BangleItem>) => void;
  clearStack: () => void;
  setLightingPreset: (preset: LightingPreset) => void;
  toggleExplodedView: () => void;
  toggleAutoRotate: () => void;
  setWristSize: (size: string) => void;
  toggleSound: () => void;
  getTotalPrice: () => number;
}

// Material presets for quick selection
export const MATERIAL_PRESETS: Record<
  BangleMaterialType,
  {
    label: string;
    colorHex: string;
    metalness: number;
    roughness: number;
    clearcoat: number;
    transmission: number;
    thickness: number;
    ior: number;
    basePrice: number;
    goldWeightGrams: number;
    makingCharge: number;
  }
> = {
  gold: {
    label: "24K Gold",
    colorHex: "#FFD700",
    metalness: 1.0,
    roughness: 0.15,
    clearcoat: 0.3,
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    basePrice: 15000,
    goldWeightGrams: 8,
    makingCharge: 2500,
  },
  glass: {
    label: "Glass",
    colorHex: "#E63946",
    metalness: 0.0,
    roughness: 0.05,
    clearcoat: 1.0,
    transmission: 0.95,
    thickness: 1.5,
    ior: 1.52,
    basePrice: 150,
    goldWeightGrams: 0,
    makingCharge: 50,
  },
  kundan: {
    label: "Kundan",
    colorHex: "#E8C547",
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 1.0,
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    basePrice: 8000,
    goldWeightGrams: 5,
    makingCharge: 4500,
  },
  pearl: {
    label: "Pearl",
    colorHex: "#FFF8DC",
    metalness: 0.1,
    roughness: 0.3,
    clearcoat: 0.8,
    transmission: 0.1,
    thickness: 0.5,
    ior: 1.53,
    basePrice: 3500,
    goldWeightGrams: 0,
    makingCharge: 1500,
  },
  brass: {
    label: "Brass",
    colorHex: "#B5A642",
    metalness: 0.85,
    roughness: 0.35,
    clearcoat: 0.2,
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    basePrice: 800,
    goldWeightGrams: 0,
    makingCharge: 300,
  },
  diamond: {
    label: "Diamond Cut",
    colorHex: "#B9F2FF",
    metalness: 0.05,
    roughness: 0.02,
    clearcoat: 1.0,
    transmission: 0.95,
    thickness: 0.8,
    ior: 2.42,
    basePrice: 25000,
    goldWeightGrams: 0,
    makingCharge: 8000,
  },
};

export const BANGLE_SIZES = [
  "2.2",
  "2.4",
  "2.6",
  "2.8",
  "2.10",
];

let bangleCounter = 0;

export function generateBangleId(): string {
  bangleCounter++;
  return `bangle_${Date.now()}_${bangleCounter}`;
}

export const useCustomizerStore = create<CustomizerState>((set, get) => ({
  // Initial State
  stack: [],
  selectedIndex: null,
  lightingPreset: "royal",
  isExplodedView: false,
  isAutoRotate: true,
  wristSize: "2.4",
  isSoundEnabled: true,

  // Actions
  addBangle: (bangle) =>
    set((state) => ({
      stack: [...state.stack, bangle],
      selectedIndex: state.stack.length,
    })),

  removeBangle: (id) =>
    set((state) => ({
      stack: state.stack.filter((b) => b.id !== id),
      selectedIndex: null,
    })),

  selectBangle: (index) => set({ selectedIndex: index }),

  reorderStack: (fromIndex, toIndex) =>
    set((state) => {
      const newStack = [...state.stack];
      const [moved] = newStack.splice(fromIndex, 1);
      newStack.splice(toIndex, 0, moved);
      return { stack: newStack };
    }),

  updateBangle: (id, updates) =>
    set((state) => ({
      stack: state.stack.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  clearStack: () => set({ stack: [], selectedIndex: null }),

  setLightingPreset: (preset) => set({ lightingPreset: preset }),

  toggleExplodedView: () =>
    set((state) => ({ isExplodedView: !state.isExplodedView })),

  toggleAutoRotate: () =>
    set((state) => ({ isAutoRotate: !state.isAutoRotate })),

  setWristSize: (size) => set({ wristSize: size }),

  toggleSound: () =>
    set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

  getTotalPrice: () => {
    const state = get();
    return state.stack.reduce((total, bangle) => {
      return total + bangle.basePrice + bangle.makingCharge;
    }, 0);
  },
}));
