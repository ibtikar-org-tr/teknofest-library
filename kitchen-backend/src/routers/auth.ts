import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { memberManagesAnyEvent } from '../repositories/vms-event-permissions'
import { fetchVmsApi } from '../utils/vms-fetch'

const authRouter = new Hono<AppBindings>()

interface VmsExchangeResponse {
  membershipNumber: string
  email: string
  role: string
  accessToken: string
}

authRouter.post('/vms/exchange', async (c) => {
  const body = await c
    .req
    .json<{ code?: string; redirectUri?: string }>()
    .catch(() => ({} as { code?: string; redirectUri?: string }))
  const code = body.code?.trim()
  const redirectUri = body.redirectUri?.trim()
  if (!code) {
    return c.json({ message: 'code is required' }, 400)
  }
  if (!redirectUri) {
    return c.json({ message: 'redirectUri is required' }, 400)
  }

  if (!c.env.VMS_API_BASE?.trim()) {
    console.error('VMS_API_BASE not configured')
    return c.json({ message: 'VMS exchange not configured' }, 500)
  }

  let exchangePayload: VmsExchangeResponse
  try {
    const response = await fetchVmsApi(c.env, '/external-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri, client: 'kitchen' }),
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
