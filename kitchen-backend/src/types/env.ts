export interface Environment {
  D1_DB: D1Database
  VMS_DB: D1Database
  LIBRARY?: Fetcher
  VMS_SERVICE?: Fetcher
  APP_NAME: string
  VMS_API_BASE?: string
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
