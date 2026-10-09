import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  root:'src-v260',
  base:'./',
  plugins:[react(),tailwindcss()],
  build:{outDir:'../assets/v260-react',emptyOutDir:false,manifest:true,rollupOptions:{input:'main.tsx'}}
});
