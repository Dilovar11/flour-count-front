/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,html}",  // чтобы Tailwind сканировал все файлы Angular
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
