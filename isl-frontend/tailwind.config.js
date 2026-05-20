/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        surface: 'var(--bg-surface)',
        panel: 'var(--bg-panel)',
        elevated: 'var(--bg-elevated)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow-pulse 3s ease-in-out infinite',
        'gradient': 'gradient-shift 8s ease infinite',
        'slide-up': 'slide-up 0.5s ease-out both',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
