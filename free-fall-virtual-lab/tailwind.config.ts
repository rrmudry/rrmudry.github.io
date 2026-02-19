import type { Config } from 'tailwindcss';

export default {
  content: ['./dev/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
