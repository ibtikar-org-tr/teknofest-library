import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import {
	getCompetitionData,
	upsertCompetitionData,
} from '../repositories/competitions';

const competitionDataRouters = new Hono<AppBindings>();


// Get competition data (timeline, awards, criteria) by competition ID and year
competitionDataRouters.get('/:id/:year', async (c) => {
	const id = Number(c.req.param('id'));
	const year = Number(c.req.param('year'));
	const data = await getCompetitionData(c.env, id, year);
	if (!data) return c.json({ message: 'Competition data not found' }, 404);
	return c.json(data);
});

// Create or update competition data
competitionDataRouters.put('/:id/:year', async (c) => {
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

export default competitionDataRouters;