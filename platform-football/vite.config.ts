import { defineConfig } from 'vite';

// Served from https://<user>.github.io/Botan/platform-football/ — this
// project lives in a subfolder of the Botan repo, alongside DragonKick,
// with its own deploy sub-path (see CLAUDE.md section 11: wrong base =
// blank Pages).
export default defineConfig({
  base: '/Botan/platform-football/',
  build: {
    outDir: 'dist',
  },
});
