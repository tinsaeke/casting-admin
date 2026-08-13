/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6600',
          navy:    '#0A0F1E',
          surface: '#FFFFFF',
          bg:      '#F8F9FA',
          border:  '#E5E7EB',
          muted:   '#6B7280',
        },
      },
    },
  },
  plugins: [],
}
