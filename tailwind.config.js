/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1115', // Deep dark theme background
        surface: '#1E2028',
        'surface-hover': '#2A2C35',
        primary: {
          DEFAULT: '#8B5CF6', // Purple
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        accent: {
          DEFAULT: '#3B82F6', // Blue
          light: '#60A5FA',
          dark: '#2563EB',
        },
        border: '#2E323E',
      },
      backgroundImage: {
        'gemini-gradient': 'linear-gradient(to right, #8B5CF6, #3B82F6)',
      }
    },
  },
  plugins: [],
}
