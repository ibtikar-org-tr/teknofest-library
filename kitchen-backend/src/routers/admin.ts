import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { requireSuperAdmin, staffAuthMiddleware } from '../middleware/staff-auth'
import {
  disableEventKitchen,
  enableEventKitchen,
  getEventKitchen,
  listEventKitchens,
} from '../repositories/event-kitchens'
import { listUnassignedIndividuals } from '../repositories/individuals'
import {
  createProgramVersion,
  listProgramVersions,
  listStaff,
  updateStaffWeight,
  upsertStaff,
} from '../repositories/staff'
import { getVmsEvent, listVmsEvents } from '../repositories/vms-events'
import { staffToAdminView } from '../utils/mappers'

const adminRouter = new Hono<AppBindings>()

adminRouter.use('*', staffAuthMiddleware)

adminRouter.get('/me', async (c) => {
  const staff = c.get('staff')
  if (!staff) return c.json({ message: 'Unauthorized' }, 401)
  return c.json(staffToAdminView(staff))
})

adminRouter.get('/is-super-admin', async (c) => {
  return c.json({ is_super_admin: Boolean(c.get('staff')?.is_superadmin) })
})

/** All VMS events with kitchen enablement status (direct VMS_DB read). */
adminRouter.get('/vms-events', async (c) => {
  const [events, kitchens] = await Promise.all([
    listVmsEvents(c.env),
    listEventKitchens(c.env),
  ])
  const kitchenByEvent = new Map(kitchens.map((k) => [k.event_id, k]))
  return c.json(
    events.map((event) => {
      const kitchen = kitchenByEvent.get(event.id) ?? null
      return {
        ...event,
        kitchen_enabled: Boolean(kitchen?.enabled),
        kitchen,
      }
    }),
  )
})

adminRouter.post('/kitchens', async (c) => {
  const body = await c.req.json<{ event_id?: string }>()
  const eventId = body.event_id?.trim()
  if (!eventId) return c.json({ message: 'event_id is required' }, 400)

  const event = await getVmsEvent(c.env, eventId)
  if (!event) return c.json({ message: 'VMS event not found' }, 404)

  const staff = c.get('staff')!
  const kitchen = await enableEventKitchen(c.env, eventId, staff.membership_number)
  return c.json({ ...event, kitchen_enabled: true, kitchen }, 201)
})

adminRouter.delete('/kitchens/:eventId', async (c) => {
  const eventId = c.req.param('eventId')
  const existing = await getEventKitchen(c.env, eventId)
  if (!existing) return c.json({ message: 'Kitchen not found' }, 404)
  const kitchen = await disableEventKitchen(c.env, eventId)
  return c.json({ event_id: eventId, kitchen_enabled: false, kitchen })
})

adminRouter.get('/stats', async (c) => {
  const eventId = c.req.query('event_id')
  if (eventId) {
    const [teams, individuals, projects] = await Promise.all([
      c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM teams WHERE event_id = ?')
        .bind(eventId)
        .first<{ count: number }>(),
      c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM individuals WHERE event_id = ?')
        .bind(eventId)
        .first<{ count: number }>(),
      c.env.D1_DB.prepare(
        'SELECT COUNT(*) as count FROM project_submissions WHERE event_id = ?',
      )
        .bind(eventId)
        .first<{ count: number }>(),
    ])
    return c.json({
      event_id: eventId,
      teams: Number(teams?.count ?? 0),
      individuals: Number(individuals?.count ?? 0),
      projects: Number(projects?.count ?? 0),
    })
  }

  const [teams, individuals, projects, staff, kitchens] = await Promise.all([
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM teams').first<{ count: number }>(),
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM individuals').first<{ count: number }>(),
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM project_submissions').first<{ count: number }>(),
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM kitchen_staff').first<{ count: number }>(),
    c.env.D1_DB.prepare(
      'SELECT COUNT(*) as count FROM event_kitchens WHERE enabled = 1',
    ).first<{ count: number }>(),
  ])
  return c.json({
    teams: Number(teams?.count ?? 0),
    individuals: Number(individuals?.count ?? 0),
    projects: Number(projects?.count ?? 0),
    admins: Number(staff?.count ?? 0),
    kitchens: Number(kitchens?.count ?? 0),
  })
})

adminRouter.get('/admins', async (c) => {
  const staff = await listStaff(c.env)
  return c.json(staff.map(staffToAdminView))
})

adminRouter.put('/admins/:membership_number/weight', requireSuperAdmin, async (c) => {
  const membershipNumber = c.req.param('membership_number')
  const body = await c.req.json<{ evaluation_weight: number }>()
  const weight = Number(body.evaluation_weight)
  if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
    return c.json({ message: 'evaluation_weight must be between 0 and 100' }, 400)
  }

  const updated = await updateStaffWeight(c.env, membershipNumber, weight)
  if (!updated) return c.json({ message: 'Staff not found' }, 404)
  return c.json(staffToAdminView(updated))
})

adminRouter.post('/staff', requireSuperAdmin, async (c) => {
  const body = await c.req.json<{
    membership_number: string
    email: string
    full_name?: string
    evaluation_weight?: number
    is_superadmin?: boolean
  }>()

  if (!body.membership_number?.trim() || !body.email?.trim()) {
    return c.json({ message: 'membership_number and email are required' }, 400)
  }

  const staff = await upsertStaff(c.env, {
    membership_number: body.membership_number.trim(),
    email: body.email.trim(),
    full_name: body.full_name,
    evaluation_weight: body.evaluation_weight,
    is_superadmin: body.is_superadmin,
  })
  return c.json(staffToAdminView(staff), 201)
})

adminRouter.get('/unassigned-individuals', async (c) => {
  const individuals = await listUnassignedIndividuals(c.env)
  return c.json(individuals)
})

adminRouter.post('/program-version', async (c) => {
  const body = await c.req.json()
  const version = await createProgramVersion(c.env, body)
  return c.json(version, 201)
})

adminRouter.get('/program-versions', async (c) => {
  const versions = await listProgramVersions(c.env)
  return c.json(versions)
})

export default adminRouter
