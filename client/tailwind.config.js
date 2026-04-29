/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { transform: 'translateY(0)', opacity: '1' },
          '80%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        boostPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        goalStamp: {
          '0%':   { transform: 'scale(2.4)', opacity: '0' },
          '20%':  { transform: 'scale(0.92)', opacity: '1' },
          '30%':  { transform: 'scale(1.06)' },
          '40%':  { transform: 'scale(1)' },
          '75%':  { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        goalSlideUp: {
          '0%':   { transform: 'translateY(18px)', opacity: '0' },
          '30%':  { transform: 'translateY(0)',    opacity: '1' },
          '75%':  { transform: 'translateY(0)',    opacity: '1' },
          '100%': { transform: 'translateY(0)',    opacity: '0' },
        },
        goalFlash: {
          '0%':   { opacity: '0' },
          '8%':   { opacity: '1' },
          '75%':  { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'slide-down':   'slideDown 5s ease-in-out forwards',
        'boost-pulse':  'boostPulse 0.4s ease-in-out infinite',
        'goal-stamp':   'goalStamp 5s cubic-bezier(0.22,1,0.36,1) forwards',
        'goal-slide-up':'goalSlideUp 5s ease forwards',
        'goal-flash':   'goalFlash 5s ease forwards',
      },
    },
  },
  plugins: [],
}
