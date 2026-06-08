/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        cream: {
          50: '#fdfaf5',
          100: '#f9f2e3',
          200: '#f0e0c0',
          300: '#e5c99a',
        },
        blush: {
          300: '#e8b4b8',
          400: '#d4878d',
          500: '#c05c63',
        },
        sage: {
          300: '#a8b5a0',
          400: '#8a9e82',
          500: '#6b8063',
        },
        charcoal: {
          700: '#3d3535',
          800: '#2a2020',
          900: '#1a1212',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'film-advance': 'filmAdvance 0.3s ease forwards',
        'shutter': 'shutter 0.15s ease',
        'grain': 'grain 0.5s steps(1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        filmAdvance: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shutter: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
        grain: {
          '0%, 100%': { backgroundPosition: '0 0' },
          '10%': { backgroundPosition: '-5% -10%' },
          '30%': { backgroundPosition: '-15% 5%' },
          '50%': { backgroundPosition: '7% -25%' },
          '70%': { backgroundPosition: '20% 25%' },
          '90%': { backgroundPosition: '-5% 5%' },
        },
      },
    },
  },
  plugins: [],
};
