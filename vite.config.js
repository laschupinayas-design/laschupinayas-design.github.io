import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Sitio de usuario/organización de GitHub Pages, servido desde la raíz del dominio.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
