// Gera assets/icon.png (1024×1024) a partir de assets/icon.svg.
// Uso: node scripts/render-icon.mjs  →  depois: pnpm tauri icon assets/icon.png
import { createRequire } from 'node:module';
// Playwright é usado só aqui; pode vir do global (NODE_PATH=$(npm root -g)).
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../assets/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
await page
  .locator('svg')
  .screenshot({ path: new URL('../assets/icon.png', import.meta.url).pathname, omitBackground: true });
await browser.close();
