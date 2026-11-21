import { Hono } from 'hono'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { requireEventKitchenAccess } from '../middleware/event-access'
import { createIndividual, listIndividuals } from '../repositories/individuals'
import { createProject, listProjects, listProjectsByTeam } from '../repositories/projects'
import { listProjectFiles } from '../repositories/project-files'
import { getEventKitchen, listEventKitchens } from '../repositories/event-kitchens'
import {
  addEventJury,
  isEventJury,
  listAssignedTeamsForJury,
  listEventJuries,
  removeEventJury,
  setJuryTeamAssignments,
} from '../repositories/juries'
import { findTeamForMemberInEvent, isMemberOfTeam } from '../repositories/member-teams'
import {
  addMemberToTeam,
  createTeam,
  getTeam,
  moveMemberToTeam,
  removeMemberFromTeam,
  setTeamCompetition,
  teamHasPrimarySubmission,
  listPublicLeaderboard,
  listTeams,
} from '../repositories/teams'
import {
  acceptProjectStageScore,
  listAdminTeamsOverview,
} from '../repositories/admin-team-overview'
import { listLibraryCompetitionFields } from '../repositories/library-competitions'
import {
  enrichIndividualsWithCompetitionLabels,
  enrichProjectsWithCompetitionLabels,
  enrichTeamsWithCompetitionLabels,
  getKitchenCompetitionSettings,
  isCompetitionAllowedForKitchen,
  listKitchenCompetitionFields,
  listKitchenCompetitionIds,
  resolveCompetitionLabel,
  setKitchenCompetitionSettings,
} from '../repositories/kitchen-competitions'
import { fetchVmsMemberProfile } from '../repositories/vms-member-profile'
import { canManageVmsEvent } from '../repositories/vms-event-permissions'
import {
  getVmsEvent,
  getVmsEventsByIds,
  isMemberRegisteredForEvent,
  listEventRegistrants,
} from '../repositories/vms-events'
import type { AppBindings, Environment, KitchenMember } from '../types/env'
import type { KitchenEventView } from '../types/models'

const kitchensRouter = new Hono<AppBindings>()

async function buildKitchenViews(
  env: Environment,
  kitchens: Awaited<ReturnType<typeof listEventKitchens>>,
  member: KitchenMember | undefined,
): Promise<KitchenEventView[]> {
  const events = await getVmsEventsByIds(
    env,
    kitchens.map((k) => k.event_id),
  )
  const byId = new Map(events.map((e) => [e.id, e]))

  const views: KitchenEventView[] = []
  for (const kitchen of kitchens) {
    const event = byId.get(kitchen.event_id)
    if (!event) continue

    let canManage = false
    let canAccess = false
    let isJury = false
    if (member) {
      canManage = await canManageVmsEvent(env, kitchen.event_id, member.membership_number)
      isJury = await isEventJury(env, kitchen.event_id, member.membership_number)
      canAccess =
        canManage ||
        isJury ||
        (await isMemberRegisteredForEvent(env, kitchen.event_id, member.membership_number))
    }

    views.push({
      ...event,
      kitchen_enabled: kitchen.enabled,
      kitchen,
      can_access: canAccess,
      can_manage: canManage,
      is_jury: isJury,
    })
  }
  return views
}

const withEventAccess = [memberAuthMiddleware, requireEventKitchenAccess] as const

/**
 * Public leaderboard — no auth.
 * `teams`: all active teams (name + member count).
 * `primary` / `final`: ranked scores only after admin acceptance for that stage.
 */
kitchensRouter.get('/:eventId/leaderboard', async (c) => {
  const eventId = c.req.param('eventId')
  const kitchen = await getEventKitchen(c.env, eventId)
  if (!kitchen?.enabled) {
    return c.json({ message: 'Kitchen not available for this event' }, 404)
  }
  const board = await listPublicLeaderboard(c.env, eventId)
  return c.json({ event_id: eventId, ...board })
})

/** Enabled kitchens (registered members + VMS event managers). */
kitchensRouter.get('/', memberAuthMiddleware, async (c) => {
  const kitchens = await listEventKitchens(c.env, { enabledOnly: true })
  const views = await buildKitchenViews(c.env, kitchens, c.get('member'))
  return c.json(views.filter((v) => v.can_access))
})

/**
 * Competitions + interest rules for this kitchen.
 * `registration_open` is false until the admin saves allowlist + min/max.
 */
kitchensRouter.get('/:eventId/fields', ...withEventAccess, async (c) => {
  try {
    return c.json(await getKitchenCompetitionSettings(c.env, c.req.param('eventId')))
  } catch (error) {
    console.error('Failed to load kitchen competitions', error)
    return c.json({ message: 'Could not load competitions from library' }, 502)
  }
})

/** Full library catalog + kitchen selection + interest rules (managers only). */
kitchensRouter.get('/:eventId/competitions/catalog', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can view the competition catalog' }, 403)
  }
  try {
    const [catalog, selectedIds, settings] = await Promise.all([
      listLibraryCompetitionFields(c.env),
      listKitchenCompetitionIds(c.env, eventId),
      getKitchenCompetitionSettings(c.env, eventId),
    ])
    const selected = new Set(selectedIds)
    return c.json({
      event_id: eventId,
      selected_ids: selectedIds,
      interest_min: settings.interest_min,
      interest_max: settings.interest_max,
      registration_open: settings.registration_open,
      competitions: catalog.map((row) => ({
        ...row,
        selected: selected.has(row.id),
      })),
    })
  } catch (error) {
    console.error('Failed to load competition catalog', error)
    return c.json({ message: 'Could not load competitions from library' }, 502)
  }
})

/**
 * Replace allowlist + interest min/max (managers only).
 * Body: `{ competition_ids: number[], interest_min: number, interest_max: number }`
 */
kitchensRouter.put('/:eventId/competitions', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can set kitchen competitions' }, 403)
  }

  const body = await c.req.json<{
    competition_ids?: unknown
    interest_min?: unknown
    interest_max?: unknown
  }>()
  const raw = body.competition_ids
  if (!Array.isArray(raw)) {
    return c.json({ message: 'competition_ids must be an array' }, 400)
  }
  const ids = raw.map((v) => Number(v))
  const interestMin = Number(body.interest_min)
  const interestMax = Number(body.interest_max)

  try {
    const result = await setKitchenCompetitionSettings(
      c.env,
      eventId,
      ids,
      interestMin,
      interestMax,
    )
    if (!result.ok) return c.json({ message: result.message }, 400)
    const settings = await getKitchenCompetitionSettings(c.env, eventId)
    return c.json({
      event_id: eventId,
      competition_ids: result.competition_ids,
      interest_min: result.interest_min,
      interest_max: result.interest_max,
      registration_open: settings.registration_open,
      competitions: settings.competitions,
    })
  } catch (error) {
    console.error('Failed to save kitchen competitions', error)
    return c.json({ message: 'Could not validate competitions against library' }, 502)
  }
})

async function requireRegistrationOpen(env: Environment, eventId: string) {
  const settings = await getKitchenCompetitionSettings(env, eventId)
  if (!settings.registration_open) {
    return {
      ok: false as const,
      message:
        'Kitchen registration is closed until the event manager sets available competitions and interest min/max',
    }
  }
  return { ok: true as const, settings }
}

/** Snapshot of the caller's VMS identity + skills/interests (read-only; edit on VMS /profile). */
kitchensRouter.get('/:eventId/my-vms-profile', ...withEventAccess, async (c) => {
  const member = c.get('member')
  if (!member?.membership_number) {
    return c.json({ message: 'Authenticated VMS member required' }, 401)
  }

  const profile = await fetchVmsMemberProfile(
    c.env,
    member.membership_number,
    c.req.header('Authorization'),
  )
  if (!profile) {
    return c.json(
      { message: 'Could not load your VMS profile — re-login and try again' },
      502,
    )
  }

  return c.json(profile)
})

kitchensRouter.post('/:eventId/teams', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const member = c.get('member')
  const sessionEmail = member?.email?.trim().toLowerCase()
  const sessionMembership = member?.membership_number?.trim()

  const registration = await requireRegistrationOpen(c.env, eventId)
  if (!registration.ok) return c.json({ message: registration.message }, 403)

  if (sessionMembership && (await isEventJury(c.env, eventId, sessionMembership))) {
    return c.json({ message: 'Juries cannot create or join teams' }, 403)
  }

  // Members cannot leave a team themselves — also cannot create another while already on one.
  const alreadyOnTeam = await findTeamForMemberInEvent(
    c.env,
    eventId,
    sessionMembership,
    sessionEmail,
  )
  if (alreadyOnTeam) {
    return c.json(
      {
        message:
          'You are already on a team in this event. Only an event manager can move you.',
        team_id: alreadyOnTeam.id,
      },
      409,
    )
  }

  const members = Array.isArray(body.members)
    ? body.members.map(
        (m: {
          full_name?: string
          email?: string
          phone?: string
          is_leader?: boolean
          membership_number?: string | null
        }) => {
          const membershipNumber = m.membership_number?.trim() || null
          const isSubmitter =
            Boolean(sessionMembership) && membershipNumber === sessionMembership
          return {
            ...m,
            membership_number: membershipNumber,
            email: isSubmitter && sessionEmail ? sessionEmail : String(m.email ?? '').trim(),
          }
        },
      )
    : body.members

  for (const m of members ?? []) {
    if (!m.email) {
      return c.json(
        { message: 'Each team member needs a verified membership email (session or lookup)' },
        400,
      )
    }
    const onTeam = await findTeamForMemberInEvent(
      c.env,
      eventId,
      m.membership_number ?? undefined,
      m.email,
    )
    if (onTeam) {
      return c.json(
        {
          message: `${m.full_name || m.email} is already on a team. Only an event manager can move them.`,
          team_id: onTeam.id,
        },
        409,
      )
    }
  }

  // Competition is chosen later via PUT …/my-team/competition (locked after primary).
  const team = await createTeam(c.env, { ...body, field: '', members, event_id: eventId })
  return c.json(team, 201)
})

kitchensRouter.post('/:eventId/individuals', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const member = c.get('member')
  if (!member?.membership_number || !member.email) {
    return c.json({ message: 'Authenticated VMS member required' }, 401)
  }

  const registration = await requireRegistrationOpen(c.env, eventId)
  if (!registration.ok) return c.json({ message: registration.message }, 403)

  if (await isEventJury(c.env, eventId, member.membership_number)) {
    return c.json({ message: 'Juries cannot enter the team pool' }, 403)
  }

  const alreadyOnTeam = await findTeamForMemberInEvent(
    c.env,
    eventId,
    member.membership_number,
    member.email,
  )
  if (alreadyOnTeam) {
    return c.json(
      {
        message:
          'You are already on a team. Members cannot leave or switch — ask an event manager.',
        team_id: alreadyOnTeam.id,
      },
      409,
    )
  }

  const profile = await fetchVmsMemberProfile(
    c.env,
    member.membership_number,
    c.req.header('Authorization'),
  )
  if (!profile) {
    return c.json(
      { message: 'Could not load your VMS profile — re-login and try again' },
      502,
    )
  }

  const { interest_min: min, interest_max: max } = registration.settings
  const rawIds = Array.isArray(body.preferred_competition_ids)
    ? body.preferred_competition_ids
    : body.preferred_field != null
      ? [body.preferred_field]
      : []
  const preferredIds = [
    ...new Set(
      rawIds
        .map((v: unknown) => Number(v))
        .filter((id: number) => Number.isFinite(id) && id > 0),
    ),
  ]
  if (preferredIds.length < (min ?? 1) || preferredIds.length > (max ?? preferredIds.length)) {
    return c.json(
      {
        message: `Select between ${min} and ${max} competitions you are interested in`,
      },
      400,
    )
  }
  for (const id of preferredIds) {
    if (!(await isCompetitionAllowedForKitchen(c.env, eventId, id))) {
      return c.json(
        { message: `Competition ${id} is not available in this kitchen` },
        400,
      )
    }
  }

  const individual = await createIndividual(c.env, {
    ...body,
    preferred_field: String(preferredIds[0]),
    preferred_competition_ids: preferredIds,
    event_id: eventId,
    email: member.email || profile.email,
    membership_number: member.membership_number,
    full_name: profile.full_name,
    phone: profile.phone,
    gender: profile.gender,
    // Skills/interests always from VMS — Kitchen never writes members DB.
    technical_skills: profile.technical_skills || null,
    interests: profile.interests || null,
  })
  return c.json(individual, 201)
})

kitchensRouter.get('/:eventId/teams-with-space', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const teams = await listTeams(c.env, eventId)
  const withSpace = []
  for (const team of teams) {
    if (!team.is_active) continue
    const full = await getTeam(c.env, team.id)
    const memberCount = full?.members?.length ?? 0
    if (memberCount >= 6) continue
    withSpace.push({
      id: team.id,
      team_name: team.team_name,
      gender: team.gender,
      field: team.field,
      event_id: team.event_id,
      member_count: memberCount,
      available_slots: 6 - memberCount,
      members: (full?.members ?? []).map((m) => ({
        id: m.id,
        full_name: m.full_name,
        email: m.email,
        is_leader: m.is_leader,
      })),
    })
  }
  const enriched = await enrichTeamsWithCompetitionLabels(c.env, withSpace)
  return c.json(enriched)
})

/** Member self-join into an existing team that still has space. */
kitchensRouter.post('/:eventId/teams/:teamId/join', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const teamId = Number(c.req.param('teamId'))
  const member = c.get('member')
  if (!member?.membership_number || !member.email) {
    return c.json({ message: 'Authenticated VMS member required' }, 401)
  }

  const registration = await requireRegistrationOpen(c.env, eventId)
  if (!registration.ok) return c.json({ message: registration.message }, 403)

  if (!Number.isFinite(teamId) || teamId <= 0) {
    return c.json({ message: 'Invalid team id' }, 400)
  }

  if (await isEventJury(c.env, eventId, member.membership_number)) {
    return c.json({ message: 'Juries cannot create or join teams' }, 403)
  }

  const existing = await findTeamForMemberInEvent(
    c.env,
    eventId,
    member.membership_number,
    member.email,
  )
  if (existing) {
    return c.json(
      {
        message:
          'You are already on a team. Members cannot leave or switch teams — ask an event manager.',
        team_id: existing.id,
      },
      409,
    )
  }

  const team = await getTeam(c.env, teamId)
  if (!team || team.event_id !== eventId || !team.is_active) {
    return c.json({ message: 'Team not found in this event kitchen' }, 404)
  }

  const memberCount = team.members?.length ?? 0
  if (memberCount >= 6) {
    return c.json({ message: 'This team is full' }, 409)
  }

  const profile = await fetchVmsMemberProfile(
    c.env,
    member.membership_number,
    c.req.header('Authorization'),
  )
  if (!profile) {
    return c.json(
      { message: 'Could not load your VMS profile — re-login and try again' },
      502,
    )
  }

  if (team.gender && profile.gender && team.gender !== profile.gender) {
    return c.json(
      { message: 'Your gender does not match this team' },
      400,
    )
  }

  await addMemberToTeam(c.env, teamId, {
    full_name: profile.full_name,
    email: member.email || profile.email,
    phone: profile.phone,
    membership_number: member.membership_number,
    is_leader: false,
  })

  const updated = await getTeam(c.env, teamId)
  return c.json(updated, 201)
})

/** Manager-only: remove a member from a team (members cannot leave themselves). */
kitchensRouter.delete(
  '/:eventId/teams/:teamId/members/:memberId',
  ...withEventAccess,
  async (c) => {
    const eventId = c.req.param('eventId')
    const teamId = Number(c.req.param('teamId'))
    const memberId = Number(c.req.param('memberId'))
    const member = c.get('member')
    if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
      return c.json({ message: 'Only VMS event managers can remove team members' }, 403)
    }
    if (!Number.isFinite(teamId) || !Number.isFinite(memberId)) {
      return c.json({ message: 'Invalid team or member id' }, 400)
    }
    const result = await removeMemberFromTeam(c.env, eventId, teamId, memberId)
    if (!result.ok) return c.json({ message: result.message }, result.status)
    return c.json(result.team)
  },
)

/** Manager-only: move a member to another team in this event. */
kitchensRouter.post('/:eventId/members/:memberId/move', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const memberId = Number(c.req.param('memberId'))
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can move team members' }, 403)
  }
  if (!Number.isFinite(memberId) || memberId <= 0) {
    return c.json({ message: 'Invalid member id' }, 400)
  }
  const body = await c.req.json<{ to_team_id?: number }>()
  const toTeamId = Number(body.to_team_id)
  if (!Number.isFinite(toTeamId) || toTeamId <= 0) {
    return c.json({ message: 'to_team_id is required' }, 400)
  }
  const result = await moveMemberToTeam(c.env, eventId, memberId, toTeamId)
  if (!result.ok) return c.json({ message: result.message }, result.status)
  return c.json(result)
})

/** Current member's team in this event kitchen (for gating project apply). */
kitchensRouter.get('/:eventId/my-team', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  const team = await findTeamForMemberInEvent(
    c.env,
    eventId,
    member?.membership_number,
    member?.email,
  )
  if (!team) {
    return c.json({ message: 'You are not on a team in this event kitchen' }, 404)
  }
  const competition_locked = await teamHasPrimarySubmission(c.env, team.id)
  const field_label = await resolveCompetitionLabel(c.env, team.field)
  return c.json({ ...team, competition_locked, field_label: field_label ?? team.field })
})

/**
 * Choose / change competition (FE step 1).
 * Body: `{ competition_id }` (preferred) or legacy `{ field }` as id string.
 * Must be on the kitchen allowlist. Allowed until primary is submitted (409 after).
 */
kitchensRouter.put('/:eventId/my-team/competition', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  const body = await c.req.json<{ competition_id?: number | string; field?: string }>()
  const team = await findTeamForMemberInEvent(
    c.env,
    eventId,
    member?.membership_number,
    member?.email,
  )
  if (!team) {
    return c.json({ message: 'You are not on a team in this event kitchen' }, 404)
  }

  const raw = body.competition_id ?? body.field
  const competitionId = Number(raw)
  if (!Number.isFinite(competitionId) || competitionId <= 0) {
    return c.json({ message: 'competition_id is required' }, 400)
  }
  if (!(await isCompetitionAllowedForKitchen(c.env, eventId, competitionId))) {
    return c.json(
      { message: 'This competition is not available in this kitchen' },
      400,
    )
  }

  const result = await setTeamCompetition(c.env, team.id, competitionId)
  if (!result.ok) return c.json({ message: result.message }, result.status)
  const field_label = await resolveCompetitionLabel(c.env, result.team.field)
  return c.json({
    ...result.team,
    competition_locked: false,
    field_label: field_label ?? result.team.field,
  })
})

kitchensRouter.post('/:eventId/projects', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const body = await c.req.json()
  const member = c.get('member')
  if (!member) {
    return c.json({ message: 'Authenticated member required' }, 401)
  }

  // Projects are team-only: resolve or validate the caller's team membership.
  let team = await findTeamForMemberInEvent(
    c.env,
    eventId,
    member.membership_number,
    member.email,
  )
  if (!team) {
    return c.json(
      { message: 'Only teams can submit projects. Join or create a team first.' },
      403,
    )
  }

  const requestedTeamId = Number(body.team_id)
  if (Number.isFinite(requestedTeamId) && requestedTeamId > 0 && requestedTeamId !== team.id) {
    const onRequested = await isMemberOfTeam(
      c.env,
      requestedTeamId,
      member.membership_number,
      member.email,
    )
    if (!onRequested) {
      return c.json({ message: 'You can only submit a project for your own team' }, 403)
    }
    const requested = await getTeam(c.env, requestedTeamId)
    if (!requested || requested.event_id !== eventId) {
      return c.json({ message: 'Team not found in this event kitchen' }, 404)
    }
    team = requested
  }

  const programVersionId = Number(body.program_version_id) || 1
  const result = await createProject(c.env, {
    event_id: eventId,
    team_id: team.id,
    program_version_id: programVersionId,
    stage: body.stage,
    summary: body.summary ?? body.problem_statement ?? '',
    has_attachments: false,
  })
  if (!result.ok) return c.json({ message: result.message }, result.status)
  return c.json(result.project, 201)
})

/** Caller's team applications (primary / final) for this event. */
kitchensRouter.get('/:eventId/my-projects', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  const team = await findTeamForMemberInEvent(
    c.env,
    eventId,
    member?.membership_number,
    member?.email,
  )
  if (!team) {
    return c.json({ message: 'You are not on a team in this event kitchen' }, 404)
  }
  const projects = await listProjectsByTeam(c.env, team.id)
  return c.json({ team_id: team.id, projects })
})

kitchensRouter.get('/:eventId/teams', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can list teams' }, 403)
  }
  // Rich overview: members, stages, jury scores/notes, accept readiness.
  return c.json(await listAdminTeamsOverview(c.env, eventId))
})

/** Accept a stage's jury average for the public leaderboard (managers only). */
kitchensRouter.post(
  '/:eventId/projects/:projectId/accept-score',
  ...withEventAccess,
  async (c) => {
    const eventId = c.req.param('eventId')
    const projectId = Number(c.req.param('projectId'))
    const member = c.get('member')
    if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
      return c.json({ message: 'Only VMS event managers can accept stage scores' }, 403)
    }
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return c.json({ message: 'Invalid project id' }, 400)
    }
    const result = await acceptProjectStageScore(
      c.env,
      eventId,
      projectId,
      member!.membership_number,
    )
    if (!result.ok) return c.json({ message: result.message }, result.status)
    return c.json(result)
  },
)

kitchensRouter.get('/:eventId/individuals', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can list individuals' }, 403)
  }
  const unassignedOnly = c.req.query('unassigned_only') === 'true'
  const individuals = await listIndividuals(c.env, eventId)
  const filtered = unassignedOnly
    ? individuals.filter((i) => !i.is_assigned)
    : individuals
  return c.json(await enrichIndividualsWithCompetitionLabels(c.env, filtered))
})

kitchensRouter.get('/:eventId/projects', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can list projects' }, 403)
  }
  const projects = await listProjects(c.env, eventId)
  const withFiles = await Promise.all(
    projects.map(async (p) => ({ ...p, files: await listProjectFiles(c.env, p.id) })),
  )
  return c.json(await enrichProjectsWithCompetitionLabels(c.env, withFiles))
})

kitchensRouter.get('/:eventId/stats', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await canManageVmsEvent(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can view stats' }, 403)
  }
  const [teams, individuals, projects] = await Promise.all([
    listTeams(c.env, eventId),
    listIndividuals(c.env, eventId),
    listProjects(c.env, eventId),
  ])
  return c.json({
    teams_count: teams.length,
    individuals_count: individuals.length,
    assigned_individuals: individuals.filter((i) => i.is_assigned).length,
    projects_count: projects.length,
  })
})

async function requireEventManager(
  env: Environment,
  eventId: string,
  membershipNumber: string | undefined,
) {
  if (!(await canManageVmsEvent(env, eventId, membershipNumber))) {
    return false
  }
  return true
}

kitchensRouter.get('/:eventId/registrants', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await requireEventManager(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can list registrants' }, 403)
  }
  return c.json(await listEventRegistrants(c.env, eventId))
})

kitchensRouter.get('/:eventId/juries', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await requireEventManager(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can list juries' }, 403)
  }
  return c.json(await listEventJuries(c.env, eventId))
})

kitchensRouter.post('/:eventId/juries', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!(await requireEventManager(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can appoint juries' }, 403)
  }

  const body = await c.req.json<{
    membership_number?: string
    full_name?: string
    email?: string
  }>()
  const membershipNumber = body.membership_number?.trim()
  if (!membershipNumber) {
    return c.json({ message: 'membership_number is required' }, 400)
  }

  if (!(await isMemberRegisteredForEvent(c.env, eventId, membershipNumber))) {
    return c.json({ message: 'Jury must be a registered VMS member for this event' }, 400)
  }

  let fullName = body.full_name?.trim() || null
  let email = body.email?.trim() || null
  if (!fullName || !email) {
    const registrants = await listEventRegistrants(c.env, eventId)
    const match = registrants.find((r) => r.membership_number === membershipNumber)
    fullName = fullName || match?.full_name || membershipNumber
    email = email || match?.email || null
  }

  const onTeam = await findTeamForMemberInEvent(
    c.env,
    eventId,
    membershipNumber,
    email ?? undefined,
  )
  if (onTeam) {
    return c.json(
      {
        message: 'Cannot appoint a team member as jury — remove them from teams first',
        team_id: onTeam.id,
      },
      409,
    )
  }

  const jury = await addEventJury(c.env, {
    event_id: eventId,
    membership_number: membershipNumber,
    full_name: fullName,
    email,
    created_by: member?.membership_number ?? null,
  })
  return c.json(jury, 201)
})

kitchensRouter.delete('/:eventId/juries/:membershipNumber', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const membershipNumber = decodeURIComponent(c.req.param('membershipNumber'))
  const member = c.get('member')
  if (!(await requireEventManager(c.env, eventId, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can remove juries' }, 403)
  }
  const removed = await removeEventJury(c.env, eventId, membershipNumber)
  if (!removed) return c.json({ message: 'Jury not found' }, 404)
  return c.json({ message: 'Jury removed' })
})

kitchensRouter.get(
  '/:eventId/juries/:membershipNumber/teams',
  ...withEventAccess,
  async (c) => {
    const eventId = c.req.param('eventId')
    const membershipNumber = decodeURIComponent(c.req.param('membershipNumber'))
    const member = c.get('member')
    if (!(await requireEventManager(c.env, eventId, member?.membership_number))) {
      return c.json({ message: 'Only VMS event managers can view jury assignments' }, 403)
    }
    if (!(await isEventJury(c.env, eventId, membershipNumber))) {
      return c.json({ message: 'Jury not found' }, 404)
    }
    const teams = await listAssignedTeamsForJury(c.env, eventId, membershipNumber)
    return c.json({ membership_number: membershipNumber, teams, team_ids: teams.map((t) => t.team_id) })
  },
)

kitchensRouter.put(
  '/:eventId/juries/:membershipNumber/teams',
  ...withEventAccess,
  async (c) => {
    const eventId = c.req.param('eventId')
    const membershipNumber = decodeURIComponent(c.req.param('membershipNumber'))
    const member = c.get('member')
    if (!(await requireEventManager(c.env, eventId, member?.membership_number))) {
      return c.json({ message: 'Only VMS event managers can assign jury teams' }, 403)
    }
    if (!(await isEventJury(c.env, eventId, membershipNumber))) {
      return c.json({ message: 'Jury not found' }, 404)
    }

    const body = await c.req.json<{ team_ids?: number[] }>()
    const teamIds = Array.isArray(body.team_ids) ? body.team_ids.map(Number) : []
    const eventTeams = await listTeams(c.env, eventId)
    const validIds = new Set(eventTeams.map((t) => t.id))
    const filtered = teamIds.filter((id) => validIds.has(id))

    const saved = await setJuryTeamAssignments(
      c.env,
      eventId,
      membershipNumber,
      filtered,
      member?.membership_number ?? null,
    )
    return c.json({ membership_number: membershipNumber, team_ids: saved })
  },
)

/** Jury-facing: assigned teams and their projects. */
kitchensRouter.get('/:eventId/my-jury-assignments', ...withEventAccess, async (c) => {
  const eventId = c.req.param('eventId')
  const member = c.get('member')
  if (!member?.membership_number) {
    return c.json({ message: 'Authenticated VMS member required' }, 401)
  }
  if (!(await isEventJury(c.env, eventId, member.membership_number))) {
    return c.json({ message: 'You are not a jury for this event' }, 403)
  }

  const teams = await listAssignedTeamsForJury(c.env, eventId, member.membership_number)
  const items = []
  for (const team of teams) {
    const projects = await listProjectsByTeam(c.env, team.team_id)
    const withFiles = await Promise.all(
      projects.map(async (p) => ({ ...p, files: await listProjectFiles(c.env, p.id) })),
    )
    const enriched = await enrichProjectsWithCompetitionLabels(c.env, withFiles)
    items.push({
      team_id: team.team_id,
      team_name: team.team_name,
      projects: enriched,
    })
  }
  return c.json({ event_id: eventId, assignments: items })
})

kitchensRouter.get('/:eventId', memberAuthMiddleware, async (c) => {
  const eventId = c.req.param('eventId')
  const kitchen = await getEventKitchen(c.env, eventId)
  if (!kitchen?.enabled) {
    return c.json({ message: 'Kitchen not available for this event' }, 404)
  }

  const event = await getVmsEvent(c.env, eventId)
  if (!event) return c.json({ message: 'Event not found in VMS' }, 404)

  const member = c.get('member')
  const canManage = await canManageVmsEvent(c.env, eventId, member?.membership_number)
  const isJury = member
    ? await isEventJury(c.env, eventId, member.membership_number)
    : false
  const canAccess =
    canManage ||
    isJury ||
    (member
      ? await isMemberRegisteredForEvent(c.env, eventId, member.membership_number)
      : false)
  if (!canAccess) {
    return c.json(
      { message: 'You must be registered for this VMS event to enter its kitchen' },
      403,
    )
  }

  const view: KitchenEventView = {
    ...event,
    kitchen_enabled: true,
    kitchen,
    can_access: true,
    can_manage: canManage,
    is_jury: isJury,
  }
  return c.json(view)
})

export default kitchensRouter
