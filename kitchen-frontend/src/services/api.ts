import axios from 'axios'
import type {
  Team,
  Individual,
  ProjectSubmission,
  ProjectSubmissionCreate,
  ProjectFile,
  Evaluation,
  AuthToken,
  Admin,
  TeamWithSpace,
  KitchenEvent,
  ProjectFieldOption,
} from '../types'
import { clearSession, getAccessToken } from '../lib/auth-session'

export const API_BASE_URL =
  import.meta.env.VITE_API_TARGET || 'http://localhost:9680/ms/kitchen'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors (skip SSO exchange — it uses its own error UI)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url ?? '')
    const isExchange = url.includes('/auth/vms/exchange')
    if (error.response?.status === 401 && !isExchange) {
      clearSession()
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?next=${next}`
    }
    return Promise.reject(error)
  }
)

export type VmsExchangeResponse = AuthToken & {
  is_staff: boolean
  is_event_manager?: boolean
  is_jury?: boolean
  is_superadmin: boolean
  admin?: Admin | null
  user: {
    membershipNumber: string
    email: string
    role: string
  }
}

export type EventRegistrant = {
  membership_number: string
  full_name: string
  email: string
  status: string
}

export type EventJury = {
  event_id: string
  membership_number: string
  full_name: string | null
  email: string | null
  created_by: string | null
  created_at: string
  team_ids: number[]
}

export type JuryAssignmentItem = {
  team_id: number
  team_name: string
  projects: ProjectSubmission[]
}

export type LeaderboardTeam = {
  team_name: string
  member_count: number
}

export type LeaderboardScoredEntry = {
  team_id: number
  team_name: string
  member_count: number
  stage: 'primary' | 'final'
  score: number
  rank: number
}

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
  stage: 'primary' | 'final'
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
  field_label?: string
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

// ==================== Auth ====================

export const authService = {
  exchangeVmsCode: async (code: string, redirectUri: string): Promise<VmsExchangeResponse> => {
    const response = await api.post('/auth/vms/exchange', { code, redirectUri })
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  getCurrentAdmin: async () => {
    const response = await api.get('/admin/me')
    return response.data
  },
}

// ==================== Event kitchens ====================

export const kitchensService = {
  list: async (): Promise<KitchenEvent[]> => {
    const response = await api.get('/kitchens')
    return response.data
  },

  get: async (eventId: string): Promise<KitchenEvent> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}`)
    return response.data
  },

  /** Competitions + interest rules for this kitchen. */
  getFields: async (
    eventId: string,
  ): Promise<{
    competitions: ProjectFieldOption[]
    interest_min: number | null
    interest_max: number | null
    registration_open: boolean
    allow_create_teams: boolean
    allow_join_teams: boolean
    max_team_size: number
  }> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/fields`)
    return response.data
  },

  /** Full library catalog + kitchen selection + interest rules (managers). */
  getCompetitionCatalog: async (
    eventId: string,
  ): Promise<{
    event_id: string
    selected_ids: number[]
    interest_min: number | null
    interest_max: number | null
    registration_open: boolean
    allow_create_teams: boolean
    allow_join_teams: boolean
    max_team_size: number
    competitions: (ProjectFieldOption & { selected: boolean })[]
  }> => {
    const response = await api.get(
      `/kitchens/${encodeURIComponent(eventId)}/competitions/catalog`,
    )
    return response.data
  },

  setKitchenCompetitions: async (
    eventId: string,
    competitionIds: number[],
    interestMin: number,
    interestMax: number,
  ): Promise<{
    event_id: string
    competition_ids: number[]
    interest_min: number
    interest_max: number
    registration_open: boolean
    competitions: ProjectFieldOption[]
  }> => {
    const response = await api.put(`/kitchens/${encodeURIComponent(eventId)}/competitions`, {
      competition_ids: competitionIds,
      interest_min: interestMin,
      interest_max: interestMax,
    })
    return response.data
  },

  setKitchenTeamSettings: async (
    eventId: string,
    settings: {
      allow_create_teams: boolean
      allow_join_teams: boolean
      max_team_size: number
    },
  ): Promise<{
    event_id: string
    allow_create_teams: boolean
    allow_join_teams: boolean
    max_team_size: number
  }> => {
    const response = await api.put(
      `/kitchens/${encodeURIComponent(eventId)}/team-settings`,
      settings,
    )
    return response.data
  },

  getMyTeam: async (eventId: string): Promise<Team | null> => {
    try {
      const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/my-team`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) return null
      throw error
    }
  },

  getMyProjects: async (
    eventId: string,
  ): Promise<{ team_id: number; projects: ProjectSubmission[] }> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/my-projects`)
    return response.data
  },

  setMyTeamCompetition: async (eventId: string, competitionId: number): Promise<Team> => {
    const response = await api.put(`/kitchens/${encodeURIComponent(eventId)}/my-team/competition`, {
      competition_id: competitionId,
    })
    return response.data
  },

  getMyVmsProfile: async (
    eventId: string,
  ): Promise<{
    membership_number: string
    email: string
    full_name: string
    phone: string
    gender: 'male' | 'female'
    technical_skills: string
    interests: string
  }> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/my-vms-profile`)
    return response.data
  },

  createTeam: async (eventId: string, team: Omit<Team, 'id'>): Promise<Team> => {
    const response = await api.post(`/kitchens/${encodeURIComponent(eventId)}/teams`, team)
    return response.data
  },

  createIndividual: async (
    eventId: string,
    individual: Omit<Individual, 'id'>,
  ): Promise<Individual> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/individuals`,
      individual,
    )
    return response.data
  },

  submitProject: async (
    eventId: string,
    project: ProjectSubmissionCreate,
  ): Promise<ProjectSubmission> => {
    const response = await api.post(`/kitchens/${encodeURIComponent(eventId)}/projects`, project)
    return response.data
  },

  getTeamsWithSpace: async (eventId: string): Promise<TeamWithSpace[]> => {
    const response = await api.get(
      `/kitchens/${encodeURIComponent(eventId)}/teams-with-space`,
    )
    return response.data
  },

  joinTeam: async (eventId: string, teamId: number): Promise<Team> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/teams/${teamId}/join`,
    )
    return response.data
  },

  /** Manager-only: remove a member from a team. */
  removeTeamMember: async (
    eventId: string,
    teamId: number,
    memberId: number,
  ): Promise<Team> => {
    const response = await api.delete(
      `/kitchens/${encodeURIComponent(eventId)}/teams/${teamId}/members/${memberId}`,
    )
    return response.data
  },

  /** Manager-only: move a team member to another team. */
  moveTeamMember: async (
    eventId: string,
    memberId: number,
    toTeamId: number,
  ): Promise<{ from_team: Team; to_team: Team }> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/members/${memberId}/move`,
      { to_team_id: toTeamId },
    )
    return response.data
  },

  getTeams: async (eventId: string): Promise<AdminTeamOverview[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/teams`)
    return response.data
  },

  acceptStageScore: async (
    eventId: string,
    projectId: number,
  ): Promise<{
    project_id: number
    stage: 'primary' | 'final'
    jury_average: number
  }> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/projects/${projectId}/accept-score`,
    )
    return response.data
  },

  getIndividuals: async (eventId: string, unassignedOnly = false): Promise<Individual[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/individuals`, {
      params: unassignedOnly ? { unassigned_only: true } : undefined,
    })
    return response.data
  },

  getProjects: async (eventId: string): Promise<ProjectSubmission[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/projects`)
    return response.data
  },

  getStats: async (eventId: string) => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/stats`)
    return response.data
  },

  /** Public — teams list + accepted primary/final score boards. */
  getLeaderboard: async (
    eventId: string,
  ): Promise<{
    event_id: string
    teams: LeaderboardTeam[]
    primary: LeaderboardScoredEntry[]
    final: LeaderboardScoredEntry[]
  }> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/leaderboard`)
    return response.data
  },

  getRegistrants: async (eventId: string): Promise<EventRegistrant[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/registrants`)
    return response.data
  },

  listJuries: async (eventId: string): Promise<EventJury[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/juries`)
    return response.data
  },

  addJury: async (
    eventId: string,
    payload: { membership_number: string; full_name?: string; email?: string },
  ): Promise<EventJury> => {
    const response = await api.post(`/kitchens/${encodeURIComponent(eventId)}/juries`, payload)
    return response.data
  },

  removeJury: async (eventId: string, membershipNumber: string): Promise<void> => {
    await api.delete(
      `/kitchens/${encodeURIComponent(eventId)}/juries/${encodeURIComponent(membershipNumber)}`,
    )
  },

  setJuryTeams: async (
    eventId: string,
    membershipNumber: string,
    teamIds: number[],
  ): Promise<{ membership_number: string; team_ids: number[] }> => {
    const response = await api.put(
      `/kitchens/${encodeURIComponent(eventId)}/juries/${encodeURIComponent(membershipNumber)}/teams`,
      { team_ids: teamIds },
    )
    return response.data
  },

  getMyJuryAssignments: async (
    eventId: string,
  ): Promise<{ event_id: string; assignments: JuryAssignmentItem[] }> => {
    const response = await api.get(
      `/kitchens/${encodeURIComponent(eventId)}/my-jury-assignments`,
    )
    return response.data
  },
}

// ==================== Teams ====================

export const teamsService = {
  create: async (team: Omit<Team, 'id'> & { event_id: string }): Promise<Team> => {
    const response = await api.post(`/kitchens/${encodeURIComponent(team.event_id)}/teams`, team)
    return response.data
  },

  getAll: async (eventId: string): Promise<Team[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/teams`)
    return response.data
  },

  getById: async (id: number): Promise<Team> => {
    const response = await api.get(`/students/team/${id}`)
    return response.data
  },

  update: async (id: number, team: Partial<Team>): Promise<Team> => {
    const response = await api.put(`/students/team/${id}`, team)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/team/${id}`)
  },

  sendTelegramLink: async (teamId: number, telegramLink: string): Promise<void> => {
    await api.post(`/students/team/${teamId}/telegram`, { telegram_link: telegramLink })
  },
}

// ==================== Individuals ====================

export const individualsService = {
  create: async (individual: Omit<Individual, 'id'> & { event_id: string }): Promise<Individual> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(individual.event_id)}/individuals`,
      individual,
    )
    return response.data
  },

  getAll: async (eventId: string): Promise<Individual[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/individuals`)
    return response.data
  },

  getById: async (id: number): Promise<Individual> => {
    const response = await api.get(`/students/individual/${id}`)
    return response.data
  },

  getUnassigned: async (eventId: string): Promise<Individual[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/individuals`, {
      params: { unassigned_only: true },
    })
    return response.data
  },

  assignToTeam: async (
    eventId: string,
    individualIds: number[],
    teamName: string,
    field: string,
  ): Promise<Team> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/assign-individuals`,
      {
        individual_ids: individualIds,
        team_name: teamName,
        field: field,
      },
    )
    return response.data
  },

  unassignIndividual: async (eventId: string, individualId: number) => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/individuals/${individualId}/unassign`,
    )
    return response.data
  },

  getTeamsWithSpace: async (eventId: string): Promise<TeamWithSpace[]> => {
    const response = await api.get(
      `/kitchens/${encodeURIComponent(eventId)}/teams-with-space`,
    )
    return response.data
  },

  addToExistingTeam: async (
    eventId: string,
    teamId: number,
    individualIds: number[],
  ): Promise<{ message: string; team_id: number; team_name: string; total_members: number }> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(eventId)}/teams/${teamId}/add-individuals`,
      individualIds,
    )
    return response.data
  },
}

// ==================== Projects ====================

export const projectsService = {
  submit: async (project: ProjectSubmissionCreate & { event_id: string }): Promise<ProjectSubmission> => {
    const response = await api.post(
      `/kitchens/${encodeURIComponent(project.event_id)}/projects`,
      project,
    )
    return response.data
  },

  /** @deprecated use uploadFile */
  uploadAttachments: async (projectId: number, files: FormData): Promise<ProjectSubmission> => {
    const response = await api.post(`/projects/${projectId}/attachments`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  uploadFile: async (
    projectId: number,
    payload: { file: File; display_name: string; description?: string },
  ): Promise<ProjectFile> => {
    const formData = new FormData()
    formData.append('file', payload.file)
    formData.append('display_name', payload.display_name)
    if (payload.description) formData.append('description', payload.description)
    const response = await api.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  listFiles: async (projectId: number): Promise<ProjectFile[]> => {
    const response = await api.get(`/projects/${projectId}/files`)
    return response.data
  },

  downloadFile: async (projectId: number, fileId: number, filename: string): Promise<void> => {
    const response = await api.get(`/projects/${projectId}/files/${fileId}`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  getAll: async (eventId: string): Promise<ProjectSubmission[]> => {
    const response = await api.get(`/kitchens/${encodeURIComponent(eventId)}/projects`)
    return response.data
  },

  getById: async (id: number): Promise<ProjectSubmission> => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  getByTeam: async (teamId: number): Promise<ProjectSubmission[]> => {
    const response = await api.get(`/projects/team/${teamId}`)
    return response.data
  },

  exportPdf: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },
}

// ==================== Evaluations ====================

export interface EvaluationWithAdmin {
  id: number
  project_id: number
  score: number
  notes?: string
  detailed_scores?: Record<string, number>
  is_ai_evaluation: boolean
  created_at?: string
  admin_id?: number
  admin_name?: string
  admin_weight?: number
  is_current_admin: boolean
}

export interface ProjectEvaluationsDetails {
  project_id: number
  project_title: string
  evaluations: EvaluationWithAdmin[]
  current_admin_evaluation?: EvaluationWithAdmin
  total_admin_evaluations: number
  jury_average?: number | null
  final_score?: number | null
  has_ai_evaluation: boolean
}

export const evaluationsService = {
  create: async (evaluation: Omit<Evaluation, 'id'>): Promise<Evaluation> => {
    const response = await api.post('/evaluation/admin', evaluation)
    return response.data
  },

  requestAIEvaluation: async (projectId: number): Promise<Evaluation> => {
    const response = await api.post('/evaluation/ai', { project_id: projectId })
    return response.data
  },

  getByProject: async (projectId: number): Promise<Evaluation[]> => {
    const response = await api.get(`/evaluation/project/${projectId}`)
    return response.data
  },

  getScore: async (
    projectId: number,
  ): Promise<{
    project_id: number
    stage?: 'primary' | 'final'
    jury_average: number | null
    jury_count: number
    stage_score?: number | null
    primary_average?: number | null
    final_average?: number | null
    overall_score?: number | null
    final_score: number | null
    ai_average: number | null
  }> => {
    const response = await api.get(`/evaluation/project/${projectId}/score`)
    return response.data
  },

  getProjectEvaluationsWithDetails: async (projectId: number): Promise<ProjectEvaluationsDetails> => {
    const response = await api.get(`/evaluation/project/${projectId}/details`)
    return response.data
  },
}

// ==================== Admin Management ====================

export const adminService = {
  getAll: async (): Promise<Admin[]> => {
    const response = await api.get('/admin/admins')
    return response.data
  },

  updateWeight: async (
    membershipNumber: string,
    weight: number,
  ): Promise<Admin> => {
    const response = await api.put(`/admin/admins/${encodeURIComponent(membershipNumber)}/weight`, {
      evaluation_weight: weight,
    })
    return response.data
  },

  checkSuperAdmin: async (): Promise<{ is_super_admin: boolean }> => {
    const response = await api.get('/admin/is-super-admin')
    return response.data
  },

  listVmsEvents: async (): Promise<KitchenEvent[]> => {
    const response = await api.get('/admin/vms-events')
    return response.data
  },

  enableKitchen: async (eventId: string): Promise<KitchenEvent> => {
    const response = await api.post('/admin/kitchens', { event_id: eventId })
    return response.data
  },

  disableKitchen: async (eventId: string) => {
    const response = await api.delete(`/admin/kitchens/${encodeURIComponent(eventId)}`)
    return response.data
  },
}

// ==================== Email ====================

export const emailService = {
  send: async (emails: string[], subject: string, content: string, telegramLink?: string) => {
    const response = await api.post('/email/send', {
      recipient_emails: emails,
      subject,
      content,
      telegram_link: telegramLink,
    })
    return response.data
  },
}

// ==================== Statistics ====================

export const statsService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },
}

export const iForgotService = {
  verifyMembershipNumber: async (membershipNumber: string) => {
    const response = await api.get(`/students/verify-membership-number/${membershipNumber}`)
    return response.data
  }
}

export default api
