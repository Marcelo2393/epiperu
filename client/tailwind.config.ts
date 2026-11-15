import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        alert: {
          success: '#22c55e',
          safety: '#eab308',
          alert: '#f97316',
          outbreak: '#ef4444',
          nodata: '#94a3b8',
        },
        brand: {
          primary: '#1d4ed8',
          secondary: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
