import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest.json';
import firefoxManifest from './src/manifest.firefox.json';
import pkg from './package.json';

// `BROWSER=firefox vite build` -> dist-firefox/ with a Firefox-compatible manifest.
const isFirefox = process.env.BROWSER === 'firefox';

export default defineConfig({
  publicDir: 'public',
  build: {
    // Older machines: Chrome 91+ (module service worker floor), Safari 14+, Firefox 121+ (MV3).
    target: ['chrome89', 'safari14', 'firefox115', 'es2020'],
    outDir: isFirefox ? 'dist-firefox' : 'dist',
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
    // package.json is the single source of truth for the version.
    crx({ manifest: { ...(isFirefox ? firefoxManifest : manifest), version: pkg.version } }),
  ],
});