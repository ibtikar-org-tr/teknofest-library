import type { Environment } from '../types/env'
import { getVmsEvent, listVmsEvents } from './vms-events'
import type { VmsEventSummary } from '../types/models'

const MAX_PROJECT_ANCESTOR_DEPTH = 20

type ProjectRow = {
  id: string
  owner: string
  parent_project_id: string | null
}

async function getProject(env: Environment, projectId: string): Promise<ProjectRow | null> {
  return (
    (await env.VMS_DB.prepare(
      `SELECT id, owner, parent_project_id FROM projects WHERE id = ? LIMIT 1`,
    )
      .bind(projectId)
      .first<ProjectRow>()) ?? null
  )
}

async function getProjectMemberRole(
  env: Environment,
  projectId: string,
  membershipNumber: string,
): Promise<string | null> {
  const row = await env.VMS_DB.prepare(
    `SELECT role FROM project_members
     WHERE project_id = ? AND membership_number = ?
     LIMIT 1`,
  )
    .bind(projectId, membershipNumber)
    .first<{ role: string }>()
  return row?.role ?? null
}

async function canManageProject(
  env: Environment,
  projectId: string,
  membershipNumber: string,
): Promise<boolean> {
  const project = await getProject(env, projectId)
  if (!project) return false
  if (project.owner === membershipNumber) return true
  const role = await getProjectMemberRole(env, projectId, membershipNumber)
  return role === 'owner' || role === 'manager'
}

async function isEventAdmin(
  env: Environment,
  eventId: string,
  membershipNumber: string,
): Promise<boolean> {
  try {
    const row = await env.VMS_DB.prepare(
      `SELECT membership_number FROM event_admins
       WHERE event_id = ? AND membership_number = ?
       LIMIT 1`,
    )
      .bind(eventId, membershipNumber)
      .first()
    return Boolean(row)
  } catch {
    // Older local DBs may not have event_admins yet.
    return false
  }
}

/** Mirrors VMS canManageEvent: creator, event_admins, or project owner/manager (ancestors). */
export async function canManageVmsEvent(
  env: Environment,
  eventId: string,
  membershipNumber: string | null | undefined,
): Promise<boolean> {
  if (!membershipNumber?.trim()) return false
  const membership = membershipNumber.trim()

  const event = await getVmsEvent(env, eventId)
  if (!event) return false

  if (event.created_by === membership) return true
  if (await isEventAdmin(env, eventId, membership)) return true

  let projectId = event.project_id
  const seen = new Set<string>()
  for (let depth = 0; projectId && depth < MAX_PROJECT_ANCESTOR_DEPTH; depth += 1) {
    if (seen.has(projectId)) break
    seen.add(projectId)

    if (await canManageProject(env, projectId, membership)) return true

    const project = await getProject(env, projectId)
    projectId = project?.parent_project_id ?? null
  }

  return false
}

export async function memberManagesAnyEvent(
  env: Environment,
  membershipNumber: string,
): Promise<boolean> {
  const membership = membershipNumber.trim()
  if (!membership) return false

  const created = await env.VMS_DB.prepare(
    `SELECT id FROM events WHERE created_by = ? LIMIT 1`,
  )
    .bind(membership)
    .first()
  if (created) return true

  try {
    const admin = await env.VMS_DB.prepare(
      `SELECT event_id FROM event_admins WHERE membership_number = ? LIMIT 1`,
    )
      .bind(membership)
      .first()
    if (admin) return true
  } catch {
    // ignore missing table
  }

  const managedProjects = await env.VMS_DB.prepare(
    `SELECT id FROM projects
     WHERE owner = ?
        OR id IN (
          SELECT project_id FROM project_members
          WHERE membership_number = ? AND role IN ('owner', 'manager')
        )
     LIMIT 1`,
  )
    .bind(membership, membership)
    .first()
  if (!managedProjects) return false

  // At least one manageable project exists — check if any event points at those projects
  // (including ancestors would require graph walk; fall back to full filter for accuracy).
  const events = await listVmsEvents(env)
  for (const event of events) {
    if (await canManageVmsEvent(env, event.id, membership)) return true
  }
  return false
}

export async function listManagedVmsEvents(
  env: Environment,
  membershipNumber: string,
): Promise<VmsEventSummary[]> {
  const membership = membershipNumber.trim()
  if (!membership) return []

  const events = await listVmsEvents(env)
  const managed: VmsEventSummary[] = []
  for (const event of events) {
    if (await canManageVmsEvent(env, event.id, membership)) {
      managed.push(event)
    }
  }
  return managed
}
