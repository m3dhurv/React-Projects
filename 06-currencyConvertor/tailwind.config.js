/* eslint-env node */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        scroll: {
          '0%': { transform: 'translateY(-50%)', opacity: 0 },
          '50%': { transform: 'translateY(50%)', opacity: 1 },
          '100%': { transform: 'translateY(150%)', opacity: 0 },
        }
      },
      animation: {
        scroll: 'scroll 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out'
      }
    },
  },
  plugins: [],
}