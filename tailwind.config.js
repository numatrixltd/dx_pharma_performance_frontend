/** @type {import('tailwindcss').Config} */
// Colours are CSS variables ("R G B" triplets) written by the theme engine (src/lib/theme.js),
// so Admin → Theme & Colours can restyle the whole site without rebuilding.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix, keys) => Object.fromEntries(keys.map((k) => [k, v(`${prefix}-${k}`)]));

module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white: v('c-text'), // "white" means the theme's text colour
        onaccent: v('c-onaccent'), // label colour for text sitting on a solid accent background
        accent: v('c-accent'),
        ink: scale('ink', [950, 900, 850, 800, 700, 600, 500]),
        brand: scale('brand', [300, 400, 500, 600, 700]),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
      },
      borderRadius: {
        sm: 'calc(0.125rem * var(--r-scale))',
        DEFAULT: 'calc(0.25rem * var(--r-scale))',
        md: 'calc(0.375rem * var(--r-scale))',
        lg: 'calc(0.5rem * var(--r-scale))',
        xl: 'calc(0.75rem * var(--r-scale))',
        '2xl': 'calc(1rem * var(--r-scale))',
        '3xl': 'calc(1.5rem * var(--r-scale))',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans Bengali', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--brand-400) / .35), 0 8px 30px -6px rgb(var(--brand-500) / .45)',
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