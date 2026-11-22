import type { Environment } from '../types/env'
import { fetchVmsApi } from './vms-fetch'

export type TelegramNotifyResult = {
  success: boolean
  status: number
  error?: string
  responseData?: unknown
}

/**
 * Deliver a bot DM via VMS membership-app (`POST /telegram/notify`).
 * VMS already holds TELEGRAM_MS_SERVICE + INTERNAL_SECRET (same repo as telegram-ms).
 * Kitchen only forwards the caller's VMS Bearer — no shared secret with telegram-ms.
 */
export async function notifyMemberViaVms(
  env: Environment,
  opts: {
    authorizationHeader: string
    membership_number: string
    message: string
    boxes?: Array<{ text: string; link: string }>
  },
): Promise<TelegramNotifyResult> {
  const auth = opts.authorizationHeader?.trim()
  if (!auth?.startsWith('Bearer ')) {
    return { success: false, status: 401, error: 'Missing VMS bearer token' }
  }

  try {
    const response = await fetchVmsApi(env, '/telegram/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        target: opts.membership_number.trim(),
        message: opts.message,
        boxes: opts.boxes,
      }),
    })

    const responseText = await response.text().catch(() => '')
    let responseData: unknown = null
    if (responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }
    }

    if (!response.ok) {
      const payload =
        responseData && typeof responseData === 'object'
          ? (responseData as Record<string, unknown>)
          : null
      const bodyError =
        typeof payload?.error === 'string' && payload.error.trim()
          ? payload.error.trim()
          : null

      return {
        success: false,
        status: response.status,
        error: bodyError || 'Failed to deliver Telegram message via VMS',
        responseData,
      }
    }

    return {
      success: true,
      status: response.status,
      responseData,
    }
  } catch (error) {
    console.error('VMS telegram notify failed', error)
    return {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : 'VMS telegram notify request failed',
    }
  }
}

export function buildJuryManagerMessage(opts: {
  managerUsername: string | null
  managerMembership: string | null
  juryUsername: string | null
  extra?: string | null
}): string {
  const lines = ['مرحباً، أتواصل معك بخصوص تحكيم مسابقة المطبخ.']
  if (opts.managerUsername) {
    lines.push(`حسابي على تلغرام: @${opts.managerUsername.replace(/^@+/, '')}`)
  }
  if (opts.managerMembership) {
    lines.push(`رقم عضويتي: ${opts.managerMembership}`)
  }
  if (opts.juryUsername) {
    lines.push(`حسابك على تلغرام (إن وجد): @${opts.juryUsername.replace(/^@+/, '')}`)
  }
  const extra = opts.extra?.trim()
  if (extra) {
    lines.push('')
    lines.push(extra)
  }
  lines.push('يرجى الرد عند التمكّن.')
  return lines.join('\n')
}
