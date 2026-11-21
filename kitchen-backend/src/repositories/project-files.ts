import type { Environment } from '../types/env'
import type { ProjectFile } from '../types/models'

export const MAX_PROJECT_FILES = 10
export const MAX_PROJECT_FILE_BYTES = 10 * 1024 * 1024

export const mapProjectFile = (row: Record<string, unknown>): ProjectFile => ({
  id: Number(row.id),
  project_id: Number(row.project_id),
  display_name: String(row.display_name),
  description: row.description == null ? null : String(row.description),
  storage_key: String(row.storage_key),
  original_filename: row.original_filename == null ? null : String(row.original_filename),
  content_type: row.content_type == null ? null : String(row.content_type),
  size_bytes: Number(row.size_bytes) || 0,
  created_at: String(row.created_at),
})

export const listProjectFiles = async (
  env: Environment,
  projectId: number,
): Promise<ProjectFile[]> => {
  const { results } = await env.D1_DB.prepare(
    'SELECT * FROM project_files WHERE project_id = ? ORDER BY id ASC',
  )
    .bind(projectId)
    .all()
  return (results ?? []).map((row) => mapProjectFile(row as Record<string, unknown>))
}

export const countProjectFiles = async (env: Environment, projectId: number): Promise<number> => {
  const row = await env.D1_DB.prepare(
    'SELECT COUNT(*) AS c FROM project_files WHERE project_id = ?',
  )
    .bind(projectId)
    .first<{ c: number }>()
  return Number(row?.c) || 0
}

export const getProjectFile = async (
  env: Environment,
  fileId: number,
): Promise<ProjectFile | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM project_files WHERE id = ?')
    .bind(fileId)
    .first()
  return row ? mapProjectFile(row as Record<string, unknown>) : null
}

export const createProjectFileRecord = async (
  env: Environment,
  payload: {
    project_id: number
    display_name: string
    description?: string | null
    storage_key: string
    original_filename?: string | null
    content_type?: string | null
    size_bytes: number
  },
): Promise<ProjectFile> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO project_files (
      project_id, display_name, description, storage_key,
      original_filename, content_type, size_bytes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *`,
  )
    .bind(
      payload.project_id,
      payload.display_name,
      payload.description ?? null,
      payload.storage_key,
      payload.original_filename ?? null,
      payload.content_type ?? null,
      payload.size_bytes,
    )
    .first()

  await env.D1_DB.prepare(
    'UPDATE project_submissions SET has_attachments = 1, updated_at = datetime(\'now\') WHERE id = ?',
  )
    .bind(payload.project_id)
    .run()

  return mapProjectFile(row as Record<string, unknown>)
}
