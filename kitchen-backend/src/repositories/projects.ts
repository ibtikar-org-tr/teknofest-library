import type { Environment } from '../types/env'
import type { ProjectSubmission } from '../types/models'
import { mapProject } from '../utils/mappers'
import { boolToInt } from '../utils/sql'

export const listProjects = async (env: Environment): Promise<ProjectSubmission[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM project_submissions ORDER BY id DESC')
    .all()
  return (results ?? []).map((row) => mapProject(row as Record<string, unknown>))
}

export const getProject = async (
  env: Environment,
  id: number
): Promise<ProjectSubmission | null> => {
  const row = await env.D1_DB
    .prepare('SELECT * FROM project_submissions WHERE id = ?')
    .bind(id)
    .first()
  return row ? mapProject(row as Record<string, unknown>) : null
}

export const listProjectsByTeam = async (
  env: Environment,
  teamId: number
): Promise<ProjectSubmission[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM project_submissions WHERE team_id = ? ORDER BY id DESC')
    .bind(teamId)
    .all()
  return (results ?? []).map((row) => mapProject(row as Record<string, unknown>))
}

export const createProject = async (
  env: Environment,
  payload: {
    team_id: number
    program_version_id: number
    submission_version?: number
    title: string
    problem_statement: string
    technical_description: string
    scientific_reference: string
    field: string
    image_path?: string | null
    diagram_path?: string | null
    design_path?: string | null
    has_attachments?: boolean
  }
): Promise<ProjectSubmission> => {
  const characterCount = payload.technical_description.length
  const row = await env.D1_DB.prepare(
    `INSERT INTO project_submissions (
      team_id, program_version_id, submission_version, title, problem_statement,
      technical_description, scientific_reference, field, image_path, diagram_path,
      design_path, has_attachments, is_complete, character_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`
  )
    .bind(
      payload.team_id,
      payload.program_version_id,
      payload.submission_version ?? 1,
      payload.title,
      payload.problem_statement,
      payload.technical_description,
      payload.scientific_reference,
      payload.field,
      payload.image_path ?? null,
      payload.diagram_path ?? null,
      payload.design_path ?? null,
      boolToInt(payload.has_attachments ?? false),
      characterCount >= 1000 ? 1 : 0,
      characterCount
    )
    .first()

  return mapProject(row as Record<string, unknown>)
}

export const listFeaturedProjects = async (env: Environment): Promise<ProjectSubmission[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM project_submissions WHERE is_featured = 1 ORDER BY id DESC')
    .all()
  return (results ?? []).map((row) => mapProject(row as Record<string, unknown>))
}
