import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages configuration for subfolder deployment
export default defineConfig({
  plugins: [react()],
  base: '/comet-orbit-simulator/',
});
