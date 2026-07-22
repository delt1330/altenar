import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/altenar-v2/',
  plugins: [react()],
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
});
