import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use `vercel dev` for local development so /api routes and the Vite
// frontend are served together on one port against real Blob storage.
export default defineConfig({
  plugins: [react()],
});
