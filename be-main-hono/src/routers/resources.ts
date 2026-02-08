import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { listResources, getResource, createResource, updateResource, deleteResource } from '../repositories/resources';

const resourcesRouter = new Hono<AppBindings>();

// Get resources by competition ID
resourcesRouter.get('/competition/:competitionId', async (c) => {
  const competitionId = c.req.param('competitionId');
  const data = await listResources(c.env);
  const filtered = data.filter(resource => resource.competition_id === competitionId);
  return c.json(filtered);
});

// Get all resources
resourcesRouter.get('/', async (c) => {
  const data = await listResources(c.env);
  return c.json(data);
});

// Get a single resource by ID
resourcesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await getResource(c.env, id);
  if (!item) return c.json({ message: 'Not found' }, 404);
  return c.json(item);
});

// Create a new resource
resourcesRouter.post('/', async (c) => {
  const body = await c.req.json();
  const created = await createResource(c.env, body);
  return c.json(created, 201);
});

// Update a resource by ID
resourcesRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updateResource(c.env, id, body);
  if (!updated) return c.json({ message: 'Not found' }, 404);
  return c.json(updated);
});

// Delete a resource by ID
resourcesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await deleteResource(c.env, id);
  return c.json({ ok });
});

export default resourcesRouter;
