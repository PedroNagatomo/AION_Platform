/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0a',        // Fundo principal
          surface: '#111111',    // Superfícies (cards, sidebar)
          border: '#1f1f1f',    // Bordas
          text: '#e0e0e0',      // Texto principal
          dim: '#666666',       // Texto secundário
          accent: '#00ff00',    // Verde terminal
          accent2: '#00cc00',   // Verde mais escuro
          warning: '#ff9900',   // Avisos
          error: '#ff3333',     // Erros
        }
      },
      fontFamily: {
        mono: ['Roboto Mono', 'monospace'],
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}