# Kitchen frontend — integration notes

Vite + React. Local: `http://localhost:9682`.

## Env

- `VITE_API_TARGET` — Kitchen API base **including** `/ms/kitchen`  
  local: `http://localhost:9680/ms/kitchen`  
  prod: typically `${VMS_URL}/ms/kitchen` if routed on the same host
- `VITE_VMS_LOGIN_URL` — VMS login page (SSO entry)
- `VITE_LIBRARY_URL` — TEKNOFEST library (TAL) public URL for competition links  
  GitHub Actions: `vars.LIBRARY_URL` (e.g. `https://tal.ibtikar.tr`)

## SSO flow

1. `buildVmsSsoLoginUrl` / Integrations handoff → VMS with `client=kitchen` and callback URL.
2. Callback route: `/auth/callback`.
3. Exchange via Kitchen BE: `{ code, redirectUri }` where `redirectUri` is `window.location` with `code` removed.
4. Store `access_token` from Kitchen; send `Authorization: Bearer …` on API calls.

VMS must allowlist this FE origin in `CORS_ALLOW_ORIGINS`.  
VMS Integrations uses `VITE_KITCHEN_URL` (must be the real Kitchen FE URL, not localhost, in production builds).

## Competitions UI

Field dropdowns load from Kitchen `GET /kitchens/:eventId/fields` (Library-backed).  
Do not hardcode competition lists in the FE.

## Juries

- Admin: `/admin/events/:eventId/juries` — appoint registrants and assign teams.
- Scoring UI: `/events/:eventId/jury` (navbar “تحكيم” when `kitchen.is_jury`).
- Only juries with team assignments can POST `/evaluation/admin`. Managers use the jury page after self-appointing; admin evaluations is view-only.

## Important when modifying Kitchen FE

- API axios `baseURL` is `VITE_API_TARGET + '/api'`.
- Keep `/auth/callback` query handling compatible with VMS handoff (`code`, `next`).
- Attachment links and other absolute BE URLs must use `API_BASE_URL`, not relative `/api/...` on the FE origin.
