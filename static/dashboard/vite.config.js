import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built assets resolve under Forge's hosted Custom UI path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist' },
});
