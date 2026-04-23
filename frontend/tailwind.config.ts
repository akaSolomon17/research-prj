import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
      },
      colors: {
        panel: "#0E1A2B",
        accent: "#0EA5E9",
        muted: "#94A3B8",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(14, 165, 233, 0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
