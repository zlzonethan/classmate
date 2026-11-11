import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#f1f4fb',
          100: '#e1e7f6',
          200: '#c5d0ee',
          300: '#9eb0e1',
          400: '#6f87d0',
          500: '#4a64bd',
          600: '#3a51a6',
          700: '#304388',
          800: '#28376d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
