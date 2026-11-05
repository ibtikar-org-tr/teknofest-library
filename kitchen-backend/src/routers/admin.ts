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
  const body = await c.req.json<{ username: string; password: string }>()
  const admin = await getAdminByUsername(c.env, body.username)
  if (!admin || admin.hashed_password !== `sha256:${body.password}`) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  const { hashed_password: _, ...safeAdmin } = admin
  return c.json({
    access_token: `dev-token:${admin.id}`,
    token_type: 'bearer',
    admin: safeAdmin,
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
