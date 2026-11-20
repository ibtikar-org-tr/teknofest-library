# Kitchen — applications (two stages)

Teams apply with **summary + files only** (no long form fields).

## Dashboard steps (frontend)

On the team dashboard the path is shown as **three steps**:

1. **Choose competition** — stored on `teams.field` (not a jury stage)
2. **Primary** application
3. **Final** application

Primary/final forms are blocked until a competition is chosen.

## Backend stages

Only **two** application stages exist in data/scoring:

1. **primary** — first application  
2. **final** — unlocked only after a primary submission exists  

Each is a separate `project_submissions` row (`stage`, unique per team). Stages are **juried separately**.

## Scoring

- Stage score = average of assigned jury scores for that stage’s submission  
- Overall team score = **40% primary + 60% final** (both stage averages required; otherwise overall is null)

## APIs

- Choose competition: `PUT /api/kitchens/:eventId/my-team/competition` `{ field }` (locked after primary is submitted)
- Submit: `POST /api/kitchens/:eventId/projects` with `{ stage, summary, team_id? }`
- Own apps: `GET /api/kitchens/:eventId/my-projects`
- Score payload includes `stage_score`, `primary_average`, `final_average`, `overall_score`
