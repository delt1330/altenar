import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  appType: 'mpa',
  build: {
    outDir: 'dist',
    rolldownOptions: {input: [
      fileURLToPath(new URL('./index.html', import.meta.url)),
      fileURLToPath(new URL('./Sportsbook/index.html', import.meta.url)),
    ]},
  },
  esbuild: {jsx: 'automatic'},
});
