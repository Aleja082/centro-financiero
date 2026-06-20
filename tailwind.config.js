/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0F12',
          900: '#10151B',
          850: '#141B22',
          800: '#19222A',
          700: '#212C35',
          600: '#2C3942',
          500: '#445159',
          400: '#647179',
          300: '#8D98A0',
          200: '#BAC2C7',
          100: '#E6EAEC',
          50: '#F2F4F5',
        },
        paper: {
          50: '#FBFAF7',
          100: '#F5F3EE',
          200: '#EAE6DC',
          300: '#D9D3C4',
        },
        signal: {
          emerald: '#2FC3A0',
          emeraldDeep: '#1B8F76',
          amber: '#E0A23B',
          amberDeep: '#A9762A',
          coral: '#E15F66',
          coralDeep: '#B53F46',
          azure: '#4E9FE0',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
