// Registration Types
export type RegistrationType =
  | 'team_with_idea'
  | 'individual_with_idea'
  | 'individual_no_idea'
  | 'team_no_idea'

/** Competition field value stored on teams / individuals / projects (from library). */
export type ProjectField = string

export type CompetitionType = 'competitive' | 'innovative'

/** Dropdown option sourced from library via kitchen `GET /kitchens/:eventId/fields`. */
export type ProjectFieldOption = {
  id: number
  value: string
  label: string
  labelEn: string
  labelTr: string
  type: CompetitionType | null
}

export type Gender = 'male' | 'female'

// Team Member
export interface TeamMember {
  id?: number
  full_name: string
  email: string
  phone: string
  is_leader: boolean
  team_id?: number
  created_at?: string
  membership_number?: string
}

export interface KitchenEvent {
  id: string
  name: string
  description: string | null
  start_time: string | null
  end_time: string | null
  status: string
  image_url: string | null
  project_id: string | null
  created_by?: string | null
  kitchen_enabled: boolean
  can_access?: boolean
  can_manage?: boolean
  is_jury?: boolean
  kitchen?: {
    event_id: string
    enabled: boolean
    created_by: string
    created_at: string
    updated_at: string | null
  } | null
}

// Team
export interface Team {
  id?: number
  event_id?: string | null
  team_name: string
  registration_type: RegistrationType
  field: ProjectField
  initial_idea?: string
  telegram_group_link?: string
  is_active?: boolean
  created_at?: string
  members: TeamMember[]
  gender: Gender
}

// Individual
export interface Individual {
  id?: number
  event_id?: string | null
  registration_type: RegistrationType
  membership_number: string
  full_name: string
  email: string
  phone: string
  technical_skills: string
  interests: string
  experience_level?: string | null
  preferred_field: ProjectField
  project_idea?: string
  assigned_team_id?: number
  is_assigned?: boolean
  created_at?: string
  gender: Gender
}

export type ApplicationStage = 'primary' | 'final'

// Project Submission Create (team resolved from authenticated VMS session)
export interface ProjectSubmissionCreate {
  event_id?: string
  team_id?: number
  member_email?: string
  stage: ApplicationStage
  summary: string
  program_version_id?: number
}

// Project Submission Response
export interface ProjectSubmission {
  id?: number
  team_id: number
  program_version_id?: number
  submission_version?: number
  stage: ApplicationStage
  summary: string
  title: string
  /** @deprecated use summary */
  problem_statement?: string
  technical_description?: string
  scientific_reference?: string
  field: ProjectField
  image_path?: string
  diagram_path?: string
  design_path?: string
  has_attachments?: boolean
  is_complete?: boolean
  is_featured?: boolean
  character_count?: number
  created_at?: string
  updated_at?: string
  team?: Team
  total_score?: number
  admin_score?: number
  ai_score?: number
}

// Evaluation
export interface Evaluation {
  id?: number
  project_id: number
  admin_id?: number
  is_ai_evaluation: boolean
  score: number
  notes?: string
  detailed_scores?: Record<string, number>
  created_at?: string
}

// Admin (kitchen_staff via VMS membership)
export interface Admin {
  membership_number: string
  username?: string
  email: string
  full_name: string
  evaluation_weight: number
  is_active?: boolean
  is_superadmin?: boolean
  created_at?: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface LeaderboardTeam {
  team_name: string
  member_count: number
}

// Team with available space
export interface TeamWithSpace {
  id: number
  team_name: string
  field: ProjectField
  member_count: number
  available_slots: number
  members: {
    id: number
    full_name: string
    email: string
    is_leader: boolean
  }[]
  gender: Gender
}
