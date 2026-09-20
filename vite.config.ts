import { defineConfig } from 'vite';

export default defineConfig({
  base: '/modak-mahal-festival-rush/',
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
