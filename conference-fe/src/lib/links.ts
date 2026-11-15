const WHATSAPP_NUMBER = '905057371422'

const DEFAULT_VMS_LOGIN = 'https://vms.ibtikar.tr/login'
const DEFAULT_KITCHEN_ORIGIN = 'https://kitchen.ibtikar.tr'

function trimOrigin(value: string | undefined, fallback: string): string {
  const raw = value?.trim() || fallback
  return raw.replace(/\/+$/, '')
}

export function getVmsLoginUrl(): string {
  return trimOrigin(import.meta.env.VITE_VMS_LOGIN_URL as string | undefined, DEFAULT_VMS_LOGIN)
}

export function getKitchenOrigin(): string {
  return trimOrigin(import.meta.env.VITE_KITCHEN_URL as string | undefined, DEFAULT_KITCHEN_ORIGIN)
}

/** VMS login that returns to Kitchen admin after SSO handoff. */
export function buildKitchenVmsSsoUrl(): string {
  const callback = `${getKitchenOrigin()}/auth/callback`
  const login = new URL(getVmsLoginUrl())
  login.searchParams.set('client', 'kitchen')
  login.searchParams.set('redirect_uri', callback)
  return login.toString()
}

export const LINKS = {
  /** Main conference registration */
  register: 'https://vms.ibtikar.tr/event/fe877eb3-25a9-4e28-9e7e-382ab8a963e3',
  /** Student teams and startups */
  registerStudentStartups:
    'https://vms.ibtikar.tr/event/98c0bf0a-9c94-4f60-a612-ab740c1350c7',
  /** TEKNOFEST teams */
  registerTeknofestTeams:
    'https://vms.ibtikar.tr/event/f29792df-d479-4417-8fbf-11bbd317dfd6',
  /** Kitchen public site */
  kitchen: getKitchenOrigin(),
  telegramChannel: 'https://t.me/ibtikar_org',
  telegramContact: 'https://t.me/ibtikar_org_tr',
  bylaws: 'https://github.com/ibtikar-org-tr/bylaws',
  github: 'https://github.com/ibtikar-org-tr',
  instagram: 'https://www.instagram.com/ibtikar.org.tr',
  linkedin: 'https://www.linkedin.com/company/ibtikar-org-tr',
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
  email: 'mailto:relations@ibtikar.org.tr',
  lms: 'https://lms.ibtikar.org.tr',
  assembly: 'https://ibtikar.tr',
  saae: 'https://aisyria.org/',
} as const
