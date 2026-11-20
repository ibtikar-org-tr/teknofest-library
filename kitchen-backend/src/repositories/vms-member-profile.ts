import type { Environment } from '../types/env'
import { fetchVmsApi } from '../utils/vms-fetch'

export type VmsMemberProfile = {
  membership_number: string
  email: string
  full_name: string
  phone: string
  gender: 'male' | 'female'
  /** Comma-separated skill names from VMS user_skills */
  technical_skills: string
  /** Comma-separated interest names from VMS user_skills */
  interests: string
}

type VmsProfileJson = {
  profile?: {
    membershipNumber?: string
    email?: string
    arName?: string | null
    enName?: string | null
    phoneNumber?: string | null
    sex?: string | null
    skills?: string | null
    interests?: string | null
  }
}

/** Load identity fields from VMS using the caller's Bearer token (same SSO session). */
export async function fetchVmsMemberProfile(
  env: Environment,
  membershipNumber: string,
  authorizationHeader: string | undefined,
): Promise<VmsMemberProfile | null> {
  if (!env.VMS_API_BASE?.trim() || !authorizationHeader?.startsWith('Bearer ')) {
    return null
  }

  try {
    const response = await fetchVmsApi(env, `/profile/${encodeURIComponent(membershipNumber)}`, {
      method: 'GET',
      headers: {
        Authorization: authorizationHeader,
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      console.error('VMS profile fetch failed', response.status, await response.text().catch(() => ''))
      return null
    }

    const data = (await response.json()) as VmsProfileJson
    const profile = data.profile
    if (!profile) return null

    const fullName =
      profile.arName?.trim() || profile.enName?.trim() || membershipNumber
    const phone = profile.phoneNumber?.trim() || ''
    const sex = profile.sex === 'female' ? 'female' : 'male'

    return {
      membership_number: profile.membershipNumber?.trim() || membershipNumber,
      email: profile.email?.trim() || '',
      full_name: fullName,
      phone: phone || 'n/a',
      gender: sex,
      technical_skills: profile.skills?.trim() || '',
      interests: profile.interests?.trim() || '',
    }
  } catch (error) {
    console.error('VMS profile request failed', error)
    return null
  }
}
