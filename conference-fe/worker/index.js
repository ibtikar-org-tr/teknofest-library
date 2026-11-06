const IMAGE_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

function contentTypeForKey(key) {
  const ext = key.split('.').pop()?.toLowerCase()
  return IMAGE_TYPES[ext] || 'application/octet-stream'
}

/** R2 object keys match public CDN paths under files.ibtikar.tr */
async function serveFromR2(env, pathname) {
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

    // Only intercept archive image paths; let Vite/ASSETS handle modules & SPA.
    const r2Response = await serveFromR2(env, url.pathname)
    if (r2Response) return r2Response

    return env.ASSETS.fetch(request)
  },
}
