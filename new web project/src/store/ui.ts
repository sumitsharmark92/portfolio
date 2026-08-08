"use client";

import { create } from "zustand";

/* ═══════════════════════════════════════════════════════════
   UI Store
   Global UI state: theme, loading, modals
   ═══════════════════════════════════════════════════════════ */

interface UIState {
  theme: "dark" | "light";
  isLoading: boolean;
  loadingProgress: number; // 0-100 for 3D asset loading
  loadingText: string;
  isSizeGuideOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeModal: string | null;
  // Actions
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean, text?: string) => void;
  setLoadingProgress: (progress: number) => void;
  toggleSizeGuide: () => void;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  isLoading: false,
  loadingProgress: 0,
  loadingText: "Loading...",
  isSizeGuideOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  activeModal: null,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),

  setLoading: (loading, text) =>
    set({
      isLoading: loading,
      loadingText: text || "Loading...",
      loadingProgress: loading ? 0 : 100,
    }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  toggleSizeGuide: () =>
    set((state) => ({ isSizeGuideOpen: !state.isSizeGuideOpen })),

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
