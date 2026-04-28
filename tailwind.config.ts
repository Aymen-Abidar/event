import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        champagne: "#F6E7CB",
        gold: "#C79A42",
        olive: "#3E4A3D",
        cream: "#FAF7F0"
      },
      boxShadow: {
        premium: "0 24px 70px rgba(17, 24, 39, 0.10)"
      },
      borderRadius: {
        "3xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
