/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1a3a2a',
          mid:     '#2d5a3d',
          light:   '#3d7a52',
        },
        amber: {
          DEFAULT: '#c17f24',
          light:   '#e8a83e',
        },
        parchment: '#f5f2eb',
        moss:      '#e8f0e9',
      },
      fontFamily: {
        mukta: ['Mukta', 'sans-serif'],
        lora:  ['Lora', 'serif'],
      },
      borderColor: {
        'forest-border': '#d1e7d8',
      },
      boxShadow: {
        card: '0 2px 12px rgba(26,58,42,0.10)',
      },
      animation: {
        'msg-in':    'msg-in 0.25s ease both',
        'fade-in':   'fade-in 0.3s ease both',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        'msg-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
