import { Hono } from 'hono'
import type { AppBindings, Environment } from '../types/env'
import { memberAuthMiddleware } from '../middleware/staff-auth'
import { requireEventManager } from '../middleware/event-manager'
import { canManageVmsEvent } from '../repositories/vms-event-permissions'
import { canEvaluateTeam } from '../repositories/juries'
import {
  createProject,
  getProject,
  listProjects,
  listProjectsByTeam,
} from '../repositories/projects'
import {
  MAX_PROJECT_FILE_BYTES,
  MAX_PROJECT_FILES,
  countProjectFiles,
  createProjectFileRecord,
  getProjectFile,
  listProjectFiles,
} from '../repositories/project-files'
import { findTeamForMemberInEvent, isMemberOfTeam } from '../repositories/member-teams'
import { getTeam } from '../repositories/teams'

const projectsRouter = new Hono<AppBindings>()

async function canAccessProjectFiles(
  env: Environment,
  projectId: number,
  membershipNumber: string | undefined,
  email: string | undefined,
) {
  const project = await getProject(env, projectId)
  if (!project) return { error: 'Project not found' as const, status: 404 as const }
  const team = await getTeam(env, project.team_id)
  if (!team?.event_id) return { error: 'Team/event not found' as const, status: 404 as const }

  const isManager = await canManageVmsEvent(env, team.event_id, membershipNumber)
  const isJury = await canEvaluateTeam(env, team.event_id, membershipNumber, project.team_id)
  const isTeamMember = await isMemberOfTeam(env, project.team_id, membershipNumber, email)
  if (!isManager && !isJury && !isTeamMember) {
    return { error: 'Not allowed' as const, status: 403 as const }
  }
  return { project, team }
}

projectsRouter.post('/submit', memberAuthMiddleware, async (c) => {
  const body = await c.req.json()
  if (!body.event_id) return c.json({ message: 'event_id is required' }, 400)
  const member = c.get('member')
  if (!member) return c.json({ message: 'Authenticated member required' }, 401)

  let team = await findTeamForMemberInEvent(
    c.env,
    body.event_id,
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
    if (!requested || requested.event_id !== body.event_id) {
      return c.json({ message: 'Team not found in this event kitchen' }, 404)
    }
    team = requested
  }

  const result = await createProject(c.env, {
    event_id: body.event_id,
    team_id: team.id,
    program_version_id: Number(body.program_version_id) || 1,
    stage: body.stage,
    summary: body.summary ?? body.problem_statement ?? '',
    has_attachments: false,
  })
  if (!result.ok) return c.json({ message: result.message }, result.status)
  return c.json(result.project, 201)
})

projectsRouter.get('/', memberAuthMiddleware, requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
  const projects = await listProjects(c.env, eventId)
  const withFiles = await Promise.all(
    projects.map(async (p) => ({ ...p, files: await listProjectFiles(c.env, p.id) })),
  )
  return c.json(withFiles)
})

projectsRouter.get('/stats/summary', memberAuthMiddleware, requireEventManager, async (c) => {
  const eventId = c.req.query('event_id')!
  const projects = await listProjects(c.env, eventId)
  return c.json({
    total: projects.length,
    complete: projects.filter((p) => p.is_complete).length,
    with_attachments: projects.filter((p) => p.has_attachments).length,
  })
})

projectsRouter.get('/team/:team_id', memberAuthMiddleware, async (c) => {
  const teamId = Number(c.req.param('team_id'))
  const team = await getTeam(c.env, teamId)
  if (!team) return c.json({ message: 'Team not found' }, 404)
  const member = c.get('member')
  if (!team.event_id || !(await canManageVmsEvent(c.env, team.event_id, member?.membership_number))) {
    return c.json({ message: 'Only VMS event managers can view team projects' }, 403)
  }
  const projects = await listProjectsByTeam(c.env, teamId)
  const withFiles = await Promise.all(
    projects.map(async (p) => ({ ...p, files: await listProjectFiles(c.env, p.id) })),
  )
  return c.json(withFiles)
})

projectsRouter.get('/:project_id/files', memberAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const member = c.get('member')
  const gate = await canAccessProjectFiles(
    c.env,
    projectId,
    member?.membership_number,
    member?.email,
  )
  if ('error' in gate) return c.json({ message: gate.error }, gate.status)
  return c.json(await listProjectFiles(c.env, projectId))
})

projectsRouter.post('/:project_id/files', memberAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const member = c.get('member')
  if (!member) return c.json({ message: 'Authenticated member required' }, 401)

  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const onTeam = await isMemberOfTeam(
    c.env,
    project.team_id,
    member.membership_number,
    member.email,
  )
  if (!onTeam) {
    return c.json({ message: 'Only team members can upload files for this project' }, 403)
  }

  if (!c.env.ATTACHMENTS) {
    return c.json({ message: 'File storage is not configured (ATTACHMENTS R2 binding)' }, 503)
  }

  const existingCount = await countProjectFiles(c.env, projectId)
  if (existingCount >= MAX_PROJECT_FILES) {
    return c.json({ message: `Maximum ${MAX_PROJECT_FILES} files per application` }, 400)
  }

  const form = await c.req.parseBody()
  const filePart = form.file
  if (!filePart || typeof filePart === 'string') {
    return c.json({ message: 'file is required' }, 400)
  }

  const displayName = String(form.display_name ?? form.name ?? '').trim()
  if (!displayName) {
    return c.json({ message: 'display_name is required' }, 400)
  }
  const description = String(form.description ?? '').trim() || null

  if (filePart.size <= 0) {
    return c.json({ message: 'Empty file' }, 400)
  }
  if (filePart.size > MAX_PROJECT_FILE_BYTES) {
    return c.json({ message: `Each file must be at most ${MAX_PROJECT_FILE_BYTES / (1024 * 1024)}MB` }, 400)
  }

  const storageKey = `projects/${projectId}/${crypto.randomUUID()}-${filePart.name || 'file'}`
  await c.env.ATTACHMENTS.put(storageKey, filePart.stream(), {
    httpMetadata: { contentType: filePart.type || 'application/octet-stream' },
    customMetadata: {
      display_name: displayName,
      project_id: String(projectId),
    },
  })

  try {
    const record = await createProjectFileRecord(c.env, {
      project_id: projectId,
      display_name: displayName,
      description,
      storage_key: storageKey,
      original_filename: filePart.name || null,
      content_type: filePart.type || null,
      size_bytes: filePart.size,
    })
    return c.json(record, 201)
  } catch (err) {
    await c.env.ATTACHMENTS.delete(storageKey)
    throw err
  }
})

projectsRouter.get('/:project_id/files/:file_id', memberAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const fileId = Number(c.req.param('file_id'))
  const member = c.get('member')
  const gate = await canAccessProjectFiles(
    c.env,
    projectId,
    member?.membership_number,
    member?.email,
  )
  if ('error' in gate) return c.json({ message: gate.error }, gate.status)

  const meta = await getProjectFile(c.env, fileId)
  if (!meta || meta.project_id !== projectId) {
    return c.json({ message: 'File not found' }, 404)
  }
  if (!c.env.ATTACHMENTS) {
    return c.json({ message: 'File storage is not configured' }, 503)
  }

  const obj = await c.env.ATTACHMENTS.get(meta.storage_key)
  if (!obj) return c.json({ message: 'File missing from storage' }, 404)

  const headers = new Headers()
  headers.set('Content-Type', meta.content_type || obj.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Content-Length', String(meta.size_bytes || obj.size))
  headers.set(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(meta.original_filename || meta.display_name)}"`,
  )
  return new Response(obj.body, { headers })
})

projectsRouter.get('/:project_id', memberAuthMiddleware, async (c) => {
  const projectId = Number(c.req.param('project_id'))
  const project = await getProject(c.env, projectId)
  if (!project) return c.json({ message: 'Project not found' }, 404)

  const team = await getTeam(c.env, project.team_id)
  const member = c.get('member')
  const gate = await canAccessProjectFiles(
    c.env,
    projectId,
    member?.membership_number,
    member?.email,
  )
  if ('error' in gate) {
    // managers-only was previous behavior; keep managers + jury + team
    return c.json({ message: gate.error }, gate.status)
  }
  const files = await listProjectFiles(c.env, projectId)
  return c.json({ ...project, team, files })
})

export default projectsRouter
