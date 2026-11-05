import type { Environment } from "../types/env";
import type { Team, CreateTeamPayload, UpdateTeamPayload } from "../types/team";
import { mapTeamRow } from "../types/team";
import { buildUpdateQuery, toJsonText } from "../utils/sql";

const TABLE = "teams";

export const listTeams = async (env: Environment): Promise<Team[]> => {
  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE}`).all();
  return (results ?? []).map(mapTeamRow);
};

export const getTeam = async (env: Environment, id: string): Promise<Team | null> => {
  const { results } = await env.D1_DB
    .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
    .bind(id)
    .all();
  const row = results?.[0];
  return row ? mapTeamRow(row) : null;
};

export const createTeam = async (
  env: Environment,
  payload: CreateTeamPayload
): Promise<Team> => {
  const id = payload.id ?? crypto.randomUUID();
  const cols = [
    "id",
    "name",
    "description",
    "stage",
    "institution_name",
    "member_count",
    "tap_members",
    "members_list",
    "leader",
    "competition_id",
    "years",
    "status",
    "rank",
    "relation",
    "intro_file_path",
    "team_link",
  ];
  const placeholders = cols.map(() => "?").join(", ");
  const params = [
    id,
    payload.name,
    payload.description ?? null,
    payload.stage ?? null,
    payload.institution_name ?? null,
    payload.member_count ?? null,
    toJsonText(payload.tap_members ?? []),
    toJsonText(payload.members_list ?? []),
    payload.leader ?? null,
    payload.competition_id,
    toJsonText(payload.years ?? []),
    payload.status ?? null,
    payload.rank ?? null,
    payload.relation ?? null,
    payload.intro_file_path ?? null,
    payload.team_link ?? null,
  ];

  await env.D1_DB
    .prepare(`INSERT INTO ${TABLE} (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...params)
    .run();

  const team = await getTeam(env, id);
  if (!team) throw new Error("Failed to fetch created team");
  return team;
};

export const updateTeam = async (
  env: Environment,
  id: string,
  payload: UpdateTeamPayload
): Promise<Team | null> => {
  const normalized: Record<string, unknown> = { ...payload };
  if (payload.tap_members !== undefined) normalized["tap_members"] = toJsonText(payload.tap_members ?? []);
  if (payload.members_list !== undefined) normalized["members_list"] = toJsonText(payload.members_list ?? []);
  if (payload.years !== undefined) normalized["years"] = toJsonText(payload.years ?? []);
  const { sql, params } = buildUpdateQuery(TABLE, "id", id, normalized);
  await env.D1_DB.prepare(sql).bind(...params).run();
  return await getTeam(env, id);
};

export const deleteTeam = async (env: Environment, id: string): Promise<boolean> => {
  const res = await env.D1_DB.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).bind(id).run();
  return (res.success as boolean) ?? true;
};
