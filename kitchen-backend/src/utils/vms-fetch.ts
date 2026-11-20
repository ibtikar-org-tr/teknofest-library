import type { Environment } from '../types/env'

/** Call the membership-app API over HTTP (`VMS_API_BASE`). */
export async function fetchVmsApi(
  env: Environment,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const apiBase = env.VMS_API_BASE?.trim().replace(/\/+$/, '')
  if (!apiBase) {
    throw new Error('VMS_API_BASE is not configured')
  }

  return fetch(`${apiBase}${normalizedPath}`, init)
}
