/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        admin: ["Inter", "sans-serif"],
      },
      colors: {
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        primary: {
          DEFAULT: "#5c705e", // Olive Green
          dark: "#3a4b3b", // Dark Olive Green
          light: "#7a8a7c", // Lighter Olive
          50: "#f5f7f5",
          100: "#e6e9e6",
        },
        secondary: {
          DEFAULT: "#1a1c18", // Almost Black
          light: "#2c2e2a",
        },
        gold: {
          DEFAULT: "#c5a059",
          light: "#e6d2aa",
          dark: "#a38240",
        },
        accent: "#f0ebe0", // Light Beige
        sage: {
          50: "#f9faf9",
          100: "#eff1ee",
          200: "#e3e6e3",
          300: "#d1d6d1",
          400: "#aeb9ae",
          500: "#8b9c8b",
          600: "#6e7f6e",
          700: "#546154",
          800: "#3e483e",
          900: "#2a312a",
        },
      },
    },
  },
  plugins: [],
};
