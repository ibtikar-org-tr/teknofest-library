# kitchen-backend

TEKNOFEST Kitchen API (Hono + Cloudflare Workers + D1).

- [docs/INTEGRATION.md](./docs/INTEGRATION.md) — VMS SSO, Library competitions, route prefix
- [docs/APPLICATIONS.md](./docs/APPLICATIONS.md) — summary+files form, primary/final stages
- [docs/TEAMS.md](./docs/TEAMS.md) — membership lock; manager remove/move only
- [docs/JURIES.md](./docs/JURIES.md) — juries, team exclusion, scoring
- [docs/LOCAL.md](./docs/LOCAL.md) — local Wrangler / demo seed (agents)

```bash
npm install
npx wrangler dev --config wrangler.offline.jsonc
```

Health: `GET http://localhost:9680/ms/kitchen/health`
