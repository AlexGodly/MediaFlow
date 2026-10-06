import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../assets/v260-react',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'mediaflow-v260-react.js',
        assetFileNames: 'mediaflow-v260-react.[ext]'
      }
    }
  }
});
