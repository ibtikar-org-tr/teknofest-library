const TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

function typeFor(pathname) {
  if (pathname === '/' || pathname.endsWith('/')) return TYPES.html
  const ext = pathname.split('.').pop()?.toLowerCase()
  return TYPES[ext] || TYPES.html
}

function contentTypeForKey(key) {
  const ext = key.split('.').pop()?.toLowerCase()
  return TYPES[ext] || 'application/octet-stream'
}

/** R2 object keys match public CDN paths under files.ibtikar.tr */
async function serveFromR2(request, env, pathname) {
  if (!env.FILES) return null
  if (!pathname.startsWith('/events/')) return null

  const key = pathname.replace(/^\/+/, '')
  const object = await env.FILES.get(key)
  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  if (!headers.has('content-type')) {
    headers.set('Content-Type', contentTypeForKey(key))
  }
  headers.set('Cache-Control', 'public, max-age=86400')

  return new Response(object.body, { headers })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const r2Response = await serveFromR2(request, env, url.pathname)
    if (r2Response) return r2Response

    let res = await env.ASSETS.fetch(request)
    if (
      res.status === 404 &&
      (url.pathname === '/' || request.headers.get('Accept')?.includes('text/html'))
    ) {
      res = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request))
    }
    const headers = new Headers(res.headers)
    headers.set('Content-Type', typeFor(url.pathname === '/' ? '/index.html' : url.pathname))
    return new Response(res.body, { status: res.status, headers })
  },
}
