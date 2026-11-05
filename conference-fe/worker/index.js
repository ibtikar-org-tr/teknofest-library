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

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
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
