# Kitchen — team membership

## Rule

Once a person is on a team for an event, **they cannot leave or switch teams themselves** at any stage.

Only a **VMS event manager** can:

- remove a member from a team  
- move a member to another team in the same event  

## Member-facing APIs

- Join / create / pool entry return **409** if the caller (or listed create-team member) is already on a team.
- There is **no** member self-leave endpoint.

## Manager APIs

- `DELETE /api/kitchens/:eventId/teams/:teamId/members/:memberId` — remove  
- `POST /api/kitchens/:eventId/members/:memberId/move` `{ to_team_id }` — transfer  

Admin UI: **إدارة الفرق** → expand team → إزالة / نقل.
