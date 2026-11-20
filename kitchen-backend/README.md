# kitchen-backend

TEKNOFEST Kitchen API (Hono + Cloudflare Workers + D1).

See [docs/INTEGRATION.md](./docs/INTEGRATION.md) for VMS SSO, Library competitions, and route prefix rules.

```bash
npm install
npx wrangler dev --config wrangler.offline.jsonc
```

Health: `GET http://localhost:9680/ms/kitchen/health`
