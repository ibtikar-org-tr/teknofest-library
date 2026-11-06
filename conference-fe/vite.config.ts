import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

/** R2 sync source: ibtikar/files/media (sibling of files/events) */
const mediaRoot = fileURLToPath(new URL('../../files/media', import.meta.url))

function serveMediaFolder(): Plugin {
  const mime: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.heic': 'image/heic',
  }

  return {
    name: 'serve-media-folder',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/events/')) {
          next()
          return
        }

        const filePath = path.join(mediaRoot, url.slice(1))
        if (!filePath.startsWith(mediaRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next()
          return
        }

        const ext = path.extname(filePath).toLowerCase()
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare(), serveMediaFolder()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5925,
    fs: {
      // Explicit allow replaces Vite defaults — keep project root + media
      allow: [fileURLToPath(new URL('.', import.meta.url)), mediaRoot],
    },
  },
  preview: {
    port: 5925,
  },
})
