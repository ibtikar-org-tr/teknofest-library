import type { Environment } from "../types/env";
import type {
  Competition,
  CreateCompetitionPayload,
  UpdateCompetitionPayload,
} from "../types/competition";
import { mapCompetitionRow } from "../types/competition";
import { buildUpdateQuery, toJsonText } from "../utils/sql";

const TABLE = "competitions";

export const listCompetitions = async (env: Environment): Promise<Competition[]> => {
  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE}`).all();
  return (results ?? []).map(mapCompetitionRow);
};

export const getCompetition = async (
  env: Environment,
  id: number
): Promise<Competition | null> => {
  const { results } = await env.D1_DB
    .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
    .bind(id)
    .all();
  const row = results?.[0];
  return row ? mapCompetitionRow(row) : null;
};

export const createCompetition = async (
  env: Environment,
  payload: CreateCompetitionPayload
): Promise<Competition> => {
  const yearsText = toJsonText(payload.years ?? []);
  const cols = [
    "image_path",
    "tk_number",
    "t3kys_number",
    "application_link_tr",
    "application_link_en",
    "application_link_ar",
    "tr_name",
    "tr_description",
    "tr_link",
    "en_name",
    "en_description",
    "en_link",
    "ar_name",
    "ar_description",
    "ar_link",
    "years",
    "min_member",
    "max_member",
  ];
  const placeholders = cols.map(() => "?").join(", ");
  const params = [
    payload.image_path ?? null,
    payload.tk_number ?? null,
    payload.t3kys_number ?? null,
    payload.application_link_tr ?? null,
    payload.application_link_en ?? null,
    payload.application_link_ar ?? null,
    payload.tr_name ?? null,
    payload.tr_description ?? null,
    payload.tr_link ?? null,
    payload.en_name ?? null,
    payload.en_description ?? null,
    payload.en_link ?? null,
    payload.ar_name ?? null,
    payload.ar_description ?? null,
    payload.ar_link ?? null,
    yearsText,
    payload.min_member ?? null,
    payload.max_member ?? null,
  ];

  await env.D1_DB
    .prepare(`INSERT INTO ${TABLE} (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...params)
    .run();

  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE} WHERE id = last_insert_rowid()`).all();
  const row = results?.[0];
  if (!row) throw new Error("Failed to fetch created competition");
  return mapCompetitionRow(row);
};

export const updateCompetition = async (
  env: Environment,
  id: number,
  payload: UpdateCompetitionPayload
): Promise<Competition | null> => {
  const normalized: Record<string, unknown> = { ...payload };
  if (payload.years !== undefined) {
    normalized["years"] = toJsonText(payload.years ?? []);
  }
  const { sql, params } = buildUpdateQuery(TABLE, "id", id, normalized);
  await env.D1_DB.prepare(sql).bind(...params).run();
  return await getCompetition(env, id);
};

export const deleteCompetition = async (
  env: Environment,
  id: number
): Promise<boolean> => {
  const res = await env.D1_DB.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).bind(id).run();
  return (res.success as boolean) ?? true;
};
