// POC d'un dev server "nobuild" : esbuild en pur transformer (pas de bundling),
// import maps pour les bare specifiers, ESM natif côté navigateur.
//
// Pour évaluer l'approche sans toucher au code applicatif :
//   npm run nobuild   →   http://localhost:5174/
//
// Ce qui est géré :
//  - .ts/.tsx/.jsx → transformés à la volée (esbuild.transform, format ESM)
//  - imports CSS (`import './Foo.css'`) → réécrits vers une URL `?as=link`
//    qui renvoie un petit bout de JS injectant un <link rel="stylesheet">
//  - imports sans extension → résolus en .tsx/.ts/.jsx/.js puis index.*
//  - import.meta.env.* → remplacés via esbuild `define`
//  - virtual:pwa-register → no-op via import map (pas de SW en POC)

import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT ?? 5174)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
  '.mp3':  'audio/mpeg',
  '.webmanifest': 'application/manifest+json',
}

// Substitutions pour `import.meta.env.X` côté POC. Les secrets restent
// undefined (Supabase est désactivé sans clé, c'est le comportement attendu).
const ENV_DEFINE = {
  'import.meta.env.BASE_URL':                      '"/"',
  'import.meta.env.MODE':                          '"development"',
  'import.meta.env.DEV':                           'true',
  'import.meta.env.PROD':                          'false',
  'import.meta.env.VITE_APP_VERSION':              '"nobuild-poc"',
  'import.meta.env.VITE_BASE_PATH':                '"/"',
  'import.meta.env.VITE_SUPABASE_URL':             'undefined',
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': 'undefined',
}

const TRANSFORM_EXT = new Set(['.ts', '.tsx', '.jsx'])

async function tryFile(p) {
  try { const s = await fs.stat(p); if (s.isFile()) return p } catch {}
  return null
}

// Résolution à la Node : direct, puis extensions, puis index.*. Cherche dans
// la racine du projet puis dans `public/`.
async function resolveUrl(pathname) {
  const cleaned = pathname.replace(/^\/+/, '')
  const roots = [path.join(ROOT, cleaned), path.join(ROOT, 'public', cleaned)]

  for (const c of roots) {
    const f = await tryFile(c)
    if (f) return f
  }
  if (path.extname(cleaned)) return null

  const exts = ['.tsx', '.ts', '.jsx', '.js']
  for (const r of roots) {
    for (const e of exts) {
      const f = await tryFile(r + e)
      if (f) return f
    }
    for (const e of exts) {
      const f = await tryFile(path.join(r, 'index' + e))
      if (f) return f
    }
  }
  return null
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://localhost:${PORT}`)
    let pathname = decodeURIComponent(u.pathname)
    if (pathname === '/') pathname = '/nobuild/index.html'

    // Helper "import './foo.css?as=link'" : renvoie un JS qui injecte un <link>.
    if (pathname.endsWith('.css') && u.searchParams.get('as') === 'link') {
      const js = `const l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(pathname)};document.head.appendChild(l);`
      res.writeHead(200, { 'Content-Type': MIME['.js'] })
      return res.end(js)
    }

    const filePath = await resolveUrl(pathname)
    if (!filePath) {
      res.writeHead(404)
      return res.end(`Not found: ${pathname}`)
    }

    const ext = path.extname(filePath)

    if (TRANSFORM_EXT.has(ext)) {
      const source = await fs.readFile(filePath, 'utf8')
      const result = await esbuild.transform(source, {
        loader: ext.slice(1),
        format: 'esm',
        target: 'es2022',
        jsx: 'automatic',
        sourcemap: 'inline',
        sourcefile: pathname,
        define: ENV_DEFINE,
      })
      // Réécriture des imports CSS pour passer par le helper d'injection.
      const code = result.code
        .replace(/from\s*["']([^"']+\.css)["']/g, (_, p) => `from "${p}?as=link"`)
        .replace(/import\s*["']([^"']+\.css)["']/g, (_, p) => `import "${p}?as=link"`)
      res.writeHead(200, { 'Content-Type': MIME['.js'] })
      return res.end(code)
    }

    const buf = await fs.readFile(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(buf)
  } catch (e) {
    console.error('[nobuild]', req.url, e)
    res.writeHead(500)
    res.end(String(e))
  }
})

server.listen(PORT, () => {
  console.log(`Nobuild POC dev server: http://localhost:${PORT}/`)
})
