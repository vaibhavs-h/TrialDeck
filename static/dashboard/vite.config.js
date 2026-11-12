import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built assets resolve under Forge's hosted Custom UI path.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Never inline assets as data: URIs; Forge's CSP only allows files served from the app itself.
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
