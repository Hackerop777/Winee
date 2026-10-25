/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        opie: {
          dark: "rgba(10, 10, 14, 0.82)",
          glass: "rgba(20, 20, 28, 0.65)",
          border: "rgba(255, 255, 255, 0.12)",
          active: "rgba(255, 255, 255, 0.22)",
          accent: "#38bdf8",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI Variable Text'",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}
