import { Hono } from 'hono'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { requireEventKitchenAccess } from '../middleware/event-access'
import { createIndividual, listIndividuals } from '../repositories/individuals'
import { createProject, listProjects } from '../repositories/projects'
import { getEventKitchen, listEventKitchens } from '../repositories/event-kitchens'
import { createTeam, getTeam, listTeams } from '../repositories/teams'
import {
  getVmsEvent,
  getVmsEventsByIds,
  isMemberRegisteredForEvent,
} from '../repositories/vms-events'
import type { AppBindings, Environment, KitchenMember, KitchenStaffSession } from '../types/env'
import type { KitchenEventView } from '../types/models'

const kitchensRouter = new Hono<AppBindings>()

const PROJECT_FIELDS = [
  'مسابقة التنقل الذكي',
  'مسابقة ابتكار التكنولوجيا الحيوية',
  'مسابقة تقنيات البيئة والطاقة',
  'مسابقة تقنيات التعليم',
  'مسابقة تقنيات المعيشة الخالية من العوائق',
  'مسابقة أفكار التكنولوجيا المالية',
  'مسابقة التكنولوجيا لصالح البشرية',
  'مسابقة تطبيقات التكنولوجيا في علم النفس',
  'مسابقة الذكاء الاصطناعي في الصحة',
  'مسابقة التقنيات الصناعية',
  'مسابقة التكنولوجيا الزراعية',
  'مسابقة هاكاثون السفر',
  'مسابقة تقنيات السياحة',
  'مسابقة معالجة اللغة التركية',
  'مسابقة الذكاء الاصطناعي في النقل',
  'مسابقة تطبيقات نماذج اللغة الضخمة',
  'مسابقة تقنيات أنظمة الدفاع الجويّة',
]

async function buildKitchenViews(
  env: Environment,
  kitchens: Awaited<ReturnType<typeof listEventKitchens>>,
  member: KitchenMember | undefined,
  staff: KitchenStaffSession | undefined,
): Promise<KitchenEventView[]> {
  const events = await getVmsEventsByIds(
    env,
    kitchens.map((k) => k.event_id),
  )
  const byId = new Map(events.map((e) => [e.id, e]))

  const views: KitchenEventView[] = []
  for (const kitchen of kitchens) {
    const event = byId.get(kitchen.event_id)
    if (!event) continue

    let canAccess = Boolean(staff)
    if (!canAccess && member) {
      canAccess = await isMemberRegisteredForEvent(
        env,
        kitchen.event_id,
        member.membership_number,
      )
    }

    views.push({
      ...event,
      kitchen_enabled: kitchen.enabled,
      kitchen,
      can_access: canAccess,
    })
  }
  return views
}

const withEventAccess = [memberAuthMiddleware, requireEventKitchenAccess] as const

/** Enabled kitchens on the platform (members: registered only; staff: all). */
kitchensRouter.get('/', memberAuthMiddleware, async (c) => {
  const kitchens = await listEventKitchens(c.env, { enabledOnly: true })
  const views = await buildKitchenViews(c.env, kitchens, c.get('member'), c.get('staff'))
  if (c.get('staff')) return c.json(views)
  return c.json(views.filter((v) => v.can_access))
})

kitchensRouter.get('/:eventId/fields', ...withEventAccess, (c) => c.json(PROJECT_FIELDS))

kitchensRouter.post('/:eventId/teams', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const team = await createTeam(c.env, { ...body, event_id: eventId })
  return c.json(team, 201)
})

kitchensRouter.post('/:eventId/individuals', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const individual = await createIndividual(c.env, { ...body, event_id: eventId })
  return c.json(individual, 201)
})

kitchensRouter.get('/:eventId/teams-with-space', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
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

kitchensRouter.post('/:eventId/projects', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()

  let teamId = Number(body.team_id)
  if (!Number.isFinite(teamId) || teamId <= 0) {
    const email = String(body.member_email ?? '').trim().toLowerCase()
    if (!email) {
      return c.json({ message: 'team_id or member_email is required' }, 400)
    }
    const row = await c.env.D1_DB.prepare(
      `SELECT t.id AS team_id
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE t.event_id = ? AND lower(tm.email) = ?
       LIMIT 1`,
    )
      .bind(eventId, email)
      .first<{ team_id: number }>()
    if (!row) {
      return c.json({ message: 'No team found for this member email in this event' }, 404)
    }
    teamId = Number(row.team_id)
  }

  const team = await getTeam(c.env, teamId)
  if (!team || team.event_id !== eventId) {
    return c.json({ message: 'Team not found in this event kitchen' }, 404)
  }

  const programVersionId = Number(body.program_version_id) || 1
  const project = await createProject(c.env, {
    ...body,
    event_id: eventId,
    team_id: teamId,
    program_version_id: programVersionId,
  })
  return c.json(project, 201)
})

kitchensRouter.get('/:eventId/teams', ...withEventAccess, async (c) => {
  if (!c.get('staff')) return c.json({ message: 'Staff only' }, 403)
  return c.json(await listTeams(c.env, c.req.param('eventId')))
})

kitchensRouter.get('/:eventId/individuals', ...withEventAccess, async (c) => {
  if (!c.get('staff')) return c.json({ message: 'Staff only' }, 403)
  const eventId = c.req.param('eventId')
  const unassignedOnly = c.req.query('unassigned_only') === 'true'
  const individuals = await listIndividuals(c.env, eventId)
  return c.json(unassignedOnly ? individuals.filter((i) => !i.is_assigned) : individuals)
})

kitchensRouter.get('/:eventId/projects', ...withEventAccess, async (c) => {
  if (!c.get('staff')) return c.json({ message: 'Staff only' }, 403)
  return c.json(await listProjects(c.env, c.req.param('eventId')))
})

kitchensRouter.get('/:eventId/stats', ...withEventAccess, async (c) => {
  if (!c.get('staff')) return c.json({ message: 'Staff only' }, 403)
  const eventId = c.req.param('eventId')
  const [teams, individuals, projects] = await Promise.all([
    listTeams(c.env, eventId),
    listIndividuals(c.env, eventId),
    listProjects(c.env, eventId),
  ])
  return c.json({
    teams_count: teams.length,
    individuals_count: individuals.length,
    assigned_individuals: individuals.filter((i) => i.is_assigned).length,
    projects_count: projects.length,
  })
})

kitchensRouter.get('/:eventId', memberAuthMiddleware, async (c) => {
  const eventId = c.req.param('eventId')
  const kitchen = await getEventKitchen(c.env, eventId)
  if (!kitchen?.enabled) {
    return c.json({ message: 'Kitchen not available for this event' }, 404)
  }

  const event = await getVmsEvent(c.env, eventId)
  if (!event) return c.json({ message: 'Event not found in VMS' }, 404)

  const staff = c.get('staff')
  const member = c.get('member')
  let canAccess = Boolean(staff)
  if (!canAccess && member) {
    canAccess = await isMemberRegisteredForEvent(c.env, eventId, member.membership_number)
  }
  if (!canAccess) {
    return c.json(
      { message: 'You must be registered for this VMS event to enter its kitchen' },
      403,
    )
  }

  const view: KitchenEventView = {
    ...event,
    kitchen_enabled: true,
    kitchen,
    can_access: true,
  }
  return c.json(view)
})

export default kitchensRouter
