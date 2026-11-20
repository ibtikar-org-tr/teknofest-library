# Kitchen backend — local development (agents)

Do **not** bake Wrangler `--persist-to` into `package.json`. Keep npm scripts plain (`wrangler dev`, `db:migrate:local`) against this app’s own state.

Default offline start:

```bash
npx wrangler dev --config wrangler.offline.jsonc
```

`wrangler.offline.jsonc` reuses the same local D1 **ids** as VMS (`vms-database-local`, `membership-app-database-local`). Real seed/registration/`users` data only shows up if Miniflare state is shared with VMS (`VMS/backend/.wrangler/state`). That alignment is a **manual** choice when starting or migrating — for example:

```bash
npx wrangler dev --config wrangler.offline.jsonc --persist-to ../../VMS/backend/.wrangler/state
npx wrangler d1 migrations apply teknofest-kitchen --local --config wrangler.offline.jsonc --persist-to ../../VMS/backend/.wrangler/state
```

Without shared persist, empty or incomplete `VMS_DB` / `MEMBERS_DB` is expected. Do not “fix” that by changing package scripts.

Jury registrant names/emails need `MEMBERS_DB`; without a shared members DB the picker can still list membership numbers from `VMS_DB` registrations alone.

## Demo seed (gitignored)

Rich offline fixtures live in `scripts/seed-demo.mjs` (matched by `seed-*.mjs` in the repo `.gitignore` — do not commit). Run from `kitchen-backend`:

```bash
# Prefer shared VMS Miniflare state so members + registrations match SSO
PERSIST_TO=../../VMS/backend/.wrangler/state node scripts/seed-demo.mjs
```

Seeds ~13 members (password `KitchenTest123!`), event registrations, 6 demo teams/projects, juries with uneven assignments, and sample scores. Also writes kitchen rows into this app’s default local D1.
