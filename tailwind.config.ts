import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Jamaat Khadki brand palette
        gold: {
          DEFAULT: "#cf9b00",
          light: "#e8b84b",
          dark: "#a07800",
          50: "#fdf8e1",
          100: "#faedb3",
          200: "#f5d97a",
          300: "#e8b84b",
          400: "#cf9b00",
          500: "#a07800",
          600: "#7a5c00",
        },
        navy: {
          DEFAULT: "#1a2744",
          light: "#243660",
          dark: "#0f1829",
          50: "#f0f3fa",
          100: "#d6ddf0",
          200: "#a8b8e0",
          300: "#6b85c8",
          400: "#3a5aaa",
          500: "#1a2744",
          600: "#0f1829",
        },
        cream: "#fdf8f0",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-raleway)", "sans-serif"],
        arabic: ["var(--font-scheherazade)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(207,155,0,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(207,155,0,0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        ticker: "ticker 30s linear infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #1a2744 0%, #243660 50%, #1a2744 100%)",
        "gradient-gold-bar": "linear-gradient(90deg, #cf9b00, #e8b84b, #cf9b00)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
