import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { memberAuthMiddleware, staffAuthMiddleware } from '../middleware/staff-auth'
import {
  createProject,
  getProject,
  listProjects,
  listProjectsByTeam,
} from '../repositories/projects'
import { findTeamForMemberInEvent, isMemberOfTeam } from '../repositories/member-teams'
import { getTeam } from '../repositories/teams'

const projectsRouter = new Hono<AppBindings>()

projectsRouter.post('/submit', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  if (!body.event_id) return c.json({ message: 'event_id is required' }, 400)
  const member = c.get('member')
  if (!member) return c.json({ message: 'Authenticated member required' }, 401)

  let team = await findTeamForMemberInEvent(
    c.env,
    body.event_id,
    member.membership_number,
    member.email,
  )
  if (!team) {
    return c.json(
      { message: 'Only teams can submit projects. Join or create a team first.' },
      403,
    )
  }

  const requestedTeamId = Number(body.team_id)
  if (Number.isFinite(requestedTeamId) && requestedTeamId > 0 && requestedTeamId !== team.id) {
    const onRequested = await isMemberOfTeam(
      c.env,
      requestedTeamId,
      member.membership_number,
      member.email,
    )
    if (!onRequested) {
      return c.json({ message: 'You can only submit a project for your own team' }, 403)
    }
    const requested = await getTeam(c.env, requestedTeamId)
    if (!requested || requested.event_id !== body.event_id) {
      return c.json({ message: 'Team not found in this event kitchen' }, 404)
    }
    team = requested
  }

  const project = await createProject(c.env, {
    ...body,
    team_id: team.id,
    program_version_id: Number(body.program_version_id) || 1,
  })
  return c.json(project, 201)
})

projectsRouter.get('/', staffAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  return c.json(await listProjects(c.env, eventId))
})

projectsRouter.get('/stats/summary', staffAuthMiddleware, async (c) => {
  const eventId = c.req.query('event_id')
  if (!eventId) return c.json({ message: 'event_id query is required' }, 400)
  const projects = await listProjects(c.env, eventId)
  return c.json({
    total: projects.length,
    complete: projects.filter((p) => p.is_complete).length,
    featured: projects.filter((p) => p.is_featured).length,
    with_attachments: projects.filter((p) => p.has_attachments).length,
  })
})

projectsRouter.get('/team/:team_id', staffAuthMiddleware, async (c) => {
  const teamId = Number(c.req.param('team_id'))
  const projects = await listProjectsByTeam(c.env, teamId)
  return c.json(projects)
})

projectsRouter.get('/:project_id', staffAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const team = await getTeam(c.env, project.team_id)
  return c.json({ ...project, team })
})

export default projectsRouter
