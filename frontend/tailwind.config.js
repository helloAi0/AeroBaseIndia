/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy:    { 900:"#150f1d", 800:"#1c1428", 700:"#251a35", 600:"#32234a", 500:"#41305e" },
        sky:     { 50:"#fff1ee", 100:"#ffe0d9", 200:"#ffc7bb", 300:"#ffb8a8", 400:"#ff9d8a", 500:"#d9472f", 600:"#b83a25", 700:"#922e1d", 800:"#6b2216", 900:"#45160e" },
        cyan:    { 300:"#a8f0de", 400:"#7fe3c9", 500:"#4fd1b0", 600:"#32b090" },
        blue:    { 300:"#d2c4ff", 400:"#b9a4ff", 500:"#8b6cf0", 600:"#6d4fd1" },
        teal:    { 400:"#7fe3c9", 500:"#4fd1b0" },
        slate:   { 50:"#faf8fc", 100:"#f3eff8", 200:"#e4dcee", 300:"#cfc4de", 400:"#a99dbd", 500:"#7f7396", 600:"#5f5476", 700:"#463d59", 800:"#2f2840", 900:"#1f1a2c" },
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