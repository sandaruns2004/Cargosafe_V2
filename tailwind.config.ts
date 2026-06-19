import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        base: "#050a14",
        surface: "rgba(255, 255, 255, 0.04)",
        "surface-hover": "rgba(255, 255, 255, 0.07)",
        "surface-active": "rgba(26, 111, 255, 0.12)",

        // Borders
        edge: "rgba(255, 255, 255, 0.09)",
        "edge-accent": "rgba(26, 111, 255, 0.4)",

        // Text
        "txt-primary": "#f0f4ff",
        "txt-secondary": "#8a9bc0",
        "txt-muted": "rgba(255, 255, 255, 0.28)",

        // Accent palette
        neon: "#1a6fff",
        teal: "#00c9a7",
        coral: "#ff4d6d",
        amber: "#f59e0b",
        violet: "#8b5cf6",

        // Neon variants for backgrounds/borders
        "neon/10": "rgba(26, 111, 255, 0.10)",
        "neon/15": "rgba(26, 111, 255, 0.15)",
        "neon/20": "rgba(26, 111, 255, 0.20)",
        "teal/10": "rgba(0, 201, 167, 0.10)",
        "teal/15": "rgba(0, 201, 167, 0.15)",
        "coral/10": "rgba(255, 77, 109, 0.10)",
        "coral/15": "rgba(255, 77, 109, 0.15)",
        "amber/10": "rgba(245, 158, 11, 0.10)",
        "amber/15": "rgba(245, 158, 11, 0.15)",
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        card: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        glow: "0 0 24px rgba(26,111,255,0.2)",
        "glow-lg": "0 0 48px rgba(26,111,255,0.3)",
        "neon-btn": "0 4px 20px rgba(26,111,255,0.35)",
        "neon-btn-hover": "0 8px 32px rgba(26,111,255,0.5)",
        float: "0 12px 32px rgba(0,0,0,0.3)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fadeIn 0.4s ease both",
        "slide-in": "slideIn 0.3s ease both",
        shimmer: "shimmer 1.5s ease-in-out infinite alternate",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "orb-drift": "orbDrift 16s ease-in-out infinite alternate",
        "spin-slow": "spin 2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          from: { opacity: "0.4" },
          to: { opacity: "0.8" },
        },
        orbDrift: {
          from: { transform: "translate(0,0) scale(1)" },
          to: { transform: "translate(40px,25px) scale(1.1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backdropBlur: {
        xs: "4px",
        "2xl": "28px",
        "3xl": "40px",
      },
    },
  },
  plugins: [],
}
export default config
