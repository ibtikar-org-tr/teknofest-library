import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { memberAuthMiddleware, staffAuthMiddleware } from '../middleware/staff-auth'
import {
  createIndividual,
  getIndividual,
  listIndividuals,
} from '../repositories/individuals'
import { createTeam, getTeam, listTeams } from '../repositories/teams'

const studentsRouter = new Hono<AppBindings>()

/**
 * Legacy global routes — prefer /api/kitchens/:eventId/*.
 * Kept for transitional admin tooling; create requires event_id.
 */

studentsRouter.post('/team', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  if (!body.event_id) return c.json({ message: 'event_id is required' }, 400)
  const team = await createTeam(c.env, body)
  return c.json(team, 201)
})

studentsRouter.post('/individual', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  if (!body.event_id) return c.json({ message: 'event_id is required' }, 400)
  const individual = await createIndividual(c.env, body)
  return c.json(individual, 201)
})

studentsRouter.get('/teams-with-space', memberAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  const teams = await listTeams(c.env, eventId)
  const withSpace = []
  for (const team of teams) {
    if (!team.is_active) continue
    const full = await getTeam(c.env, team.id)
    const memberCount = full?.members?.length ?? 0
    if (memberCount >= 6) continue
    withSpace.push({
      id: team.id,
      team_name: team.team_name,
      gender: team.gender,
      field: team.field,
      event_id: team.event_id,
      member_count: memberCount,
      available_slots: 6 - memberCount,
      members: (full?.members ?? []).map((m) => ({
        id: m.id,
        full_name: m.full_name,
        email: m.email,
        is_leader: m.is_leader,
      })),
    })
  }
  return c.json(withSpace)
})

studentsRouter.get('/verify-membership-number/:membership_number', memberAuthMiddleware, async (c) => {
  const membershipNumber = c.req.param('membership_number')
  return c.json({
    valid: Boolean(membershipNumber && membershipNumber.length >= 3),
    membership_number: membershipNumber,
  })
})

studentsRouter.get('/teams', staffAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  return c.json(await listTeams(c.env, eventId))
})

studentsRouter.get('/team/:team_id', staffAuthMiddleware, async (c) => {
  const teamId = Number(c.req.param('team_id'))
  const team = await getTeam(c.env, teamId)
  if (!team) return c.json({ message: 'Team not found' }, 404)
  return c.json(team)
})

studentsRouter.get('/individuals', staffAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  const unassignedOnly = c.req.query('unassigned_only') === 'true'
  const individuals = await listIndividuals(c.env, eventId)
  return c.json(unassignedOnly ? individuals.filter((i) => !i.is_assigned) : individuals)
})

studentsRouter.get('/individual/:individual_id', staffAuthMiddleware, async (c) => {
  const id = Number(c.req.param('individual_id'))
  const individual = await getIndividual(c.env, id)
  if (!individual) return c.json({ message: 'Individual not found' }, 404)
  return c.json(individual)
})

studentsRouter.get('/stats', staffAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  const teams = await listTeams(c.env, eventId)
  const individuals = await listIndividuals(c.env, eventId)
  return c.json({
    teams_count: teams.length,
    individuals_count: individuals.length,
    assigned_individuals: individuals.filter((i) => i.is_assigned).length,
  })
})

export default studentsRouter
