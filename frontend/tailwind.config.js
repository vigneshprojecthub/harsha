/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf9ee',
          100: '#f9eecc',
          200: '#f2d98a',
          300: '#e8be4a',
          400: '#dea524',
          500: '#c8860f',
          600: '#a8670a',
          700: '#854d0c',
          800: '#6b3d11',
          900: '#5a3313',
        },
        ivory: {
          50:  '#fdfcf8',
          100: '#f8f4ec',
          200: '#f0e9d4',
          300: '#e4d4b0',
          400: '#d4b87f',
        },
        charcoal: {
          800: '#1a1510',
          900: '#0f0c08',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lato"', 'system-ui', 'sans-serif'],
        accent: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c8860f 0%, #e8be4a 50%, #c8860f 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0f0c08 0%, #1a1510 100%)',
      }
    },
  },
  plugins: [],
}
