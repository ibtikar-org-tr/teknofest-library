import type { Environment } from '../types/env'

const VMS_API_PREFIX = '/ms/membership-app/api'

export async function fetchVmsApi(
  env: Environment,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const service = env.VMS_SERVICE

  if (service) {
    return service.fetch(
      `https://vms.internal${VMS_API_PREFIX}${normalizedPath}`,
      init,
    )
  }

  const apiBase = env.VMS_API_BASE?.trim().replace(/\/+$/, '')
  if (!apiBase) {
    throw new Error('VMS_API_BASE is not configured and VMS_SERVICE is missing')
  }

  return fetch(`${apiBase}${normalizedPath}`, init)
}
