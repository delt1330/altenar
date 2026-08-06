import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nounProjectApiPlugin } from './vite-plugins/nounProjectApi';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/altenar/',
    plugins: [react(), nounProjectApiPlugin(env)],
    resolve: {
      alias: {
        'react-simple-maps': 'react-simple-maps/dist/index.es.js',
      },
    },
    optimizeDeps: {
      include: ['react-simple-maps', 'd3-geo', 'topojson-client', 'prop-types'],
    },
    server: {
      host: '0.0.0.0',
      port: 5280,
      strictPort: true,
    },
  };
});
