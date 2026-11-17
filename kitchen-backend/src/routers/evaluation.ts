import { Hono } from 'hono'
import type { AppBindings, Environment } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { canManageVmsEvent } from '../repositories/vms-event-permissions'
import { createEvaluation, listEvaluationsByProject } from '../repositories/evaluations'
import { getProject, listFeaturedProjects } from '../repositories/projects'
import { getTeam } from '../repositories/teams'

const evaluationRouter = new Hono<AppBindings>()

// Public read endpoints
evaluationRouter.get('/featured-projects', async (c) => {
  const projects = await listFeaturedProjects(c.env)
  return c.json(projects)
})

evaluationRouter.get('/top-teams', async (c) => {
  const featured = await listFeaturedProjects(c.env)
  const results = []
  for (const project of featured) {
    const team = await getTeam(c.env, project.team_id)
    const evaluations = await listEvaluationsByProject(c.env, project.id)
    const total = evaluations.reduce((sum, e) => sum + e.score, 0)
    results.push({ project, team, total_score: total })
  }
  results.sort((a, b) => b.total_score - a.total_score)
  return c.json(results)
})

evaluationRouter.get('/project/:project_id', async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const evaluations = await listEvaluationsByProject(c.env, projectId)
  return c.json(evaluations)
})

evaluationRouter.get('/project/:project_id/score', async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const evaluations = await listEvaluationsByProject(c.env, projectId)
  const adminScores = evaluations.filter((e) => !e.is_ai_evaluation)
  const aiScores = evaluations.filter((e) => e.is_ai_evaluation)

  const adminAvg =
    adminScores.length > 0
      ? adminScores.reduce((sum, e) => sum + e.score, 0) / adminScores.length
      : 0
  const aiAvg =
    aiScores.length > 0 ? aiScores.reduce((sum, e) => sum + e.score, 0) / aiScores.length : 0

  return c.json({
    project_id: projectId,
    admin_average: adminAvg,
    ai_average: aiAvg,
    total_score: adminAvg + aiAvg,
    evaluations_count: evaluations.length,
  })
})

async function assertCanEvaluateProject(
  env: Environment,
  projectId: number,
  membershipNumber: string | undefined,
) {
  const project = await getProject(env, projectId)
  if (!project) return { error: 'Project not found' as const, status: 404 as const }
  const team = await getTeam(env, project.team_id)
  if (!team?.event_id) return { error: 'Team/event not found' as const, status: 404 as const }
  if (!(await canManageVmsEvent(env, team.event_id, membershipNumber))) {
    return { error: 'Only VMS event managers can evaluate' as const, status: 403 as const }
  }
  return { project, team }
}

// Authenticated write endpoints — VMS event managers only
evaluationRouter.post('/admin', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const member = c.get('member')
  const projectId = Number(body.project_id)
  const gate = await assertCanEvaluateProject(c.env, projectId, member?.membership_number)
  if ('error' in gate) return c.json({ message: gate.error }, gate.status)

  const evaluation = await createEvaluation(c.env, {
    ...body,
    evaluator_membership_number: member!.membership_number,
    admin_id: null,
    is_ai_evaluation: false,
  })
  return c.json(evaluation, 201)
})

evaluationRouter.post('/ai', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const member = c.get('member')
  const projectId = Number(body.project_id)
  const gate = await assertCanEvaluateProject(c.env, projectId, member?.membership_number)
  if ('error' in gate) return c.json({ message: gate.error }, gate.status)

  const evaluation = await createEvaluation(c.env, {
    ...body,
    is_ai_evaluation: true,
    admin_id: null,
    evaluator_membership_number: null,
  })
  return c.json(evaluation, 201)
})

export default evaluationRouter
