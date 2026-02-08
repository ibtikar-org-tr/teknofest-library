import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { listReportFiles, getReportFile, createReportFile, updateReportFile, deleteReportFile } from '../repositories/report_files';

const reportFilesRouter = new Hono<AppBindings>();

// Get report files by competition ID
reportFilesRouter.get('/competition/:competitionId', async (c) => {
  const competitionId = c.req.param('competitionId');
  const data = await listReportFiles(c.env);
  const filtered = data.filter(file => file.competition_id === Number(competitionId));
  return c.json(filtered);
});

// Get all report files
reportFilesRouter.get('/', async (c) => {
  const data = await listReportFiles(c.env);
  return c.json(data);
});

// Get a report file by ID
reportFilesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await getReportFile(c.env, id);
  if (!item) return c.json({ message: 'Not found' }, 404);
  return c.json(item);
});

// Create a new report file
reportFilesRouter.post('/', async (c) => {
  const body = await c.req.json();
  const created = await createReportFile(c.env, body);
  return c.json(created, 201);
});

// Update a report file by ID
reportFilesRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updateReportFile(c.env, id, body);
  if (!updated) return c.json({ message: 'Not found' }, 404);
  return c.json(updated);
});

// Delete a report file by ID
reportFilesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await deleteReportFile(c.env, id);
  return c.json({ ok });
});

export default reportFilesRouter;
