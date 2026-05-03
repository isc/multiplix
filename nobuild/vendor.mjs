// Vendore React + ReactDOM dans `nobuild/vendor/` :
//   - 1 gros bundle `react-stack.js` qui contient TOUT (une seule instance)
//   - 3 micro fichiers (react.js, react-jsx-runtime.js, react-dom-client.js)
//     qui ré-exportent depuis ce stack avec les bons named exports.
//
// L'import map mappe `react`, `react/jsx-runtime` et `react-dom/client` vers
// les micro fichiers — qui partagent tous le même react-stack.js (une URL =
// un module ESM = une instance).
//
// À regénérer manuellement quand on bump React.
import esbuild from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'nobuild/vendor')
const SHIMS = path.join(ROOT, 'nobuild/_shims')

await fs.mkdir(OUT, { recursive: true })

await esbuild.build({
  entryPoints: [{ in: path.join(SHIMS, 'react-stack.js'), out: 'react-stack' }],
  bundle: true,
  format: 'esm',
  outdir: OUT,
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'warning',
})

const reExports = {
  'react.js': `
import { ReactDefault, ReactNamed } from './react-stack.js'
export default ReactDefault
export const {
  StrictMode, Fragment, Component, PureComponent, Suspense, Profiler,
  Children, createElement, cloneElement, isValidElement, createContext,
  forwardRef, memo, lazy, startTransition, version,
  useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
  useReducer, useImperativeHandle, useContext, useDebugValue, useId,
  useTransition, useDeferredValue, useSyncExternalStore, useInsertionEffect,
  useActionState, useOptimistic, use,
} = ReactNamed
`,
  'react-jsx-runtime.js': `
import { JSXRuntime } from './react-stack.js'
export const { jsx, jsxs, Fragment } = JSXRuntime
`,
  'react-dom-client.js': `
import { ReactDOMClient } from './react-stack.js'
export const { createRoot, hydrateRoot } = ReactDOMClient
`,
}

for (const [name, src] of Object.entries(reExports)) {
  await fs.writeFile(path.join(OUT, name), src.trimStart())
}

console.log(`Vendored React into ${OUT}`)
