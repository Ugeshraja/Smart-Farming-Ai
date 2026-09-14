/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#66BB6A', // Soft green secondary
          600: '#2E7D32', // Primary agricultural green
          700: '#1b5e20',
          800: '#14532d',
          900: '#143e1d',
        },
        bgLight: '#F8FAF8',
      },
    },
  },
  plugins: [],
}
