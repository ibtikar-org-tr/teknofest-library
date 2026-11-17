import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { memberManagesAnyEvent } from '../repositories/vms-event-permissions'

const authRouter = new Hono<AppBindings>()

interface VmsExchangeResponse {
  membershipNumber: string
  email: string
  role: string
  accessToken: string
}

authRouter.post('/vms/exchange', async (c) => {
  const body = await c.req.json<{ code?: string }>().catch(() => ({} as { code?: string }))
  const code = body.code?.trim()
  if (!code) {
    return c.json({ message: 'code is required' }, 400)
  }

  const apiBase = c.env.VMS_API_BASE?.trim().replace(/\/+$/, '')
  const internalSecret = c.env.VMS_INTERNAL_SECRET?.trim()
  if (!apiBase || !internalSecret) {
    console.error('VMS_API_BASE / VMS_INTERNAL_SECRET not configured')
    return c.json({ message: 'VMS exchange not configured' }, 500)
  }

  const exchangeUrl = `${apiBase}/external-exchange`
  let exchangePayload: VmsExchangeResponse
  try {
    const response = await fetch(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': internalSecret,
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('VMS external-exchange failed', response.status, text)
      return c.json({ message: 'Invalid or expired code' }, 401)
    }

    exchangePayload = (await response.json()) as VmsExchangeResponse
  } catch (error) {
    console.error('VMS external-exchange request failed', error)
    return c.json({ message: 'Could not reach VMS' }, 502)
  }

  const canManageKitchens = await memberManagesAnyEvent(
    c.env,
    exchangePayload.membershipNumber,
  )

  return c.json({
    access_token: exchangePayload.accessToken,
    token_type: 'bearer',
    /** True when the member can manage at least one VMS event (enable kitchens / admin that event). */
    is_staff: canManageKitchens,
    is_event_manager: canManageKitchens,
    is_superadmin: false,
    admin: null,
    user: {
      membershipNumber: exchangePayload.membershipNumber,
      email: exchangePayload.email,
      role: exchangePayload.role,
    },
  })
})

authRouter.get('/me', memberAuthMiddleware, async (c) => {
  const member = c.get('member')
  const canManageKitchens = await memberManagesAnyEvent(c.env, member.membership_number)
  return c.json({
    user: {
      membershipNumber: member.membership_number,
      email: member.email,
      role: member.vms_role,
    },
    is_staff: canManageKitchens,
    is_event_manager: canManageKitchens,
    is_superadmin: false,
    admin: null,
  })
})

export default authRouter
