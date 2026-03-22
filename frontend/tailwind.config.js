import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        svea: {
          dark: '#1f2937',
          navy: '#111827',
          green: '#00ad69',
          'green-light': '#e6f7ef',
          teal: '#0d9488',
          muted: '#6b7280',
          bg: '#f9fafb',
          card: '#ffffff',
        },
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
