import type { MiddlewareHandler } from 'hono'
import type { AppBindings } from '../types/env'
import { getStaffByMembershipNumber } from '../repositories/staff'
import { verifyVmsAccessToken } from '../utils/vms-jwt'

export const staffAuthMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const secret = c.env.JWT_SECRET?.trim()
  if (!secret) {
    console.error('JWT_SECRET is not configured on kitchen-backend')
    return c.json({ message: 'Auth not configured' }, 500)
  }

  const payload = await verifyVmsAccessToken(secret, token)
  if (!payload) {
    return c.json({ message: 'Unauthorized' }, 401)
  }

  const staff = await getStaffByMembershipNumber(c.env, payload.sub)
  if (!staff || !staff.is_active) {
    return c.json({ message: 'Not authorized for kitchen admin' }, 403)
  }

  c.set('staff', {
    ...staff,
    vms_role: payload.role,
  })

  await next()
}

export const requireSuperAdmin: MiddlewareHandler<AppBindings> = async (c, next) => {
  const staff = c.get('staff')
  if (!staff?.is_superadmin) {
    return c.json({ message: 'Super admin required' }, 403)
  }
  await next()
}
