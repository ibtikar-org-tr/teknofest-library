import { Hono } from 'hono'
import type { AppBindings } from '../types/env'
import { staffAuthMiddleware } from '../middleware/staff-auth'
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

// Authenticated write endpoints
evaluationRouter.post('/admin', staffAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const staff = c.get('staff')
  const evaluation = await createEvaluation(c.env, {
    ...body,
    evaluator_membership_number: staff.membership_number,
    admin_id: null,
    is_ai_evaluation: false,
  })
  return c.json(evaluation, 201)
})

evaluationRouter.post('/ai', staffAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const evaluation = await createEvaluation(c.env, {
    ...body,
    is_ai_evaluation: true,
    admin_id: null,
    evaluator_membership_number: null,
  })
  return c.json(evaluation, 201)
})

export default evaluationRouter
