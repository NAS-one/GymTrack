/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "gym-dark": "#151515",
        "gym-card": "#1E1E1E",
        "gym-orange": "#FF5722",
        "gym-gray": "#9E9E9E",
        "gym-title": "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
