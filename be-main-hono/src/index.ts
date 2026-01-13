import { Hono } from 'hono'
import type { AppBindings } from './types/env'
import competitionRouters from './routers/competition'
import teamsRouter from './routers/teams'
import membersRouter from './routers/members'
import resourcesRouter from './routers/resources'
import reportFilesRouter from './routers/report_files'
import resultFilesRouter from './routers/result_files'

const app = new Hono<AppBindings>();

app.get('/', (c) => c.text('Hello Hono! App is running and healthy.'))

app.route('/api/competitions', competitionRouters)
app.route('/api/teams', teamsRouter)
app.route('/api/members', membersRouter)
app.route('/api/resources', resourcesRouter)
app.route('/api/report-files', reportFilesRouter)
app.route('/api/result-files', resultFilesRouter)

export default app
