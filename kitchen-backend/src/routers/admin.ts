import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import {
  createAdmin,
  createProgramVersion,
  getAdminByUsername,
  listAdmins,
  listProgramVersions,
} from '../repositories/admins'
import { listUnassignedIndividuals } from '../repositories/individuals'

const adminRouter = new Hono<AppBindings>()

adminRouter.post('/register', async (c) => {
  const body = await c.req.json<{
    username: string
    email: string
    password: string
    full_name?: string
    registration_code?: string
  }>()

  const expectedCode = c.env.ADMIN_REGISTRATION_CODE
  if (expectedCode && body.registration_code !== expectedCode) {
    return c.json({ message: 'Invalid registration code' }, 403)
  }

  // Placeholder hash until auth service is ported (Web Crypto / bcrypt wasm)
  const hashed_password = `sha256:${body.password}`
  const admin = await createAdmin(c.env, {
    username: body.username,
    email: body.email,
    hashed_password,
    full_name: body.full_name,
  })
  return c.json(admin, 201)
})

adminRouter.post('/login', async (c) => {
  // Frontend uses OAuth2 form-urlencoded; also accept JSON for tooling
  const contentType = c.req.header('content-type') || ''
  let username = ''
  let password = ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await c.req.parseBody()
    username = String(form.username ?? '')
    password = String(form.password ?? '')
  } else {
    const body = await c.req.json<{ username: string; password: string }>()
    username = body.username
    password = body.password
  }

  const admin = await getAdminByUsername(c.env, username)
  if (!admin || admin.hashed_password !== `sha256:${password}`) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  const { hashed_password: _, ...safeAdmin } = admin
  return c.json({
    access_token: `dev-token:${admin.id}`,
    token_type: 'bearer',
    admin: safeAdmin,
  })
})
adminRouter.get('/me', async (c) => {
  const auth = c.req.header('Authorization') || ''
  const match = auth.match(/^Bearer\s+dev-token:(\d+)$/i)
  if (!match) return c.json({ message: 'Unauthorized' }, 401)

  const admins = await listAdmins(c.env)
  const admin = admins.find((a) => a.id === Number(match[1]))
  if (!admin) return c.json({ message: 'Unauthorized' }, 401)
  return c.json(admin)
})

adminRouter.get('/is-super-admin', async (c) => {
  const auth = c.req.header('Authorization') || ''
  const match = auth.match(/^Bearer\s+dev-token:(\d+)$/i)
  if (!match) return c.json({ is_super_admin: false })

  const admins = await listAdmins(c.env)
  const admin = admins.find((a) => a.id === Number(match[1]))
  return c.json({ is_super_admin: Boolean(admin?.is_superadmin) })
})

adminRouter.get('/stats', async (c) => {
  const [teams, individuals, projects, admins] = await Promise.all([
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM teams').first<{ count: number }>(),
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM individuals').first<{ count: number }>(),
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM project_submissions').first<{ count: number }>(),
    c.env.D1_DB.prepare('SELECT COUNT(*) as count FROM admins').first<{ count: number }>(),
  ])
  return c.json({
    teams: Number(teams?.count ?? 0),
    individuals: Number(individuals?.count ?? 0),
    projects: Number(projects?.count ?? 0),
    admins: Number(admins?.count ?? 0),
  })
})

adminRouter.get('/admins', async (c) => {
  const admins = await listAdmins(c.env)
  return c.json(admins)
})

adminRouter.get('/unassigned-individuals', async (c) => {
  const individuals = await listUnassignedIndividuals(c.env)
  return c.json(individuals)
})

adminRouter.post('/program-version', async (c) => {
  const body = await c.req.json()
  const version = await createProgramVersion(c.env, body)
  return c.json(version, 201)
})

adminRouter.get('/program-versions', async (c) => {
  const versions = await listProgramVersions(c.env)
  return c.json(versions)
})

export default adminRouter
