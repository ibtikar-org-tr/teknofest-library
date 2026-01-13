import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { listMembers, getMember, createMember, updateMember, deleteMember } from '../repositories/members';

const membersRouter = new Hono<AppBindings>();

// Get all members
membersRouter.get('/', async (c) => {
  const data = await listMembers(c.env);
  return c.json(data);
});

// Get a single member by ID
membersRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await getMember(c.env, id);
  if (!item) return c.json({ message: 'Not found' }, 404);
  return c.json(item);
});

// Create a new member
membersRouter.post('/', async (c) => {
  const body = await c.req.json();
  const created = await createMember(c.env, body);
  return c.json(created, 201);
});

// Update a member by ID
membersRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updateMember(c.env, id, body);
  if (!updated) return c.json({ message: 'Not found' }, 404);
  return c.json(updated);
});

// Delete a member by ID
membersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await deleteMember(c.env, id);
  return c.json({ ok });
});

export default membersRouter;
