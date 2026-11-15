/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy:    { 900:"#0e0c0a", 800:"#16130f", 700:"#1d1913", 600:"#262017", 500:"#322a1e" },
        sky:     { 50:"#fbf6ea", 100:"#f5e9c8", 200:"#efdba3", 300:"#f0d28a", 400:"#e8c77a", 500:"#a8741f", 600:"#8a5d16", 700:"#6b4710", 800:"#4a320c", 900:"#2e1f08" },
        cyan:    { 300:"#f0d28a", 400:"#e8c77a", 500:"#c9953c", 600:"#a8741f" },
        blue:    { 300:"#f0d28a", 400:"#e8c77a", 500:"#c9953c", 600:"#a8741f" },
        teal:    { 400:"#8cc7a8", 500:"#6fae8f" },
        slate:   { 50:"#fafaf9", 100:"#f5f5f4", 200:"#e7e5e4", 300:"#d6d3d1", 400:"#a8a29e", 500:"#78716c", 600:"#57534e", 700:"#44403c", 800:"#292524", 900:"#1c1917" },
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