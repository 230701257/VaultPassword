/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // important
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        lightbg: "#f8fafc",   // light gray
        darkbg: "#0f172a",    // slate-900
        lighttext: "#1e293b", // slate-800
        darktext: "#f1f5f9",  // slate-100
      }
    },
  },
  plugins: [],
};
