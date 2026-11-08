/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy:    { 900:"#0a0e1a", 800:"#0f1629", 700:"#141d35", 600:"#1a2540", 500:"#1e2d4d" },
        sky:     { 400:"#38bdf8", 500:"#0ea5e9", 600:"#0284c7" },
        teal:    { 400:"#2dd4bf", 500:"#14b8a6" },
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
      },
      fontFamily: { sans: ["Inter","Poppins","sans-serif"] },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-in":   "slideIn 0.3s ease-out",
        "fade-in":    "fadeIn 0.4s ease-out",
      },
      keyframes: {
        slideIn:  { from:{ transform:"translateX(-100%)" }, to:{ transform:"translateX(0)" } },
        fadeIn:   { from:{ opacity:0 }, to:{ opacity:1 } },
      },
    },
  },
  plugins: [],
}