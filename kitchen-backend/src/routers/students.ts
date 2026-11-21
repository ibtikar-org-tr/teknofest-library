import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { requireEventManager } from '../middleware/event-manager'
import { canManageVmsEvent } from '../repositories/vms-event-permissions'
import {
  createIndividual,
  getIndividual,
  listIndividuals,
} from '../repositories/individuals'
import { getKitchenMaxTeamSize } from '../repositories/event-kitchens'
import { createTeam, getTeam, listTeams } from '../repositories/teams'
import { fetchVmsMemberProfile } from '../repositories/vms-member-profile'
import { lookupMemberContact } from '../repositories/vms-events'

const studentsRouter = new Hono<AppBindings>()

/**
 * Legacy global routes — prefer /api/kitchens/:eventId/*.
 * Kept for transitional admin tooling; create requires event_id.
 */

studentsRouter.post('/team', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  if (!body.event_id) return c.json({ message: 'event_id is required' }, 400)
  const member = c.get('member')
  const sessionEmail = member?.email?.trim().toLowerCase()
  const sessionMembership = member?.membership_number?.trim()
  const members = Array.isArray(body.members)
    ? body.members.map(
        (m: {
          email?: string
          membership_number?: string | null
        }) => {
          const membershipNumber = m.membership_number?.trim() || null
          const isSubmitter =
            Boolean(sessionMembership) && membershipNumber === sessionMembership
          return {
            ...m,
            membership_number: membershipNumber,
            email: isSubmitter && sessionEmail ? sessionEmail : String(m.email ?? '').trim(),
          }
        },
      )
    : body.members
  const team = await createTeam(c.env, { ...body, field: '', members })
  return c.json(team, 201)
})

studentsRouter.post('/individual', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  if (!body.event_id) return c.json({ message: 'event_id is required' }, 400)
  const member = c.get('member')
  if (!member?.membership_number || !member.email) {
    return c.json({ message: 'Authenticated VMS member required' }, 401)
  }

  const profile = await fetchVmsMemberProfile(
    c.env,
    member.membership_number,
    c.req.header('Authorization'),
  )
  if (!profile) {
    return c.json(
      { message: 'Could not load your VMS profile — re-login and try again' },
      502,
    )
  }

  const preferredIds = Array.isArray(body.preferred_competition_ids)
    ? body.preferred_competition_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
    : body.preferred_field
      ? [Number(body.preferred_field)].filter((n: number) => Number.isFinite(n) && n > 0)
      : []
  if (preferredIds.length === 0) {
    return c.json({ message: 'preferred_competition_ids is required' }, 400)
  }

  const individual = await createIndividual(c.env, {
    ...body,
    preferred_field: String(preferredIds[0]),
    preferred_competition_ids: preferredIds,
    email: member.email || profile.email,
    membership_number: member.membership_number,
    full_name: profile.full_name,
    phone: profile.phone,
    gender: profile.gender,
    technical_skills: profile.technical_skills || null,
    interests: profile.interests || null,
  })
  return c.json(individual, 201)
})

studentsRouter.get('/teams-with-space', memberAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  const maxTeamSize = await getKitchenMaxTeamSize(c.env, eventId)
  const teams = await listTeams(c.env, eventId)
  const withSpace = []
  for (const team of teams) {
    if (!team.is_active) continue
    const full = await getTeam(c.env, team.id)
    const memberCount = full?.members?.length ?? 0
    if (memberCount >= maxTeamSize) continue
    withSpace.push({
      id: team.id,
      team_name: team.team_name,
      gender: team.gender,
      field: team.field,
      event_id: team.event_id,
      member_count: memberCount,
      available_slots: maxTeamSize - memberCount,
      max_team_size: maxTeamSize,
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
  const membershipNumber = c.req.param('membership_number')?.trim() || ''
  const contact = await lookupMemberContact(c.env, membershipNumber)
  if (!contact) {
    return c.json({
      success: false,
      valid: false,
      membership_number: membershipNumber,
    })
  }
  return c.json({
    success: true,
    valid: true,
    membership_number: contact.membership_number,
    member: {
      ar_name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      sex: contact.gender,
    },
  })
})

studentsRouter.get('/teams', memberAuthMiddleware, requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
  return c.json(await listTeams(c.env, eventId))
})

studentsRouter.get('/team/:team_id', memberAuthMiddleware, async (c) => {
  const teamId = Number(c.req.param('team_id'))
  const team = await getTeam(c.env, teamId)
  if (!team) return c.json({ message: 'Team not found' }, 404)
  const member = c.get('member')
  if (!team.event_id || !(await canManageVmsEvent(c.env, team.event_id, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can view this team' }, 403)
  }
  return c.json(team)
})

studentsRouter.get('/individuals', memberAuthMiddleware, requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
  const unassignedOnly = c.req.query('unassigned_only') === 'true'
  const individuals = await listIndividuals(c.env, eventId)
  return c.json(unassignedOnly ? individuals.filter((i) => !i.is_assigned) : individuals)
})

studentsRouter.get('/individual/:individual_id', memberAuthMiddleware, async (c) => {
  const id = Number(c.req.param('individual_id'))
  const individual = await getIndividual(c.env, id)
  if (!individual) return c.json({ message: 'Individual not found' }, 404)
  const member = c.get('member')
  if (
    !individual.event_id ||
    !(await canManageVmsEvent(c.env, individual.event_id, member?.membership_number))
  ) {
    return c.json({ message: 'Only VMS event managers can view this individual' }, 403)
  }
  return c.json(individual)
})

studentsRouter.get('/stats', memberAuthMiddleware, requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
  const teams = await listTeams(c.env, eventId)
  const individuals = await listIndividuals(c.env, eventId)
  return c.json({
    teams_count: teams.length,
    individuals_count: individuals.length,
    assigned_individuals: individuals.filter((i) => i.is_assigned).length,
  })
})

export default studentsRouter
