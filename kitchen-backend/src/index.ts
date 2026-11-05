import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppBindings } from './types/env'
import studentsRouter from './routers/students'
import projectsRouter from './routers/projects'
import adminRouter from './routers/admin'
import evaluationRouter from './routers/evaluation'
import emailRouter from './routers/email'

const app = new Hono<AppBindings>()

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.get('/', (c) =>
  c.json({
    message: 'مرحباً بك في منصة مسابقات تكنوفيست! 🏆',
    version: '2.0.0',
    runtime: 'Cloudflare Workers + Hono + D1',
    endpoints: {
      students: '/api/students',
      projects: '/api/projects',
      admin: '/api/admin',
      evaluation: '/api/evaluation',
      email: '/api/email',
    },
  })
)

app.get('/health', (c) =>
  c.json({ status: 'healthy', message: 'التطبيق يعمل بشكل سليم', app: c.env.APP_NAME })
)

app.route('/api/students', studentsRouter)
app.route('/api/projects', projectsRouter)
app.route('/api/admin', adminRouter)
app.route('/api/evaluation', evaluationRouter)
app.route('/api/email', emailRouter)

export default app
