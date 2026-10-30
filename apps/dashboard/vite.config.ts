import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development the dashboard talks to the API through this proxy, so cookies stay same-origin.
    proxy: { '/api': { target: process.env.API_URL ?? 'http://localhost:4000', rewrite: p => p.replace(/^\/api/, '') } },
  },
});
