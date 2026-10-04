import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

// Serve the real production SW with two HTML revisions to exercise its lifecycle.
export async function servePwaBuild(
  { legacy = false }: { legacy?: boolean } = {},
) {
  let version = 'a'
  const root = resolve('dist')
  const types: Record<string, string> = {
    '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json',
    '.png': 'image/png', '.svg': 'image/svg+xml',
  }
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
      const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
      if (!file.startsWith(`${root}/`)) { response.writeHead(403).end(); return }
      let content: Buffer | string = await readFile(file)
      if (legacy && version === 'a' && pathname === '/sw.js') {
        content = `
          self.addEventListener('install', () => self.skipWaiting())
          self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
          self.addEventListener('fetch', () => {})
        `
      } else if (pathname === '/sw.js') {
        content = content.toString().replace(/(url:"index.html",revision:")[^"]+/, `$1${version}`)
      } else if (legacy && version === 'a' && file.endsWith('/index.html')) {
        content = `<!doctype html><html><head>
          <meta name="test-release" content="a"><title>Legacy Lean</title>
          </head><body><main id="root">Legacy app</main><script>
          let reloading = false
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!reloading) { reloading = true; window.location.reload() }
          })
          navigator.serviceWorker.register('/sw.js')
          </script></body></html>`
      } else if (file.endsWith('/index.html')) {
        content = content.toString().replace('<head>', `<head><meta name="test-release" content="${version}">`)
      }
      response.writeHead(200, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      }).end(content)
    } catch { response.writeHead(404).end() }
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No PWA test server port')
  return {
    url: `http://127.0.0.1:${address.port}`,
    deploy: () => { version = 'b' },
    close: () => new Promise<void>((done, reject) => {
      server.close((error) => error ? reject(error) : done())
      server.closeAllConnections()
    }),
  }
}
