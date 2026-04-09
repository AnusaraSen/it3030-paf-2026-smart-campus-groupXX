/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: '#E7ECFE',
          primary: '#F57923',
          'primary-hover': '#e06d1b',
        },
      },
    },
  },
  plugins: [],
};
