export interface Environment {
  D1_DB: D1Database
  /** Shared Cloudflare D1: VMS events + registrations (read-only from Kitchen) */
  VMS_DB: D1Database
  /** Worker-to-worker binding to teknofest-library-be-main (preferred in Cloudflare). */
  LIBRARY?: Fetcher
  APP_NAME: string
  /** Shared with VMS — used to verify VMS access JWTs */
  JWT_SECRET?: string
  /** Base URL for VMS membership API, e.g. https://host/ms/membership-app/api */
  VMS_API_BASE?: string
  /** Same as VMS INTERNAL_SECRET — used for /external-exchange */
  VMS_INTERNAL_SECRET?: string
  /** Local/dev fallback when LIBRARY binding is unavailable, e.g. http://localhost:9671 */
  LIBRARY_API_BASE?: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  DEEPSEEK_API_KEY?: string
  SECRET_KEY?: string
  ADMIN_REGISTRATION_CODE?: string
  SUPER_ADMIN_USERNAME?: string
  SUPER_ADMIN_PASSWORD?: string
}

export type KitchenMember = {
  membership_number: string
  email: string
  vms_role: string
}

export type KitchenStaffSession = {
  membership_number: string
  email: string
  full_name: string | null
  evaluation_weight: number
  is_active: boolean
  is_superadmin: boolean
  created_at: string
  vms_role: string
}

export type KitchenVariables = {
  member: KitchenMember
  staff?: KitchenStaffSession
}

export type AppBindings = {
  Bindings: Environment
  Variables: KitchenVariables
}
