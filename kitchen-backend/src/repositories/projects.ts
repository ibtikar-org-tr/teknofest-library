import type { Environment } from '../types/env'
import type { ApplicationStage, ProjectSubmission } from '../types/models'
import { mapProject } from '../utils/mappers'
import { boolToInt } from '../utils/sql'
import { getTeam } from './teams'

export const isApplicationStage = (value: unknown): value is ApplicationStage =>
  value === 'primary' || value === 'final'

export const listProjects = async (
  env: Environment,
  eventId?: string,
): Promise<ProjectSubmission[]> => {
  if (eventId) {
    const { results } = await env.D1_DB.prepare(
      `SELECT * FROM project_submissions
       WHERE event_id = ?
       ORDER BY CASE stage WHEN 'primary' THEN 0 ELSE 1 END, id DESC`,
    )
      .bind(eventId)
      .all()
    return (results ?? []).map((row) => mapProject(row as Record<string, unknown>))
  }
  const { results } = await env.D1_DB.prepare(
    `SELECT * FROM project_submissions
     ORDER BY CASE stage WHEN 'primary' THEN 0 ELSE 1 END, id DESC`,
  ).all()
  return (results ?? []).map((row) => mapProject(row as Record<string, unknown>))
}

export const getProject = async (
  env: Environment,
  id: number,
): Promise<ProjectSubmission | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM project_submissions WHERE id = ?')
    .bind(id)
    .first()
  return row ? mapProject(row as Record<string, unknown>) : null
}

export const listProjectsByTeam = async (
  env: Environment,
  teamId: number,
): Promise<ProjectSubmission[]> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT * FROM project_submissions
     WHERE team_id = ?
     ORDER BY CASE stage WHEN 'primary' THEN 0 ELSE 1 END, id DESC`,
  )
    .bind(teamId)
    .all()
  return (results ?? []).map((row) => mapProject(row as Record<string, unknown>))
}

export const getProjectByTeamStage = async (
  env: Environment,
  teamId: number,
  stage: ApplicationStage,
): Promise<ProjectSubmission | null> => {
  const row = await env.D1_DB.prepare(
    'SELECT * FROM project_submissions WHERE team_id = ? AND stage = ? LIMIT 1',
  )
    .bind(teamId, stage)
    .first()
  return row ? mapProject(row as Record<string, unknown>) : null
}

export type CreateProjectResult =
  | { ok: true; project: ProjectSubmission }
  | { ok: false; status: 400 | 404 | 409 | 500; message: string }

/** Ensure a program_versions row exists (FK required by project_submissions). */
export const ensureProgramVersionId = async (
  env: Environment,
  preferredId = 1,
): Promise<number> => {
  const preferred = await env.D1_DB.prepare(
    'SELECT id FROM program_versions WHERE id = ? LIMIT 1',
  )
    .bind(preferredId)
    .first<{ id: number }>()
  if (preferred) return Number(preferred.id)

  const any = await env.D1_DB.prepare(
    'SELECT id FROM program_versions ORDER BY id ASC LIMIT 1',
  ).first<{ id: number }>()
  if (any) return Number(any.id)

  const created = await env.D1_DB.prepare(
    `INSERT INTO program_versions (version_number, version_name, is_active)
     VALUES (1, '2026', 1)
     RETURNING id`,
  ).first<{ id: number }>()
  if (!created) {
    throw new Error('Failed to create default program version')
  }
  return Number(created.id)
}

export const createProject = async (
  env: Environment,
  payload: {
    event_id: string
    team_id: number
    program_version_id: number
    stage?: ApplicationStage | string
    summary: string
    image_path?: string | null
    diagram_path?: string | null
    design_path?: string | null
    has_attachments?: boolean
  },
): Promise<CreateProjectResult> => {
  const stageRaw = payload.stage ?? 'primary'
  if (!isApplicationStage(stageRaw)) {
    return { ok: false, status: 400, message: 'stage must be primary or final' }
  }
  const stage = stageRaw

  const summary = String(payload.summary ?? '').trim()
  if (!summary) {
    return { ok: false, status: 400, message: 'summary is required' }
  }

  const team = await getTeam(env, payload.team_id)
  if (!team || team.event_id !== payload.event_id) {
    return { ok: false, status: 404, message: 'Team not found in this event kitchen' }
  }

  if (!team.field?.trim()) {
    return {
      ok: false,
      status: 400,
      message: 'Choose a competition before submitting an application',
    }
  }

  if (stage === 'final') {
    const primary = await getProjectByTeamStage(env, payload.team_id, 'primary')
    if (!primary) {
      return {
        ok: false,
        status: 400,
        message: 'Submit the primary stage application before the final stage',
      }
    }
  }

  const existing = await getProjectByTeamStage(env, payload.team_id, stage)
  if (existing) {
    return {
      ok: false,
      status: 409,
      message: `This team already submitted the ${stage} stage`,
    }
  }

  const hasAttachments = Boolean(
    payload.has_attachments || payload.image_path || payload.diagram_path || payload.design_path,
  )
  const title =
    stage === 'primary'
      ? `${team.team_name} — المرحلة الأولية`
      : `${team.team_name} — المرحلة النهائية`

  let programVersionId: number
  try {
    programVersionId = await ensureProgramVersionId(env, payload.program_version_id || 1)
  } catch (error) {
    console.error('ensureProgramVersionId failed', error)
    return {
      ok: false,
      status: 500,
      message: 'Program version is not configured — contact an event manager',
    }
  }

  try {
    const row = await env.D1_DB.prepare(
      `INSERT INTO project_submissions (
        event_id, team_id, program_version_id, submission_version, stage, summary,
        title, problem_statement, technical_description, scientific_reference, field,
        image_path, diagram_path, design_path, has_attachments, is_complete, character_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`,
    )
      .bind(
        payload.event_id,
        payload.team_id,
        programVersionId,
        stage === 'primary' ? 1 : 2,
        stage,
        summary,
        title,
        summary,
        '',
        '',
        team.field,
        payload.image_path ?? null,
        payload.diagram_path ?? null,
        payload.design_path ?? null,
        boolToInt(hasAttachments),
        1,
        summary.length,
      )
      .first()

    if (!row) {
      return { ok: false, status: 500, message: 'Failed to create project submission' }
    }
    return { ok: true, project: mapProject(row as Record<string, unknown>) }
  } catch (error) {
    console.error('createProject insert failed', error)
    const msg = error instanceof Error ? error.message : String(error)
    if (/FOREIGN KEY/i.test(msg)) {
      return {
        ok: false,
        status: 400,
        message: 'Invalid team or program version for this submission',
      }
    }
    return { ok: false, status: 500, message: 'Failed to create project submission' }
  }
}
