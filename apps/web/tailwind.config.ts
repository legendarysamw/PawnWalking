import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf5",
          100: "#e0f6e7",
          500: "#1f9d55",
          600: "#188245",
          700: "#146638",
        },
      },
    },
  },
  plugins: [],
};

export default config;
