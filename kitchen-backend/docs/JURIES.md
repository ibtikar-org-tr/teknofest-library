# Kitchen — juries and scoring

- Managers appoint juries from VMS event registrants (`event_juries`) and assign teams (`jury_team_assignments`).
- Juries cannot be on any team (and team members cannot be appointed as jury) for that event.
- Only assigned juries can submit evaluations — manager role alone cannot score. A manager who wants to score must appoint themselves as jury (and must not be on a team) with team assignments like anyone else.
- Jury scores require non-empty **notes** (not optional).
- Each **application stage** (primary / final) is scored separately: stage score = arithmetic mean of non-AI jury scores for that submission.
- **Overall** team score = 40% primary stage + 60% final stage (see [APPLICATIONS.md](./APPLICATIONS.md)).
- Jury UI: `GET /api/kitchens/:eventId/my-jury-assignments` + `POST /api/evaluation/admin` (upsert per jury per stage submission).
- Admin evaluations page is read-only summaries; manage juries at `/admin/events/:eventId/juries`.
- `GET /juries` includes per-jury `duty_done` / `duty_required` (submitted stages on assigned teams that this jury scored), `team_duties`, and event-wide `teams_index` (which teams submitted primary/final) for compact stage icons in the admin UI.
- Managers can bot-DM a jury via `POST /juries/:membershipNumber/notify` → Kitchen → VMS `POST /telegram/notify` (manager Bearer) → telegram-ms. Requires the jury’s `telegram_id` (bot `/start`). Manual `t.me` open remains available when `@username` exists. No kitchen↔telegram shared secret.
