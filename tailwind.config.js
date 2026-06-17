/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          50: '#E8EDF5',
          100: '#C5D0E6',
          200: '#9BADD4',
          300: '#7189C1',
          400: '#4D6BAF',
          500: '#2A4D9C',
          600: '#1B2A4A',
          700: '#152240',
          800: '#0F1A33',
          900: '#091226',
        },
        status: {
          pass: '#10B981',
          suspect: '#F59E0B',
          fail: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
