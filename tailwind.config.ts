import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Very light backgrounds with a soft fuchsia tint
        blush: {
          50: "#FDFAFC",
          100: "#FBF0F8",
          200: "#F5DFEE",
        },
        // Vice Fuchsia — base brand pink is 500 (#DB3EB1)
        rosa: {
          100: "#FBE3F4",
          200: "#F6C3E7",
          300: "#EF97D5",
          400: "#E566C2",
          500: "#DB3EB1",
          600: "#A81F84",
        },
        // Vice Blue — base brand blue is 500 (#41B6E6);
        // 600+ are darker steps for buttons, headings and dark sections
        royal: {
          50: "#F0FAFE",
          100: "#E1F4FC",
          200: "#BCE7F8",
          300: "#8ED7F2",
          400: "#62C6EC",
          500: "#41B6E6",
          600: "#1479A6",
          700: "#10618B",
          800: "#0D4A6B",
          900: "#093750",
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
