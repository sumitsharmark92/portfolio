import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        foreground: "#ededed",
        cyber: {
          void: "#060608",
          black: "#0a0a0c",
          dark: "#121216",
          card: "#15151c",
          border: "#1f1f2e",
          borderBright: "#2e2e48",
          textMuted: "#8e8ea0",
          textLight: "#d1d5db",
        },
        neon: {
          green: "#00ff66",
          greenDim: "#00cc52",
          cyan: "#00f0ff",
          cyanDim: "#00b8c4",
          amber: "#ffb703",
          red: "#ff2a5f",
          purple: "#9d4edd",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glowGreen: "0 0 20px rgba(0, 255, 102, 0.25)",
        glowCyan: "0 0 20px rgba(0, 240, 255, 0.25)",
        glowAmber: "0 0 20px rgba(255, 183, 3, 0.25)",
        glowRed: "0 0 25px rgba(255, 42, 95, 0.35)",
        cyberCard: "0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
        "glitch": "glitch 1s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
