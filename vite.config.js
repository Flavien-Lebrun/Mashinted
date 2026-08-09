import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest.json';

export default defineConfig({
  publicDir: 'public',
  build: {
    // Safely targets older Chromium versions (e.g., Chrome 89–90, common on older machines)
    target: ['chrome89', 'es2020'],
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Forces static asset filenames instead of hashes
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Authorization',
    },
  },
  plugins: [
    crx({ manifest }),
    //eslint({
    //  failOnError: true,
    //  failOnWarning: false,
    //  include: ['src/**/*.js'],
    //}),
  ],
});