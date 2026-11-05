import type { Environment } from "../types/env";
import type { Resource, CreateResourcePayload, UpdateResourcePayload } from "../types/resource";
import { mapResourceRow } from "../types/resource";
import { buildUpdateQuery, toJsonText } from "../utils/sql";

const TABLE = "resources";

export const listResources = async (env: Environment): Promise<Resource[]> => {
  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE}`).all();
  return (results ?? []).map(mapResourceRow);
};

export const getResource = async (env: Environment, id: string): Promise<Resource | null> => {
  const { results } = await env.D1_DB
    .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
    .bind(id)
    .all();
  const row = results?.[0];
  return row ? mapResourceRow(row) : null;
};

export const createResource = async (
  env: Environment,
  payload: CreateResourcePayload
): Promise<Resource> => {
  const id = payload.id ?? crypto.randomUUID();
  const cols = [
    "id",
    "competition_id",
    "team_id",
    "resource_type",
    "resource_url",
    "description",
    "year",
    "comments",
  ];
  const placeholders = cols.map(() => "?").join(", ");
  const params = [
    id,
    payload.competition_id,
    payload.team_id,
    payload.resource_type,
    payload.resource_url,
    payload.description,
    payload.year,
    toJsonText(payload.comments ?? []),
  ];

  await env.D1_DB
    .prepare(`INSERT INTO ${TABLE} (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...params)
    .run();

  const resource = await getResource(env, id);
  if (!resource) throw new Error("Failed to fetch created resource");
  return resource;
};

export const updateResource = async (
  env: Environment,
  id: string,
  payload: UpdateResourcePayload
): Promise<Resource | null> => {
  const normalized: Record<string, unknown> = { ...payload };
  if (payload.comments !== undefined) normalized["comments"] = toJsonText(payload.comments ?? []);
  const { sql, params } = buildUpdateQuery(TABLE, "id", id, normalized);
  await env.D1_DB.prepare(sql).bind(...params).run();
  return await getResource(env, id);
};

export const deleteResource = async (env: Environment, id: string): Promise<boolean> => {
  const res = await env.D1_DB.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).bind(id).run();
  return (res.success as boolean) ?? true;
};
