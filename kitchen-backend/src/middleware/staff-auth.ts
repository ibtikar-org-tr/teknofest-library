import type { MiddlewareHandler } from 'hono'
import type { AppBindings } from '../types/env'
import { getStaffByMembershipNumber } from '../repositories/staff'
import { verifyVmsAccessToken } from '../utils/vms-jwt'

async function authenticateMember(c: Parameters<MiddlewareHandler<AppBindings>>[0]) {
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

  c.set('member', {
    membership_number: payload.sub,
    email: payload.email,
    vms_role: payload.role,
  })

  const staff = await getStaffByMembershipNumber(c.env, payload.sub)
  if (staff?.is_active) {
    c.set('staff', {
      ...staff,
      vms_role: payload.role,
    })
  }

  return null
}

/** Any valid VMS member JWT. */
export const memberAuthMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const failure = await authenticateMember(c)
  if (failure) return failure
  await next()
}

/** Kitchen staff allowlist (admins / evaluators). */
export const staffAuthMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const failure = await authenticateMember(c)
  if (failure) return failure

  if (!c.get('staff')) {
    return c.json({ message: 'Not authorized for kitchen admin' }, 403)
  }

  await next()
}

export const requireSuperAdmin: MiddlewareHandler<AppBindings> = async (c, next) => {
  const staff = c.get('staff')
  if (!staff?.is_superadmin) {
    return c.json({ message: 'Super admin required' }, 403)
  }
  await next()
}
