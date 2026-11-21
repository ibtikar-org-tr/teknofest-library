import type { Environment } from '../types/env'
import type { ApplicationStage, Team } from '../types/models'
import { averageJuryScores } from './evaluations'
import { listEvaluationsByProject } from './evaluations'
import { listJuriesAssignedToTeam } from './juries'
import { enrichTeamsWithCompetitionLabels } from './kitchen-competitions'
import { listProjectFiles } from './project-files'
import { getProject, listProjectsByTeam } from './projects'
import { getTeam, listTeams } from './teams'

export type AdminStageJuryScore = {
  membership_number: string
  full_name: string | null
  email: string | null
  score: number | null
  notes: string | null
  evaluated: boolean
  evaluation_id: number | null
  created_at: string | null
}

export type AdminStageOverview = {
  project_id: number
  stage: ApplicationStage
  title: string
  summary: string
  files_count: number
  jury_average: number | null
  required_jury_count: number
  scored_jury_count: number
  all_juries_scored: boolean
  can_accept: boolean
  score_accepted: boolean
  score_accepted_at: string | null
  score_accepted_by: string | null
  evaluations: AdminStageJuryScore[]
}

export type AdminTeamOverview = Team & {
  field_label: string
  member_count: number
  assigned_juries: {
    membership_number: string
    full_name: string | null
    email: string | null
  }[]
  stages: {
    primary: AdminStageOverview | null
    final: AdminStageOverview | null
  }
}

async function buildStageOverview(
  env: Environment,
  eventId: string,
  teamId: number,
  stage: ApplicationStage,
  assigned: { membership_number: string; full_name: string | null; email: string | null }[],
): Promise<AdminStageOverview | null> {
  const projects = await listProjectsByTeam(env, teamId)
  const project = projects.find((p) => p.stage === stage)
  if (!project) return null

  const files = await listProjectFiles(env, project.id)
  const evaluations = await listEvaluationsByProject(env, project.id)
  const jurySet = new Set(assigned.map((j) => j.membership_number))
  const { jury_average } = averageJuryScores(evaluations, jurySet)

  const byMember = new Map(
    evaluations
      .filter((e) => !e.is_ai_evaluation && e.evaluator_membership_number)
      .map((e) => [e.evaluator_membership_number!.trim(), e]),
  )

  const evaluationRows: AdminStageJuryScore[] = assigned.map((j) => {
    const ev = byMember.get(j.membership_number)
    return {
      membership_number: j.membership_number,
      full_name: j.full_name,
      email: j.email,
      score: ev ? ev.score : null,
      notes: ev?.notes ?? null,
      evaluated: Boolean(ev),
      evaluation_id: ev?.id ?? null,
      created_at: ev?.created_at ?? null,
    }
  })

  const scored_jury_count = evaluationRows.filter((e) => e.evaluated).length
  const required_jury_count = assigned.length
  const all_juries_scored =
    required_jury_count > 0 && scored_jury_count === required_jury_count
  const can_accept = all_juries_scored && !project.score_accepted && jury_average != null

  return {
    project_id: project.id,
    stage,
    title: project.title,
    summary: project.summary,
    files_count: files.length,
    jury_average,
    required_jury_count,
    scored_jury_count,
    all_juries_scored,
    can_accept,
    score_accepted: project.score_accepted,
    score_accepted_at: project.score_accepted_at,
    score_accepted_by: project.score_accepted_by,
    evaluations: evaluationRows,
  }
}

export async function listAdminTeamsOverview(
  env: Environment,
  eventId: string,
): Promise<AdminTeamOverview[]> {
  const teams = await listTeams(env, eventId)
  const withMembers: Team[] = []
  for (const t of teams) {
    const full = await getTeam(env, t.id)
    if (full) withMembers.push(full)
  }
  const enriched = await enrichTeamsWithCompetitionLabels(env, withMembers)

  const out: AdminTeamOverview[] = []
  for (const team of enriched) {
    const assigned = await listJuriesAssignedToTeam(env, eventId, team.id)
    const primary = await buildStageOverview(env, eventId, team.id, 'primary', assigned)
    const final = await buildStageOverview(env, eventId, team.id, 'final', assigned)
    out.push({
      ...team,
      member_count: team.members?.length ?? 0,
      assigned_juries: assigned,
      stages: { primary, final },
    })
  }
  return out
}

export type AcceptStageResult =
  | { ok: true; project_id: number; stage: ApplicationStage; jury_average: number }
  | { ok: false; status: 400 | 404 | 409; message: string }

export async function acceptProjectStageScore(
  env: Environment,
  eventId: string,
  projectId: number,
  acceptedBy: string,
): Promise<AcceptStageResult> {
  const project = await getProject(env, projectId)
  if (!project || project.event_id !== eventId) {
    return { ok: false, status: 404, message: 'Project not found in this kitchen' }
  }
  if (project.score_accepted) {
    return { ok: false, status: 409, message: 'Stage score already accepted' }
  }

  const assigned = await listJuriesAssignedToTeam(env, eventId, project.team_id)
  if (assigned.length === 0) {
    return {
      ok: false,
      status: 400,
      message: 'Assign at least one jury to this team before accepting scores',
    }
  }

  const evaluations = await listEvaluationsByProject(env, projectId)
  const jurySet = new Set(assigned.map((j) => j.membership_number))
  const { jury_average, jury_count } = averageJuryScores(evaluations, jurySet)
  if (jury_count < assigned.length || jury_average == null) {
    return {
      ok: false,
      status: 400,
      message: `All assigned juries must score this stage (${jury_count}/${assigned.length})`,
    }
  }

  const row = await env.D1_DB.prepare(
    `UPDATE project_submissions
     SET score_accepted = 1,
         score_accepted_at = datetime('now'),
         score_accepted_by = ?,
         updated_at = datetime('now')
     WHERE id = ?
     RETURNING id, stage`,
  )
    .bind(acceptedBy, projectId)
    .first<{ id: number; stage: string }>()

  if (!row) return { ok: false, status: 404, message: 'Project not found' }

  return {
    ok: true,
    project_id: projectId,
    stage: row.stage === 'final' ? 'final' : 'primary',
    jury_average,
  }
}
