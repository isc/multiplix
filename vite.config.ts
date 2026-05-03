import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const basePath = process.env.VITE_BASE_PATH ?? '/multiplix/';

// PWA disabled for branch previews: their base path lives under
// `/multiplix/previews/<slug>/` which is inside the production SW's scope
// (`/multiplix/`). Registering a separate preview SW would accumulate one
// per branch in the user's browser. The production SW is told below
// (navigateFallbackDenylist) not to intercept `/previews/`, so previews
// load directly from the network.
const isPreviewBuild = basePath.includes('/previews/');

// https://vite.dev/config/
export default defineConfig({
  // Base path is baked in at build time. Defaults to the main deploy path
  // (`/multiplix/`) but can be overridden via `VITE_BASE_PATH` for branch
  // previews (e.g. `/multiplix/previews/<slug>/`).
  base: basePath,
  // When PWA is disabled (preview builds), `virtual:pwa-register` no longer
  // exists. Stub it so `import { registerSW } from 'virtual:pwa-register'`
  // still resolves at build time and becomes a no-op at runtime.
  resolve: isPreviewBuild
    ? { alias: { 'virtual:pwa-register': '/src/pwa-register-stub.ts' } }
    : undefined,
  plugins: [
    react(),
    ...(isPreviewBuild ? [] : [
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Multiplix',
          short_name: 'Multiplix',
          description: 'Apprends les tables de multiplication en t\'amusant !',
          theme_color: '#4F46BA',
          background_color: '#FBF6EC',
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
          // all navigations within scope. Exclude `/guide/` (standalone HTML
          // guide, served from its own index) and `/previews/` (branch
          // previews must reach GitHub Pages directly, not be served the
          // cached prod shell).
          navigateFallbackDenylist: [/\/guide(\/|$)/, /\/previews\//],
        },
      }),
    ]),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/__tests__/setup.ts'],
    // Évite que vitest ne découvre les artefacts générés par
    // `npm run nobuild:build` (ils sont compilés pour Preact).
    exclude: ['node_modules/**', 'nobuild/dist/**'],
    // The long e2e scenario runs ~25 sessions × ~15 questions; give it room.
    testTimeout: 120_000,
  },
})
