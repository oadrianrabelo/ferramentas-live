/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_REPO__: string;
declare const __IS_TAURI_BUILD__: boolean;

declare module '*.md?raw' {
  const content: string;
  export default content;
}
