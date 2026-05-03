// Config Vitest dédiée à la validation Preact de la POC nobuild.
//
// Différences avec vite.config.ts (qui utilise React) :
//  - alias `react`, `react-dom`, etc. → preact/compat
//  - alias `@testing-library/react` → `@testing-library/preact`
//  - JSX émis avec `jsxImportSource: 'preact'` (pas le plugin React)
//  - alias `virtual:pwa-register` vers le stub no-op existant
//
//   npm run test:preact
//
// Permet de valider que le code applicatif tourne sous Preact sans
// régression, en exécutant la même suite de tests que le build React.

import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  resolve: {
    alias: {
      'react/jsx-runtime':       'preact/jsx-runtime',
      'react/jsx-dev-runtime':   'preact/jsx-runtime',
      'react-dom/test-utils':    'preact/test-utils',
      'react-dom/client':        'preact/compat/client',
      'react-dom':               'preact/compat',
      'react':                   'preact/compat',
      '@testing-library/react':  '@testing-library/preact',
      'virtual:pwa-register':    path.join(ROOT, 'src/pwa-register-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['node_modules/**', 'nobuild/dist/**'],
    testTimeout: 120_000,
  },
})
