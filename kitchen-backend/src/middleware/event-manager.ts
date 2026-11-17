import type { MiddlewareHandler } from 'hono'
import { canManageVmsEvent } from '../repositories/vms-event-permissions'
import type { AppBindings } from '../types/env'

function resolveEventId(c: Parameters<MiddlewareHandler<AppBindings>>[0]): string | null {
  return (
    c.req.param('eventId')?.trim() ||
    c.req.query('event_id')?.trim() ||
    null
  )
}

/** Requires member auth already run; caller must manage the VMS event. */
export const requireEventManager: MiddlewareHandler<AppBindings> = async (c, next) => {
  const member = c.get('member')
  if (!member?.membership_number) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const eventId = resolveEventId(c)
  if (!eventId) {
    return c.json({ message: 'event_id is required' }, 400)
  }

  const allowed = await canManageVmsEvent(c.env, eventId, member.membership_number)
  if (!allowed) {
    return c.json({ message: 'Only VMS event managers can perform this action' }, 403)
  }

  await next()
}
