import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#FDFAF9",
          100: "#FBF1F2",
          200: "#F7E4E8",
        },
        rosa: {
          100: "#F9E3EA",
          200: "#F3CBD8",
          300: "#EBAFC4",
          400: "#DE8AA8",
          500: "#CE6A8F",
          600: "#B34E75",
        },
        royal: {
          50: "#F6F3FA",
          100: "#EDE7F5",
          200: "#D9CCE8",
          300: "#BBA5D3",
          400: "#9A7CBB",
          500: "#7E5DA3",
          600: "#684A8B",
          700: "#553C72",
          800: "#43305A",
          900: "#312343",
        },
        gold: {
          100: "#F6EED8",
          200: "#EBDCAF",
          300: "#DEC684",
          400: "#CFAE5B",
          500: "#BC9640",
          600: "#9E7B31",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
