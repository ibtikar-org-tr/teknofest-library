import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppBindings } from './types/env'
import competitionRouters from './routers/competition'
import teamsRouter from './routers/teams'
import membersRouter from './routers/members'
import resourcesRouter from './routers/resources'
import reportFilesRouter from './routers/report_files'
import resultFilesRouter from './routers/result_files'

const app = new Hono<AppBindings>();

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health Check
app.get('/', (c) => c.text('Hello Hono! App is running and healthy.'))

// Routers
app.route('/api/competitions', competitionRouters)
app.route('/api/teams', teamsRouter)
app.route('/api/members', membersRouter)
app.route('/api/resources', resourcesRouter)
app.route('/api/report-files', reportFilesRouter)
app.route('/api/result-files', resultFilesRouter)

export default app
