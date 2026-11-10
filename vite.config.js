import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  appType: 'mpa',
  // Для GitHub Pages сайт живёт в подпапке: BASE_PATH=/altenar/ (см. scripts/rebase-dist.mjs)
  base: process.env.BASE_PATH || '/',
  build: {
    outDir: 'dist',
    rolldownOptions: {input: [
      fileURLToPath(new URL('./index.html', import.meta.url)),
      fileURLToPath(new URL('./Sportsbook/index.html', import.meta.url)),
    ]},
  },
  esbuild: {jsx: 'automatic'},
});
