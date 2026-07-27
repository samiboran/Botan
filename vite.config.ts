import { defineConfig } from 'vite';

// Served from https://<user>.github.io/Botan/ — keep base in sync with the repo name.
export default defineConfig({
  base: '/Botan/',
  build: {
    outDir: 'dist',
  },
});
