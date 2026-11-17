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

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

app.get('/', (c) =>
  c.json({
    message: 'مرحباً بك في منصة مسابقات تكنوفيست! 🏆',
    version: '2.2.0',
    runtime: 'Cloudflare Workers + Hono + D1',
    endpoints: {
      auth: '/api/auth',
      kitchens: '/api/kitchens',
      students: '/api/students',
      projects: '/api/projects',
      admin: '/api/admin',
      evaluation: '/api/evaluation',
      email: '/api/email',
    },
  }),
)

app.get('/health', (c) =>
  c.json({ status: 'healthy', message: 'التطبيق يعمل بشكل سليم', app: c.env.APP_NAME }),
)

app.route('/api/auth', authRouter)
app.route('/api/kitchens', kitchensRouter)
app.route('/api/students', studentsRouter)
app.route('/api/projects', projectsRouter)
app.route('/api/admin', adminRouter)
app.route('/api/evaluation', evaluationRouter)

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
app.route('/api/email', securedEmail)

export default app
