export type RegistrationType =
  | 'team_with_idea'
  | 'individual_with_idea'
  | 'individual_no_idea'
  | 'team_no_idea'

export type Gender = 'male' | 'female'

export interface ProgramVersion {
  id: number
  version_number: number
  version_name: string | null
  is_active: boolean
  created_at: string
}

/** @deprecated Prefer KitchenStaff — kept for transitional FE fields */
export interface Admin {
  id?: number
  username?: string
  membership_number?: string
  email: string
  full_name: string | null
  evaluation_weight: number
  is_active: boolean
  is_superadmin: boolean
  created_at: string
}

export interface KitchenStaff {
  membership_number: string
  email: string
  full_name: string | null
  evaluation_weight: number
  is_active: boolean
  is_superadmin: boolean
  created_at: string
}

export interface EventKitchen {
  event_id: string
  enabled: boolean
  created_by: string
  created_at: string
  updated_at: string | null
  /** Min competitions a pool registrant must select (null = rules not set). */
  interest_min: number | null
  /** Max competitions a pool registrant may select (null = rules not set). */
  interest_max: number | null
  /** Members may create teams themselves (managers always can). */
  allow_create_teams: boolean
  /** Members may join existing teams themselves (managers always can assign). */
  allow_join_teams: boolean
  /** Max members per team (default 8). */
  max_team_size: number
}

export interface VmsEventSummary {
  id: string
  name: string
  description: string | null
  start_time: string | null
  end_time: string | null
  status: string
  image_url: string | null
  project_id: string | null
  created_by: string | null
}

export interface KitchenEventView extends VmsEventSummary {
  kitchen_enabled: boolean
  kitchen?: EventKitchen | null
  can_access?: boolean
  can_manage?: boolean
  /** Caller is appointed jury for this event (may or may not have team assignments yet). */
  is_jury?: boolean
}

export interface Team {
  id: number
  event_id: string | null
  team_name: string
  registration_type: RegistrationType
  /** Library competition id (string). Prefer `field_label` for display. */
  field: string
  /** Resolved Arabic (or fallback) name from Library when available. */
  field_label?: string
  gender: Gender
  initial_idea: string | null
  program_version_id: number | null
  telegram_group_link: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
  members?: TeamMember[]
}

export interface TeamMember {
  id: number
  team_id: number
  full_name: string
  email: string
  phone: string
  is_leader: boolean
  membership_number: string | null
  created_at: string
}

export interface Individual {
  id: number
  event_id: string | null
  registration_type: RegistrationType
  full_name: string
  membership_number: string | null
  email: string
  phone: string
  gender: Gender
  technical_skills: string | null
  interests: string | null
  experience_level: string | null
  /** Primary / first interest (library id string) — kept for display compatibility. */
  preferred_field: string
  /** All interest competition ids (library). */
  preferred_competition_ids: number[]
  preferred_field_label?: string
  preferred_field_labels?: string[]
  project_idea: string | null
  assigned_team_id: number | null
  program_version_id: number | null
  is_assigned: boolean
  created_at: string
  updated_at: string | null
}

/** Application stage — juried separately; overall = 40% primary + 60% final. */
export type ApplicationStage = 'primary' | 'final'

export interface ProjectSubmission {
  id: number
  event_id: string | null
  team_id: number
  program_version_id: number
  submission_version: number
  /** primary | final — one row per team per stage */
  stage: ApplicationStage
  /** Only free-text field on the application form */
  summary: string
  title: string
  /** @deprecated use summary — kept for older rows */
  problem_statement: string
  /** @deprecated empty for new applications */
  technical_description: string
  /** @deprecated empty for new applications */
  scientific_reference: string
  field: string
  /** @deprecated use project_files */
  image_path: string | null
  /** @deprecated use project_files */
  diagram_path: string | null
  /** @deprecated use project_files */
  design_path: string | null
  has_attachments: boolean
  is_complete: boolean
  character_count: number
  is_featured: boolean
  /** When true, stage average is public on the leaderboard. */
  score_accepted: boolean
  score_accepted_at: string | null
  score_accepted_by: string | null
  created_at: string
  updated_at: string | null
  files?: ProjectFile[]
}

export interface ProjectFile {
  id: number
  project_id: number
  display_name: string
  description: string | null
  storage_key: string
  original_filename: string | null
  content_type: string | null
  size_bytes: number
  created_at: string
}

export interface Evaluation {
  id: number
  project_id: number
  admin_id: number | null
  evaluator_membership_number: string | null
  is_ai_evaluation: boolean
  score: number
  notes: string | null
  detailed_scores: Record<string, number> | null
  created_at: string
  updated_at: string | null
}
