/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Times New Roman"', 'Times', 'serif'],
        sans: ['"Times New Roman"', 'Times', 'serif'], // Enforce Times New Roman throughout as required
      },
      colors: {
        background: "#FFFFFF",
        primary: {
          DEFAULT: "#111827",
          dark: "#000000",
          light: "#374151",
        },
        accent: {
          blue: "#1D4ED8",
          teal: "#0D9488",
          orange: "#EA580C",
          red: "#DC2626",
          green: "#16A34A",
        },
        border: {
          light: "#E5E7EB",
          subtle: "#F3F4F6",
        }
      },
    },
  },
  plugins: [],
};
