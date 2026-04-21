import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Base path is baked in at build time. Defaults to the main deploy path
  // (`/multiplix/`) but can be overridden via `VITE_BASE_PATH` for branch
  // previews (e.g. `/multiplix/previews/<slug>/`).
  base: process.env.VITE_BASE_PATH ?? '/multiplix/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Multiplix',
        short_name: 'Multiplix',
        description: 'Apprends les tables de multiplication en t\'amusant !',
        theme_color: '#6C63FF',
        background_color: '#F8F9FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // The SW's navigateFallback serves `index.html` (the SPA shell) for
        // all navigations. Exclude `/guide/` so the standalone HTML guide is
        // served from its own index instead of the app shell.
        navigateFallbackDenylist: [/\/guide(\/|$)/],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/__tests__/setup.ts'],
    // The long e2e scenario runs ~25 sessions × ~15 questions; give it room.
    testTimeout: 120_000,
  },
})
