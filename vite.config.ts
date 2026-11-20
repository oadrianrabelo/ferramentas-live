import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
})();

const isTauri = !!process.env.TAURI_ENV_PLATFORM;

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // GitHub Pages serve em /<repo>/; o app nativo serve na raiz.
  base: process.env.BASE_PATH ?? './',
  clearScreen: false,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? commit),
    __APP_REPO__: JSON.stringify('oadrianrabelo/ferramentas-live'),
    __IS_TAURI_BUILD__: JSON.stringify(isTauri),
  },
  server: {
    port: 5173,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || false,
    hmr: process.env.TAURI_DEV_HOST
      ? { protocol: 'ws', host: process.env.TAURI_DEV_HOST, port: 5174 }
      : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    target: isTauri ? (process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15') : 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
