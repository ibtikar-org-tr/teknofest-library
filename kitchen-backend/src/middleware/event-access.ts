import type { MiddlewareHandler } from 'hono'
import { getEventKitchen } from '../repositories/event-kitchens'
import { isMemberRegisteredForEvent } from '../repositories/vms-events'
import type { AppBindings } from '../types/env'

/** Requires member auth already run; checks kitchen exists + registration (staff bypass). */
export const requireEventKitchenAccess: MiddlewareHandler<AppBindings> = async (c, next) => {
  const eventId = c.req.param('eventId')
  if (!eventId) {
    return c.json({ message: 'eventId required' }, 400)
  }

  const kitchen = await getEventKitchen(c.env, eventId)
  if (!kitchen?.enabled) {
    return c.json({ message: 'Kitchen not available for this event' }, 404)
  }

  const staff = c.get('staff')
  if (staff) {
    await next()
    return
  }

  const member = c.get('member')
  if (!member) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const registered = await isMemberRegisteredForEvent(
    c.env,
    eventId,
    member.membership_number,
  )
  if (!registered) {
    return c.json(
      { message: 'You must be registered for this VMS event to enter its kitchen' },
      403,
    )
  }

  await next()
}
