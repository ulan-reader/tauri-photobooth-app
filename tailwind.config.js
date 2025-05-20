/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src-tauri/**/*.{html,js,jsx,ts,tsx,vue}',
    './src/**/*.{html,js,jsx,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    }

  },
  plugins: [],
}
