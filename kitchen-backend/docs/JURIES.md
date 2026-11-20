# Kitchen — juries and scoring

- Managers appoint juries from VMS event registrants (`event_juries`) and assign teams (`jury_team_assignments`).
- Juries cannot be on any team (and team members cannot be appointed as jury) for that event.
- Only assigned juries can submit evaluations — manager role alone cannot score. A manager who wants to score must appoint themselves as jury (and must not be on a team) with team assignments like anyone else.
- Final project score = arithmetic mean of non-AI jury scores for that project (jury count does not weight the average). No jury scores yet → `final_score` is null.
- Jury UI: `GET /api/kitchens/:eventId/my-jury-assignments` + `POST /api/evaluation/admin` (upsert per jury).
- Admin evaluations page is read-only summaries; manage juries at `/admin/events/:eventId/juries`.
