import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        // Main background
        ivory: "#F8F5EA",

        // Main text
        ink: "#30351F",

        // Primary brand colour — Olive Green
        rani: {
          DEFAULT: "#68723A",
          light: "#879052",
          dark: "#4F582A",
        },

        // Secondary brand colour — Heritage Gold
        zari: {
          DEFAULT: "#C8A33A",
          light: "#DFC36A",
          dark: "#A88324",
        },

        // Deep olive for stronger contrast
        peacock: {
          DEFAULT: "#3F4725",
          light: "#596238",
          dark: "#2C321A",
        },
      },

      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },

      backgroundImage: {
        "booti-row":
          "radial-gradient(circle at 8px 8px, currentColor 1.4px, transparent 1.6px)",
      },
    },
  },

  plugins: [],
};

export default config;