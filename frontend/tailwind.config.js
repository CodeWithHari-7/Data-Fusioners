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
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        navy: {
          midnight: "#101B2D",
          deep: "#1D3557",
          surface: "#152338",
          elevated: "#1A2B45",
          border: "#253A59",
          steel: "#52749B",
        },
        electric: {
          DEFAULT: "#3987F7",
          hover: "#2B76E5",
          soft: "#EAF2FC",
        },
        teal: {
          DEFAULT: "#16B8A6",
          soft: "rgba(22, 184, 166, 0.14)",
        },
        status: {
          verified: "#16B8A6",
          uncertain: "#E5A23B",
          conflict: "#E05252",
          info: "#3987F7",
        },
        surface: {
          offwhite: "#F7F9FC",
          lightgrey: "#E5EAF1",
        },
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
