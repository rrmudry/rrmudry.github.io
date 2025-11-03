import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = __dirname;
const devRoot = path.resolve(projectRoot, 'dev');

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, projectRoot, '');
    return {
      root: devRoot,
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: path.resolve(projectRoot, 'dist'),
        emptyOutDir: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(projectRoot, 'src'),
        }
      }
    };
});
