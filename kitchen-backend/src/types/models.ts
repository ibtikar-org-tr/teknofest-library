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

export interface Admin {
  id: number
  username: string
  email: string
  full_name: string | null
  evaluation_weight: number
  is_active: boolean
  is_superadmin: boolean
  created_at: string
}

export interface Team {
  id: number
  team_name: string
  registration_type: RegistrationType
  field: string
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
  registration_type: RegistrationType
  full_name: string
  membership_number: string | null
  email: string
  phone: string
  gender: Gender
  technical_skills: string | null
  interests: string | null
  experience_level: string | null
  preferred_field: string
  project_idea: string | null
  assigned_team_id: number | null
  program_version_id: number | null
  is_assigned: boolean
  created_at: string
  updated_at: string | null
}

export interface ProjectSubmission {
  id: number
  team_id: number
  program_version_id: number
  submission_version: number
  title: string
  problem_statement: string
  technical_description: string
  scientific_reference: string
  field: string
  image_path: string | null
  diagram_path: string | null
  design_path: string | null
  has_attachments: boolean
  is_complete: boolean
  character_count: number
  is_featured: boolean
  created_at: string
  updated_at: string | null
}

export interface Evaluation {
  id: number
  project_id: number
  admin_id: number | null
  is_ai_evaluation: boolean
  score: number
  notes: string | null
  detailed_scores: Record<string, number> | null
  created_at: string
  updated_at: string | null
}
