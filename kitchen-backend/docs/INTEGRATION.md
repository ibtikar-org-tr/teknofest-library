# Kitchen backend — integration notes

API prefix: `/ms/kitchen`  
Worker: Cloudflare (Hono + D1). Local: `http://localhost:9680`.

## Role

Event kitchens (teams, individuals, projects, evaluation) for VMS events.  
Competition catalog is **not** owned here — loaded from Library.

## Auth (VMS SSO)

1. FE lands on `/auth/callback?code=...&next=...`.
2. `POST /ms/kitchen/api/auth/vms/exchange` with `{ code, redirectUri }`.
   - `redirectUri` = current callback URL with `code` removed (must match VMS handoff).
3. Kitchen calls VMS `POST …/external-exchange` (HTTP via `VMS_API_BASE`).
4. Returns VMS `accessToken`; FE stores it as Bearer.
5. Protected routes verify the Bearer with VMS JWKS (`VMS_API_BASE/.well-known/jwks.json`).

No shared JWT private key and no `INTERNAL_SECRET` in Kitchen.

Config:

- `VMS_SERVICE` — Worker service binding to the VMS membership Worker (required in production when Kitchen shares the VMS host; same-zone `fetch(VMS_URL)` often misses the Worker)
- `VMS_API_BASE` — HTTP fallback for local/dev (`VMS_URL` + `/ms/membership-app/api`)
- `VMS_DB` — read-only D1 for events / registrations / manager checks
- `D1_DB` — kitchen data
- `LIBRARY` — service binding to library worker for competitions

CI var `VMS_SERVICE_NAME` must be the VMS membership Worker name (same value Career uses as `THIS_APP_NAME_BE`).

## Competitions

`GET /ms/kitchen/api/kitchens/:eventId/fields` proxies Library competitions.  
Teams/individuals/projects still store the chosen field as a display string (`field` / `preferred_field`), not a library id.

## Important when modifying Kitchen BE

- Keep routes under `/ms/kitchen/*` (FE `VITE_API_TARGET` includes that prefix).
- Do not mint Kitchen JWTs; always verify VMS tokens via JWKS.
- Exchange must forward the exact `redirectUri` VMS stored.
- Event access is gated by VMS registration / event manager checks (`VMS_DB`).
- Library binding is for competition catalog; do not duplicate competition tables here.
