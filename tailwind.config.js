/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        highlight: '#0044ff',
        'highlight-dark': '#0033bb',
      },
    },
  },
  plugins: [],
};