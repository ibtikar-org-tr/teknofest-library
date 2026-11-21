# Kitchen — team membership

## Rule

Once a person is on a team for an event, **they cannot leave or switch teams themselves** at any stage.

Only a **VMS event manager** can:

- remove a member from a team  
- move a member to another team in the same event  
- create teams / assign members **regardless** of member self-service flags  

## Kitchen team settings (`event_kitchens`)

Managers set these under **مسابقات المطبخ** → إعدادات الفرق (or `PUT …/team-settings`):

| Setting | Default | Effect |
| --- | --- | --- |
| `allow_create_teams` | `false` | Members may `POST …/teams` |
| `allow_join_teams` | `false` | Members may `POST …/teams/:id/join` |
| `max_team_size` | `8` | Cap for create / join / move / teams-with-space |

Combinations:

- Neither: members cannot create or self-join (pool + manager assign still OK once registration is open).
- Create only: form a new team; cannot join someone else’s.
- Join only: join existing teams (e.g. ones the manager created); cannot create.
- Both: create and join.

Returned on `GET …/fields` and the competitions catalog so the UI can gate CTAs.

## Member-facing APIs

- Join / create / pool entry return **409** if the caller (or listed create-team member) is already on a team.
- Create returns **403** when `allow_create_teams` is false (managers bypass).
- Join returns **403** when `allow_join_teams` is false.
- There is **no** member self-leave endpoint.
- `PUT …/my-team/name` `{ team_name }` — any team member may rename the team.

## Manager APIs

- `DELETE /api/kitchens/:eventId/teams/:teamId/members/:memberId` — remove  
- `POST /api/kitchens/:eventId/members/:memberId/move` `{ to_team_id }` — transfer  
- `PUT /api/kitchens/:eventId/teams/:teamId/name` `{ team_name }` — rename  
- `PUT /api/kitchens/:eventId/team-settings` `{ allow_create_teams, allow_join_teams, max_team_size }`  

Admin UI: **إدارة الفرق** → expand team → إزالة / نقل.  
Team policies: **مسابقات المطبخ وقواعد الاهتمام**.
