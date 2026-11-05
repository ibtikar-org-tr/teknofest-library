import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { listTeams, getTeam, createTeam, updateTeam, deleteTeam } from '../repositories/teams';

const teamsRouter = new Hono<AppBindings>();

// Get all teams
teamsRouter.get('/', async (c) => {
  const data = await listTeams(c.env);
  return c.json(data);
});

// Get a single team by ID
teamsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await getTeam(c.env, id);
  if (!item) return c.json({ message: 'Not found' }, 404);
  return c.json(item);
});

// Create a new team
teamsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const created = await createTeam(c.env, body);
  return c.json(created, 201);
});

// Update a team by ID
teamsRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updateTeam(c.env, id, body);
  if (!updated) return c.json({ message: 'Not found' }, 404);
  return c.json(updated);
});

// Delete a team by ID
teamsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await deleteTeam(c.env, id);
  return c.json({ ok });
});

export default teamsRouter;
