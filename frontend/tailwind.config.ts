/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        uat: {
          blue: '#003087',
          'blue-dark': '#002060',
          'blue-light': '#1a4db3',
          gold: '#F2A900',
          'gold-dark': '#d4930a',
          'gold-light': '#f7c13a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'uat-gradient': 'linear-gradient(135deg, #003087 0%, #002060 100%)',
      },
    },
  },
  plugins: [],
};
