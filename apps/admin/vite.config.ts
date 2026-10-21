import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Local-only dev server: never bind beyond loopback.
  server: { host: '127.0.0.1' },
});
