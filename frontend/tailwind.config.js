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
        // Obsidian Onyx & Titanium Slate Background System
        navy: {
          950: '#08090D', // Deepest Obsidian Onyx
          900: '#101219', // Executive Card Surface
          850: '#161923', // Elevated Titanium Surface
          800: '#212635', // Polished Charcoal Border
          750: '#2A3043', // Elevated Card Border
          700: '#353D54', // Hover Accent Border
          600: '#48526E', // Muted Slate
        },
        // Champagne Gold & Warm Amber Primary Brand Accents
        teal: {
          50: '#FFFDF5',
          100: '#FEF9E7',
          200: '#FDF0C6',
          300: '#FDE68A', // Champagne Light
          400: '#F59E0B', // Signature Champagne Gold Highlight
          500: '#D97706', // Primary Executive Gold
          600: '#B45309', // Burnished Bronze Gold
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
          950: '#1F1504', // Subtle Gold Glass Tint
        },
        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        slate: {
          850: '#141722',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
