import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { requireEventManager } from '../middleware/event-manager'
import {
  disableEventKitchen,
  enableEventKitchen,
  getEventKitchen,
  listEventKitchens,
} from '../repositories/event-kitchens'
import { listUnassignedIndividuals } from '../repositories/individuals'
import { createProgramVersion, listProgramVersions } from '../repositories/staff'
import {
  canManageVmsEvent,
  listManagedVmsEvents,
  memberManagesAnyEvent,
} from '../repositories/vms-event-permissions'
import { getVmsEvent } from '../repositories/vms-events'

const adminRouter = new Hono<AppBindings>()

adminRouter.use('*', memberAuthMiddleware)

adminRouter.get('/me', async (c) => {
  const member = c.get('member')
  if (!member) return c.json({ message: 'Unauthorized' }, 401)
  const canManage = await memberManagesAnyEvent(c.env, member.membership_number)
  return c.json({
    membership_number: member.membership_number,
    email: member.email,
    can_manage_kitchens: canManage,
  })
})

/** @deprecated No Kitchen system admin — always false. Kept for transitional FE. */
adminRouter.get('/is-super-admin', async (c) => {
  return c.json({ is_super_admin: false })
})

/** VMS events this member can manage, with kitchen enablement status. */
adminRouter.get('/vms-events', async (c) => {
  const member = c.get('member')
  if (!member) return c.json({ message: 'Unauthorized' }, 401)

  const [events, kitchens] = await Promise.all([
    listManagedVmsEvents(c.env, member.membership_number),
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
        can_manage: true,
      }
    }),
  )
})

adminRouter.post('/kitchens', async (c) => {
  const member = c.get('member')
  if (!member) return c.json({ message: 'Unauthorized' }, 401)

  const body = await c.req.json<{ event_id?: string }>()
  const eventId = body.event_id?.trim()
  if (!eventId) return c.json({ message: 'event_id is required' }, 400)

  const event = await getVmsEvent(c.env, eventId)
  if (!event) return c.json({ message: 'VMS event not found' }, 404)

  if (!(await canManageVmsEvent(c.env, eventId, member.membership_number))) {
    return c.json({ message: 'Only VMS event managers can enable a kitchen for this event' }, 403)
  }

  const kitchen = await enableEventKitchen(c.env, eventId, member.membership_number)
  return c.json({ ...event, kitchen_enabled: true, kitchen }, 201)
})

adminRouter.delete('/kitchens/:eventId', async (c) => {
  const member = c.get('member')
  if (!member) return c.json({ message: 'Unauthorized' }, 401)

  const eventId = c.req.param('eventId')
  if (!(await canManageVmsEvent(c.env, eventId, member.membership_number))) {
    return c.json({ message: 'Only VMS event managers can disable this kitchen' }, 403)
  }

  const existing = await getEventKitchen(c.env, eventId)
  if (!existing) return c.json({ message: 'Kitchen not found' }, 404)
  const kitchen = await disableEventKitchen(c.env, eventId)
  return c.json({ event_id: eventId, kitchen_enabled: false, kitchen })
})

adminRouter.get('/stats', requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
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
})

adminRouter.get('/admins', async (c) => {
  return c.json({ message: 'Kitchen system admins were removed — use VMS event managers' }, 410)
})

adminRouter.put('/admins/:membership_number/weight', async (c) => {
  return c.json({ message: 'Kitchen system admins were removed' }, 410)
})

adminRouter.post('/staff', async (c) => {
  return c.json({ message: 'Kitchen system admins were removed — use VMS event managers' }, 410)
})

adminRouter.get('/unassigned-individuals', requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
  const individuals = await listUnassignedIndividuals(c.env, eventId)
  return c.json(individuals)
})

adminRouter.post('/program-version', async (c) => {
  const member = c.get('member')
  if (!member || !(await memberManagesAnyEvent(c.env, member.membership_number))) {
    return c.json({ message: 'Only VMS event managers can create program versions' }, 403)
  }
  const body = await c.req.json()
  const version = await createProgramVersion(c.env, body)
  return c.json(version, 201)
})

adminRouter.get('/program-versions', async (c) => {
  const member = c.get('member')
  if (!member || !(await memberManagesAnyEvent(c.env, member.membership_number))) {
    return c.json({ message: 'Only VMS event managers can list program versions' }, 403)
  }
  const versions = await listProgramVersions(c.env)
  return c.json(versions)
})

export default adminRouter
