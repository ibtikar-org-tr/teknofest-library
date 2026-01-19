import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import {
	listCompetitions,
	getCompetition,
	createCompetition,
	updateCompetition,
	deleteCompetition,
	getCompetitionData,
	upsertCompetitionData,
} from '../repositories/competitions';

const competitionRouters = new Hono<AppBindings>();

// Get all competitions
competitionRouters.get('/', async (c) => {
	const data = await listCompetitions(c.env);
	return c.json(data);
});

// Get a competition by ID
competitionRouters.get('/:id', async (c) => {
	const id = Number(c.req.param('id'));
	const item = await getCompetition(c.env, id);
	if (!item) return c.json({ message: 'Not found' }, 404);
	return c.json(item);
});

// Create a new competition
competitionRouters.post('/', async (c) => {
	const body = await c.req.json();
	const created = await createCompetition(c.env, body);
	return c.json(created, 201);
});

// Update a competition by ID
competitionRouters.put('/:id', async (c) => {
	const id = Number(c.req.param('id'));
	const body = await c.req.json();
	const updated = await updateCompetition(c.env, id, body);
	if (!updated) return c.json({ message: 'Not found' }, 404);
	return c.json(updated);
});

// Delete a competition by ID
competitionRouters.delete('/:id', async (c) => {
	const id = Number(c.req.param('id'));
	const ok = await deleteCompetition(c.env, id);
	return c.json({ ok });
});

// Get competition data (timeline, awards, criteria) by competition ID and year
competitionRouters.get('/:id/data/:year', async (c) => {
	const id = Number(c.req.param('id'));
	const year = Number(c.req.param('year'));
	const data = await getCompetitionData(c.env, id, year);
	if (!data) return c.json({ message: 'Competition data not found' }, 404);
	return c.json(data);
});

// Create or update competition data
competitionRouters.put('/:id/data/:year', async (c) => {
	const id = Number(c.req.param('id'));
	const year = Number(c.req.param('year'));
	const body = await c.req.json();
	await upsertCompetitionData(c.env, {
		competition_id: id,
		year: year,
		...body,
	});
	return c.json({ message: 'Competition data updated successfully' });
});

export default competitionRouters;