import type { Environment } from '../types/env'
import type { Evaluation } from '../types/models'
import { mapEvaluation } from '../utils/mappers'
import { boolToInt, toJsonText } from '../utils/sql'

export const listEvaluationsByProject = async (
  env: Environment,
  projectId: number
): Promise<Evaluation[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM evaluations WHERE project_id = ? ORDER BY id DESC')
    .bind(projectId)
    .all()
  return (results ?? []).map((row) => mapEvaluation(row as Record<string, unknown>))
}

export const createEvaluation = async (
  env: Environment,
  payload: {
    project_id: number
    admin_id?: number | null
    is_ai_evaluation?: boolean
    score: number
    notes?: string | null
    detailed_scores?: Record<string, number> | null
  }
): Promise<Evaluation> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO evaluations (
      project_id, admin_id, is_ai_evaluation, score, notes, detailed_scores
    ) VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *`
  )
    .bind(
      payload.project_id,
      payload.admin_id ?? null,
      boolToInt(payload.is_ai_evaluation ?? false),
      payload.score,
      payload.notes ?? null,
      toJsonText(payload.detailed_scores ?? null)
    )
    .first()

  return mapEvaluation(row as Record<string, unknown>)
}
