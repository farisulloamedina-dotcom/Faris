import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#05070d",
          soft: "#0b0f1a",
        },
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.04)",
          hover: "rgba(255, 255, 255, 0.07)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        accent: {
          mint: "#5EEAD4",
          violet: "#A78BFA",
          coral: "#FB7185",
          amber: "#FCD34D",
          sky: "#38BDF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 40px -10px rgba(94, 234, 212, 0.35)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
