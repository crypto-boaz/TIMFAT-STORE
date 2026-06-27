import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        brand: {
          50: "#f3faf6",
          100: "#d9f1e3",
          500: "#1f9d66",
          600: "#147a51",
          700: "#0d5f3e"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
