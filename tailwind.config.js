/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdf8f0',
          100: '#f9eedb',
          200: '#f3ddb8',
          300: '#eac68a',
          400: '#dfa85a',
          500: '#d4913a',
        },
        imperial: {
          gold: '#b8922a',
          'gold-light': '#d4aa3a',
          'gold-dark': '#8b6914',
          bronze: '#8b5e3c',
          'dark-wood': '#2c1810',
          'medium-wood': '#4a2c1a',
          'light-wood': '#6b3d28',
        },
        emerald: {
          deep: '#1a3d2b',
          medium: '#2d5a3d',
          light: '#3d7a52',
        },
        burgundy: {
          deep: '#3d1020',
          medium: '#6b1e35',
          light: '#8b2d4a',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'serif'],
      },
      backgroundImage: {
        'parchment-gradient': 'linear-gradient(135deg, #fdf8f0 0%, #f3ddb8 50%, #fdf8f0 100%)',
        'gold-gradient': 'linear-gradient(135deg, #8b6914 0%, #d4aa3a 50%, #8b6914 100%)',
        'imperial-gradient': 'linear-gradient(180deg, #2c1810 0%, #4a2c1a 100%)',
      },
      boxShadow: {
        'coin': '0 4px 20px rgba(184, 146, 42, 0.3), 0 1px 4px rgba(0,0,0,0.2)',
        'coin-hover': '0 8px 40px rgba(184, 146, 42, 0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'imperial': '0 2px 16px rgba(44, 24, 16, 0.4)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
