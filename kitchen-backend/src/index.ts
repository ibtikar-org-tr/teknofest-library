import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppBindings } from './types/env'
import studentsRouter from './routers/students'
import projectsRouter from './routers/projects'
import adminRouter from './routers/admin'
import evaluationRouter from './routers/evaluation'
import emailRouter from './routers/email'
import authRouter from './routers/auth'
import kitchensRouter from './routers/kitchens'
import { memberAuthMiddleware } from './middleware/staff-auth'
import { memberManagesAnyEvent } from './repositories/vms-event-permissions'

const app = new Hono<AppBindings>()
const MS_BASE = '/ms/kitchen'

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

app.get('/', (c) => c.redirect(MS_BASE))

app.get(MS_BASE, (c) =>
  c.json({
    message: 'مرحباً بك في منصة مسابقات تكنوفيست! 🏆',
    version: '2.2.0',
    runtime: 'Cloudflare Workers + Hono + D1',
    endpoints: {
      health: `GET ${MS_BASE}/health`,
      auth: `${MS_BASE}/api/auth`,
      kitchens: `${MS_BASE}/api/kitchens`,
      students: `${MS_BASE}/api/students`,
      projects: `${MS_BASE}/api/projects`,
      admin: `${MS_BASE}/api/admin`,
      evaluation: `${MS_BASE}/api/evaluation`,
      email: `${MS_BASE}/api/email`,
    },
  }),
)

app.get(`${MS_BASE}/health`, (c) =>
  c.json({ status: 'healthy', message: 'التطبيق يعمل بشكل سليم', app: c.env.APP_NAME }),
)

app.route(`${MS_BASE}/api/auth`, authRouter)
app.route(`${MS_BASE}/api/kitchens`, kitchensRouter)
app.route(`${MS_BASE}/api/students`, studentsRouter)
app.route(`${MS_BASE}/api/projects`, projectsRouter)
app.route(`${MS_BASE}/api/admin`, adminRouter)
app.route(`${MS_BASE}/api/evaluation`, evaluationRouter)

// Protect email mutations — any VMS event manager
const securedEmail = new Hono<AppBindings>()
securedEmail.use('*', memberAuthMiddleware)
securedEmail.use('*', async (c, next) => {
  const member = c.get('member')
  if (!member || !(await memberManagesAnyEvent(c.env, member.membership_number))) {
    return c.json({ message: 'Only VMS event managers can send kitchen emails' }, 403)
  }
  await next()
})
securedEmail.route('/', emailRouter)
app.route(`${MS_BASE}/api/email`, securedEmail)

app.notFound((c) => c.json({ message: 'Not found' }, 404))

export default app
