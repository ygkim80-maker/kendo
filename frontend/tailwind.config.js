/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kendo: {
          bg: "#0B0E15",
          surface: "#1D2433",
          surfaceAlt: "#252E40",
          paper: "#ECE4D3",
          paperDim: "#9B9485",
          brass: "#C3A35F",
          accent: "#9B3A2C",
          accentBright: "#E14430",
          line: "rgba(236,228,211,0.10)",
        },
      },
      fontFamily: {
        serif: ["'Noto Serif KR'", "serif"],
        sans: ["'Noto Sans KR'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
