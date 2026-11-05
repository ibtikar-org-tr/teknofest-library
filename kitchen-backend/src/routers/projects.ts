import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import {
  createProject,
  getProject,
  listProjects,
  listProjectsByTeam,
} from '../repositories/projects'
import { getTeam } from '../repositories/teams'

const projectsRouter = new Hono<AppBindings>()

projectsRouter.post('/submit', async (c) => {
  const body = await c.req.json()
  const project = await createProject(c.env, body)
  return c.json(project, 201)
})

projectsRouter.get('/', async (c) => {
  const projects = await listProjects(c.env)
  return c.json(projects)
})

projectsRouter.get('/stats/summary', async (c) => {
  const projects = await listProjects(c.env)
  return c.json({
    total: projects.length,
    complete: projects.filter((p) => p.is_complete).length,
    featured: projects.filter((p) => p.is_featured).length,
    with_attachments: projects.filter((p) => p.has_attachments).length,
  })
})

projectsRouter.get('/team/:team_id', async (c) => {
  const teamId = Number(c.req.param('team_id'))
  const projects = await listProjectsByTeam(c.env, teamId)
  return c.json(projects)
})

projectsRouter.get('/:project_id', async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const team = await getTeam(c.env, project.team_id)
  return c.json({ ...project, team })
})

export default projectsRouter
