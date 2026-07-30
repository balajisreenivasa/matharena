import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        algebra: "#2563eb",
        geometry: "#059669",
        numbertheory: "#d97706",
        counting: "#7c3aed"
      }
    }
  },
  plugins: []
};
export default config;
