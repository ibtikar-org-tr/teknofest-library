import { Hono } from 'hono'
import type { AppBindings, Environment } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { canManageVmsEvent } from '../repositories/vms-event-permissions'
import {
  averageJuryScores,
  createEvaluation,
  findJuryEvaluation,
  listEvaluationsByProject,
  upsertJuryEvaluation,
  weightedOverallScore,
} from '../repositories/evaluations'
import { canEvaluateTeam, listJuryMembershipNumbers } from '../repositories/juries'
import { getProject, listProjectsByTeam } from '../repositories/projects'
import { getTeam } from '../repositories/teams'

async function stageAveragesForTeam(
  env: Environment,
  teamId: number,
  jurySet: Set<string>,
) {
  const projects = await listProjectsByTeam(env, teamId)
  let primary_average: number | null = null
  let final_average: number | null = null
  for (const p of projects) {
    const evals = await listEvaluationsByProject(env, p.id)
    const { jury_average } = averageJuryScores(evals, jurySet)
    if (p.stage === 'primary') primary_average = jury_average
    if (p.stage === 'final') final_average = jury_average
  }
  return {
    primary_average,
    final_average,
    overall_score: weightedOverallScore(primary_average, final_average),
  }
}

const evaluationRouter = new Hono<AppBindings>()

evaluationRouter.get('/project/:project_id', async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const evaluations = await listEvaluationsByProject(c.env, projectId)
  return c.json(evaluations)
})

evaluationRouter.get('/project/:project_id/score', async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const team = await getTeam(c.env, project.team_id)
  const evaluations = await listEvaluationsByProject(c.env, projectId)
  const jurySet = team?.event_id
    ? await listJuryMembershipNumbers(c.env, team.event_id)
    : new Set<string>()
  const { jury_average, jury_count } = averageJuryScores(evaluations, jurySet)
  const aiScores = evaluations.filter((e) => e.is_ai_evaluation)
  const aiAvg =
    aiScores.length > 0 ? aiScores.reduce((sum, e) => sum + e.score, 0) / aiScores.length : null

  const teamScores = team
    ? await stageAveragesForTeam(c.env, project.team_id, jurySet)
    : { primary_average: null, final_average: null, overall_score: null }

  return c.json({
    project_id: projectId,
    stage: project.stage,
    jury_average,
    jury_count,
    stage_score: jury_average,
    primary_average: teamScores.primary_average,
    final_average: teamScores.final_average,
    overall_score: teamScores.overall_score,
    /** Stage average; use overall_score for 40/60 team total */
    final_score: jury_average,
    ai_average: aiAvg,
    /** @deprecated use stage_score / jury_average */
    admin_average: jury_average ?? 0,
    total_score: teamScores.overall_score ?? jury_average,
    evaluations_count: evaluations.length,
  })
})

evaluationRouter.get('/project/:project_id/details', memberAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const member = c.get('member')
  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const team = await getTeam(c.env, project.team_id)
  if (!team?.event_id) return c.json({ message: 'Team/event not found' }, 404)

  const canManage = await canManageVmsEvent(c.env, team.event_id, member?.membership_number)
  const canScore = await canEvaluateTeam(
    c.env,
    team.event_id,
    member?.membership_number,
    project.team_id,
  )
  if (!canManage && !canScore) {
    return c.json({ message: 'Not allowed to view evaluations for this project' }, 403)
  }

  const evaluations = await listEvaluationsByProject(c.env, projectId)
  const jurySet = await listJuryMembershipNumbers(c.env, team.event_id)
  const { jury_average, jury_count } = averageJuryScores(evaluations, jurySet)

  const membership = member?.membership_number?.trim()
  const current = membership
    ? evaluations.find(
        (e) =>
          !e.is_ai_evaluation && e.evaluator_membership_number?.trim() === membership,
      )
    : undefined

  const mapped = evaluations.map((e) => ({
    id: e.id,
    project_id: e.project_id,
    score: e.score,
    notes: e.notes ?? undefined,
    detailed_scores: e.detailed_scores ?? undefined,
    is_ai_evaluation: e.is_ai_evaluation,
    created_at: e.created_at,
    evaluator_membership_number: e.evaluator_membership_number,
    is_current_admin: Boolean(
      membership && e.evaluator_membership_number?.trim() === membership,
    ),
  }))

  const teamScores = await stageAveragesForTeam(c.env, project.team_id, jurySet)

  return c.json({
    project_id: projectId,
    project_title: project.title,
    stage: project.stage,
    summary: project.summary,
    evaluations: mapped,
    current_admin_evaluation: current
      ? mapped.find((e) => e.id === current.id)
      : undefined,
    total_admin_evaluations: jury_count,
    jury_average,
    stage_score: jury_average,
    primary_average: teamScores.primary_average,
    final_average: teamScores.final_average,
    overall_score: teamScores.overall_score,
    final_score: jury_average,
    has_ai_evaluation: evaluations.some((e) => e.is_ai_evaluation),
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
  if (!(await canEvaluateTeam(env, team.event_id, membershipNumber, project.team_id))) {
    return {
      error: 'Only assigned juries can evaluate this project' as const,
      status: 403 as const,
    }
  }
  return { project, team }
}

/** Jury score (upsert one score per jury per project). */
evaluationRouter.post('/admin', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const member = c.get('member')
  const projectId = Number(body.project_id)
  const gate = await assertCanEvaluateProject(c.env, projectId, member?.membership_number)
  if ('error' in gate) return c.json({ message: gate.error }, gate.status)

  const score = Number(body.score)
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return c.json({ message: 'score must be between 0 and 100' }, 400)
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  if (!notes) {
    return c.json({ message: 'notes are required' }, 400)
  }

  const evaluation = await upsertJuryEvaluation(c.env, {
    project_id: projectId,
    evaluator_membership_number: member!.membership_number,
    score,
    notes,
    detailed_scores: body.detailed_scores ?? null,
  })
  return c.json(evaluation, 201)
})

evaluationRouter.post('/ai', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const member = c.get('member')
  const projectId = Number(body.project_id)
  const gate = await assertCanEvaluateProject(c.env, projectId, member?.membership_number)
  if ('error' in gate) return c.json({ message: gate.error }, gate.status)

  const existingAi = (await listEvaluationsByProject(c.env, projectId)).find(
    (e) => e.is_ai_evaluation,
  )
  if (existingAi) {
    return c.json({ message: 'AI evaluation already exists for this project' }, 409)
  }

  const evaluation = await createEvaluation(c.env, {
    ...body,
    project_id: projectId,
    is_ai_evaluation: true,
    admin_id: null,
    evaluator_membership_number: null,
  })
  return c.json(evaluation, 201)
})

evaluationRouter.get('/my-score/:project_id', memberAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const member = c.get('member')
  if (!member?.membership_number) return c.json({ message: 'Unauthorized' }, 401)
  const evaluation = await findJuryEvaluation(c.env, projectId, member.membership_number)
  return c.json(evaluation)
})

export default evaluationRouter
