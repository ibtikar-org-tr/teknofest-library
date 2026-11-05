import { asBool } from './sql'
import type {
  Admin,
  Evaluation,
  Individual,
  ProgramVersion,
  ProjectSubmission,
  Team,
  TeamMember,
} from '../types/models'

export const mapProgramVersion = (row: Record<string, unknown>): ProgramVersion => ({
  id: Number(row.id),
  version_number: Number(row.version_number),
  version_name: (row.version_name as string) ?? null,
  is_active: asBool(row.is_active),
  created_at: String(row.created_at),
})

export const mapAdmin = (row: Record<string, unknown>): Admin => ({
  id: Number(row.id),
  username: String(row.username),
  email: String(row.email),
  full_name: (row.full_name as string) ?? null,
  evaluation_weight: Number(row.evaluation_weight),
  is_active: asBool(row.is_active),
  is_superadmin: asBool(row.is_superadmin),
  created_at: String(row.created_at),
})

export const mapTeamMember = (row: Record<string, unknown>): TeamMember => ({
  id: Number(row.id),
  team_id: Number(row.team_id),
  full_name: String(row.full_name),
  email: String(row.email),
  phone: String(row.phone),
  is_leader: asBool(row.is_leader),
  membership_number: (row.membership_number as string) ?? null,
  created_at: String(row.created_at),
})

export const mapTeam = (row: Record<string, unknown>): Team => ({
  id: Number(row.id),
  team_name: String(row.team_name),
  registration_type: row.registration_type as Team['registration_type'],
  field: String(row.field),
  gender: row.gender as Team['gender'],
  initial_idea: (row.initial_idea as string) ?? null,
  program_version_id: row.program_version_id == null ? null : Number(row.program_version_id),
  telegram_group_link: (row.telegram_group_link as string) ?? null,
  is_active: asBool(row.is_active),
  created_at: String(row.created_at),
  updated_at: (row.updated_at as string) ?? null,
})

export const mapIndividual = (row: Record<string, unknown>): Individual => ({
  id: Number(row.id),
  registration_type: row.registration_type as Individual['registration_type'],
  full_name: String(row.full_name),
  membership_number: (row.membership_number as string) ?? null,
  email: String(row.email),
  phone: String(row.phone),
  gender: row.gender as Individual['gender'],
  technical_skills: (row.technical_skills as string) ?? null,
  interests: (row.interests as string) ?? null,
  experience_level: (row.experience_level as string) ?? null,
  preferred_field: String(row.preferred_field),
  project_idea: (row.project_idea as string) ?? null,
  assigned_team_id: row.assigned_team_id == null ? null : Number(row.assigned_team_id),
  program_version_id: row.program_version_id == null ? null : Number(row.program_version_id),
  is_assigned: asBool(row.is_assigned),
  created_at: String(row.created_at),
  updated_at: (row.updated_at as string) ?? null,
})

export const mapProject = (row: Record<string, unknown>): ProjectSubmission => ({
  id: Number(row.id),
  team_id: Number(row.team_id),
  program_version_id: Number(row.program_version_id),
  submission_version: Number(row.submission_version),
  title: String(row.title),
  problem_statement: String(row.problem_statement),
  technical_description: String(row.technical_description),
  scientific_reference: String(row.scientific_reference),
  field: String(row.field),
  image_path: (row.image_path as string) ?? null,
  diagram_path: (row.diagram_path as string) ?? null,
  design_path: (row.design_path as string) ?? null,
  has_attachments: asBool(row.has_attachments),
  is_complete: asBool(row.is_complete),
  character_count: Number(row.character_count),
  is_featured: asBool(row.is_featured),
  created_at: String(row.created_at),
  updated_at: (row.updated_at as string) ?? null,
})

export const mapEvaluation = (row: Record<string, unknown>): Evaluation => {
  let detailed_scores: Record<string, number> | null = null
  if (typeof row.detailed_scores === 'string' && row.detailed_scores) {
    try {
      detailed_scores = JSON.parse(row.detailed_scores)
    } catch {
      detailed_scores = null
    }
  }
  return {
    id: Number(row.id),
    project_id: Number(row.project_id),
    admin_id: row.admin_id == null ? null : Number(row.admin_id),
    is_ai_evaluation: asBool(row.is_ai_evaluation),
    score: Number(row.score),
    notes: (row.notes as string) ?? null,
    detailed_scores,
    created_at: String(row.created_at),
    updated_at: (row.updated_at as string) ?? null,
  }
}
