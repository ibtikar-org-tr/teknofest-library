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
