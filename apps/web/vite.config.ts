import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiUrl = env.API_URL || 'http://localhost:4000';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        // The API picks the artist from the visitor's host, e.g. seifu.localhost:3000.
        // DEV_TENANT_HOST pins one artist when browsing on plain localhost.
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          configure: proxy => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const host = env.DEV_TENANT_HOST || req.headers.host || '';
              proxyReq.setHeader('x-tenant-host', host);
            });
          },
        },
      },
    },
  };
});
