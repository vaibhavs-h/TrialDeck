import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dashboard (Forge Custom UI) lives in frontend/dashboard; its build output goes to
// frontend/dashboard/dist, which manifest.yml serves.
export default defineConfig({
  root: fileURLToPath(new URL('./frontend/dashboard', import.meta.url)),
  // base './' so the built assets resolve under Forge's hosted Custom UI path.
  base: './',
  plugins: [react()],
  // Never inline assets as data: URIs; Forge's CSP only allows files served from the app itself.
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0 },
});
