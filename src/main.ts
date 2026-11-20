import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { loadFonts } from './lib/canvas/assets.svelte';
import { isTauri } from './lib/platform';

loadFonts();

const app = mount(App, { target: document.getElementById('app')! });

if (!isTauri && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

export default app;
