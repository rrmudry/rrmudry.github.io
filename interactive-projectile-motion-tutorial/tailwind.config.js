/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/index.html',
    './app/**/*.{ts,tsx,css}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
