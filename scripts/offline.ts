import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

/** Emit before Nitro indexes public assets, so the worker is served in production. */
export function offlineShell(): Plugin {
  return {
    name: 'twodo-offline-shell',
    apply: 'build',
    applyToEnvironment: (environment) => environment.name === 'client',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256')
      for (const asset of Object.values(bundle))
        hash.update(asset.type === 'chunk' ? asset.code : asset.source)
      const cache = `twodo-shell-${hash.digest('hex').slice(0, 16)}`
      const urls = [
        '/favicon.png',
        '/manifest.json',
        ...Object.keys(bundle)
          .filter((name) => !name.endsWith('.map'))
          .map((name) => `/${name}`),
      ]
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(URLS);
    // Start SPA mode returns an anonymous root shell. Never cache a signed-in document.
    const shell = await fetch('/', { credentials: 'omit', cache: 'reload' });
    if (!shell.ok) throw new Error('Unable to cache the offline shell');
    await cache.put('/offline-shell', shell);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('twodo-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_serverFn/')) {
    event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match('/offline-shell'))));
  } else if (URLS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(event.request)));
  }
});
`,
      })
    },
  }
}
