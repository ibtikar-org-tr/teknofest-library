import type { Environment } from '../types/env'
import type { Evaluation } from '../types/models'
import { mapEvaluation } from '../utils/mappers'
import { boolToInt, toJsonText } from '../utils/sql'

export const listEvaluationsByProject = async (
  env: Environment,
  projectId: number,
): Promise<Evaluation[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM evaluations WHERE project_id = ? ORDER BY id DESC')
    .bind(projectId)
    .all()
  return (results ?? []).map((row) => mapEvaluation(row as Record<string, unknown>))
}

export const findJuryEvaluation = async (
  env: Environment,
  projectId: number,
  membershipNumber: string,
): Promise<Evaluation | null> => {
  const row = await env.D1_DB.prepare(
    `SELECT * FROM evaluations
     WHERE project_id = ?
       AND evaluator_membership_number = ?
       AND is_ai_evaluation = 0
     ORDER BY id DESC
     LIMIT 1`,
  )
    .bind(projectId, membershipNumber.trim())
    .first()
  return row ? mapEvaluation(row as Record<string, unknown>) : null
}

export const createEvaluation = async (
  env: Environment,
  payload: {
    project_id: number
    evaluator_membership_number?: string | null
    admin_id?: number | null
    is_ai_evaluation?: boolean
    score: number
    notes?: string | null
    detailed_scores?: Record<string, number> | null
  },
): Promise<Evaluation> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO evaluations (
      project_id, admin_id, evaluator_membership_number, is_ai_evaluation, score, notes, detailed_scores
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *`,
  )
    .bind(
      payload.project_id,
      payload.admin_id ?? null,
      payload.evaluator_membership_number ?? null,
      boolToInt(payload.is_ai_evaluation ?? false),
      payload.score,
      payload.notes ?? null,
      toJsonText(payload.detailed_scores ?? null),
    )
    .first()

  return mapEvaluation(row as Record<string, unknown>)
}

/** One human score per jury per project — update if exists, else insert. */
export const upsertJuryEvaluation = async (
  env: Environment,
  payload: {
    project_id: number
    evaluator_membership_number: string
    score: number
    notes?: string | null
    detailed_scores?: Record<string, number> | null
  },
): Promise<Evaluation> => {
  const existing = await findJuryEvaluation(
    env,
    payload.project_id,
    payload.evaluator_membership_number,
  )
  if (existing) {
    const row = await env.D1_DB.prepare(
      `UPDATE evaluations
       SET score = ?, notes = ?, detailed_scores = ?, updated_at = datetime('now')
       WHERE id = ?
       RETURNING *`,
    )
      .bind(
        payload.score,
        payload.notes ?? null,
        toJsonText(payload.detailed_scores ?? null),
        existing.id,
      )
      .first()
    return mapEvaluation(row as Record<string, unknown>)
  }
  return createEvaluation(env, {
    ...payload,
    admin_id: null,
    is_ai_evaluation: false,
  })
}

export const averageJuryScores = (
  evaluations: Evaluation[],
  juryMembershipNumbers: Set<string>,
): { jury_average: number | null; jury_count: number } => {
  const juryScores = evaluations.filter(
    (e) =>
      !e.is_ai_evaluation &&
      e.evaluator_membership_number &&
      juryMembershipNumbers.has(e.evaluator_membership_number.trim()),
  )
  if (juryScores.length === 0) {
    return { jury_average: null, jury_count: 0 }
  }
  const sum = juryScores.reduce((acc, e) => acc + e.score, 0)
  return { jury_average: sum / juryScores.length, jury_count: juryScores.length }
}
