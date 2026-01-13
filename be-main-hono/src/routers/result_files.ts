import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { listResultFiles, getResultFile, createResultFile, updateResultFile, deleteResultFile } from '../repositories/result_files';

const resultFilesRouter = new Hono<AppBindings>();

// Get all result files
resultFilesRouter.get('/', async (c) => {
  const data = await listResultFiles(c.env);
  return c.json(data);
});

// Get a result file by ID
resultFilesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await getResultFile(c.env, id);
  if (!item) return c.json({ message: 'Not found' }, 404);
  return c.json(item);
});

// Create a new result file
resultFilesRouter.post('/', async (c) => {
  const body = await c.req.json();
  const created = await createResultFile(c.env, body);
  return c.json(created, 201);
});

// Update a result file by ID
resultFilesRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updateResultFile(c.env, id, body);
  if (!updated) return c.json({ message: 'Not found' }, 404);
  return c.json(updated);
});

// Delete a result file by ID
resultFilesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await deleteResultFile(c.env, id);
  return c.json({ ok });
});

export default resultFilesRouter;
