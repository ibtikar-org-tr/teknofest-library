export interface Environment {
  D1_DB: D1Database
  APP_NAME: string
  SECRET_KEY?: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  DEEPSEEK_API_KEY?: string
  ADMIN_REGISTRATION_CODE?: string
  SUPER_ADMIN_USERNAME?: string
  SUPER_ADMIN_PASSWORD?: string
}

export type AppBindings = {
  Bindings: Environment
}
