/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'floating': '0 20px 30px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
}
