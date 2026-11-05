import type { Environment } from "../types/env";
import type { Member, CreateMemberPayload, UpdateMemberPayload } from "../types/member";
import { mapMemberRow } from "../types/member";
import { buildUpdateQuery, toJsonText } from "../utils/sql";

const TABLE = "members";

export const listMembers = async (env: Environment): Promise<Member[]> => {
  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE}`).all();
  return (results ?? []).map(mapMemberRow);
};

export const getMember = async (env: Environment, id: string): Promise<Member | null> => {
  const { results } = await env.D1_DB
    .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
    .bind(id)
    .all();
  const row = results?.[0];
  return row ? mapMemberRow(row) : null;
};

export const createMember = async (
  env: Environment,
  payload: CreateMemberPayload
): Promise<Member> => {
  const id = payload.id ?? crypto.randomUUID();
  const cols = [
    "id",
    "ar_name",
    "en_name",
    "membership_number",
    "email",
    "phone",
    "university",
    "major",
    "year",
    "sex",
    "birthdate",
    "country",
    "city",
    "district",
    "team_ids",
    "status",
    "is_advisor",
    "is_leader",
    "skills",
    "rating",
    "comments",
  ];
  const placeholders = cols.map(() => "?").join(", ");
  const params = [
    id,
    payload.ar_name,
    payload.en_name,
    payload.membership_number,
    payload.email,
    payload.phone,
    payload.university,
    payload.major,
    payload.year,
    payload.sex,
    payload.birthdate,
    payload.country,
    payload.city,
    payload.district,
    toJsonText(payload.team_ids ?? []),
    payload.status,
    payload.is_advisor ? 1 : 0,
    payload.is_leader ? 1 : 0,
    toJsonText(payload.skills ?? []),
    payload.rating,
    toJsonText(payload.comments ?? []),
  ];

  await env.D1_DB
    .prepare(`INSERT INTO ${TABLE} (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...params)
    .run();

  const member = await getMember(env, id);
  if (!member) throw new Error("Failed to fetch created member");
  return member;
};

export const updateMember = async (
  env: Environment,
  id: string,
  payload: UpdateMemberPayload
): Promise<Member | null> => {
  const normalized: Record<string, unknown> = { ...payload };
  if (payload.team_ids !== undefined) normalized["team_ids"] = toJsonText(payload.team_ids ?? []);
  if (payload.skills !== undefined) normalized["skills"] = toJsonText(payload.skills ?? []);
  if (payload.comments !== undefined) normalized["comments"] = toJsonText(payload.comments ?? []);
  if (payload.is_advisor !== undefined) normalized["is_advisor"] = payload.is_advisor ? 1 : 0;
  if (payload.is_leader !== undefined) normalized["is_leader"] = payload.is_leader ? 1 : 0;
  const { sql, params } = buildUpdateQuery(TABLE, "id", id, normalized);
  await env.D1_DB.prepare(sql).bind(...params).run();
  return await getMember(env, id);
};

export const deleteMember = async (env: Environment, id: string): Promise<boolean> => {
  const res = await env.D1_DB.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).bind(id).run();
  return (res.success as boolean) ?? true;
};
