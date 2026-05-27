import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

							 
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/threat-feeds': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.VITE_ANTHROPIC_API_KEY ?? '';
              console.log('[proxy] injecting key:', key.slice(0, 15) + '...');
              proxyReq.setHeader('x-api-key', key);
              proxyReq.setHeader('anthropic-version', '2023-06-01');
              proxyReq.setHeader('content-type', 'application/json');
            });
          },
        },
      },
    },
	
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});