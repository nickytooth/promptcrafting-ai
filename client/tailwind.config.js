/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#1c1c1d',
          800: '#232324',
          700: '#2a2a2b',
          600: '#313132',
          500: '#383839',
        },
        accent: {
          primary: '#ff7200',
          secondary: '#ff8c33',
          glow: 'rgba(255, 114, 0, 0.3)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
