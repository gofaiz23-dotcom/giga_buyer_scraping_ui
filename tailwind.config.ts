import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070d",
          900: "#0a0d18",
          800: "#0f1424",
          700: "#141a2e",
          600: "#1b2340",
          500: "#232c52",
          400: "#2d3868",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#bfd1ff",
          300: "#93b1ff",
          400: "#6087ff",
          500: "#3b63ff",
          600: "#2246f4",
          700: "#1b38d1",
          800: "#1930a6",
          900: "#1a2e83",
        },
        accent: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,130,255,0.35), 0 10px 40px -10px rgba(59,99,255,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -10px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "brand-gradient":
          "linear-gradient(135deg, #3b63ff 0%, #22d3ee 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        shimmer: "shimmer 1.8s linear infinite",
        pulseSoft: "pulseSoft 2.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
