/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // InsightAI-style deep navy surfaces
        ink: {
          950: '#050914',
          900: '#070c1a',
          850: '#0a1122',
          800: '#0d1529',
          700: '#121c35',
          600: '#1a2744',
          500: '#26365a',
        },
        brand: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans Bengali', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(96,165,250,.35), 0 8px 30px -6px rgba(59,130,246,.45)',
        card: '0 1px 0 rgba(255,255,255,.03) inset, 0 12px 32px -14px rgba(0,0,0,.7)',
      },
      keyframes: {
        orb: { '0%,100%': { transform: 'scale(1)', opacity: '.9' }, '50%': { transform: 'scale(1.06)', opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { orb: 'orb 4s ease-in-out infinite', shimmer: 'shimmer 1.6s infinite' },
    },
  },
  plugins: [],
};
