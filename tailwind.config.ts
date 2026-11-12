import type { Config } from 'tailwindcss';

// One warm neutral (paper to ink), one main colour (chalkboard green),
// one accent (red pen). Every other hue is mapped back onto these three
// so the whole app stays inside the same small palette.
const ink = {
  50: '#efebe1',
  100: '#e8e3d7',
  200: '#d8d2c3',
  300: '#bdb6a5',
  400: '#8f8878',
  500: '#686254',
  600: '#514c41',
  700: '#3a362e',
  800: '#27241e',
  900: '#1a1814',
};

const board = {
  50: '#e9f0ea',
  100: '#d7e4da',
  200: '#b5cdbb',
  300: '#8bb096',
  400: '#5b8a69',
  500: '#3a6c4c',
  600: '#255339',
  700: '#1c422d',
  800: '#153323',
};

const pen = {
  50: '#f9ebe6',
  100: '#f3d9d1',
  200: '#e9b8ab',
  300: '#dc917f',
  400: '#cf6a53',
  500: '#c24a30',
  600: '#b33a21',
  700: '#a12f18',
  800: '#832512',
  900: '#661d0e',
};

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f5f2ea',
        slate: ink,
        amber: ink,
        accent: board,
        emerald: board,
        red: pen,
      },
      fontFamily: {
        sans: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Noto Sans KR', 'sans-serif'],
        display: ['var(--font-display)', 'Noto Serif KR', 'AppleMyungjo', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
