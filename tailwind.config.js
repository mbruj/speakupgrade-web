/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#09090B',
        card: '#1A1A1E',
        blue: '#3B82F6',
        green: '#22C55E',
        amber: '#F59E0B',
        danger: '#EF4444',
        muted: '#52525B',
        secondary: '#A1A1AA',
      },
    },
  },
  plugins: [],
}
