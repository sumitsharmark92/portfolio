"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BangleItem } from "./customizer";

/* ═══════════════════════════════════════════════════════════
   Cart Store
   Manages shopping cart with dynamic pricing & persistence
   ═══════════════════════════════════════════════════════════ */

export interface CartItem {
  id: string;
  name: string;
  stack: BangleItem[];
  quantity: number;
  unitPrice: number;
  wristSize: string;
  snapshotUrl?: string; // 3D preview snapshot
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  goldRatePerGram: number; // Current gold rate (22K per gram in INR)
  taxRate: number; // GST rate (0.03 = 3%)
  // Actions
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setGoldRate: (rate: number) => void;
  // Computed
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      goldRatePerGram: 7200, // Default 22K gold rate per gram in INR
      taxRate: 0.03, // 3% GST on gold jewelry

      addToCart: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...item, id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
          ],
          isOpen: true,
        })),

      removeFromCart: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setGoldRate: (rate) => set({ goldRatePerGram: rate }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.unitPrice * item.quantity,
          0
        );
      },

      getTax: () => {
        const state = get();
        return state.getSubtotal() * state.taxRate;
      },

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.getTax();
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "resplendence-cart",
      partialize: (state) => ({
        items: state.items,
        goldRatePerGram: state.goldRatePerGram,
      }),
    }
  )
);
