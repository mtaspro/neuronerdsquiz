/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        aura: {
          bg: '#030308',
          cyan: '#00f5ff',
          violet: '#a855f7',
          magenta: '#ec4899',
          surface: 'rgba(12, 12, 24, 0.72)',
        },
      },
      boxShadow: {
        'aura-cyan': '0 0 40px rgba(0, 245, 255, 0.35)',
        'aura-violet': '0 0 40px rgba(168, 85, 247, 0.35)',
      },
      animation: {
        'aura-pulse': 'aura-pulse-border 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
