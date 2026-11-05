import type { Environment } from "../types/env";
import type { ResultFile, CreateResultFilePayload, UpdateResultFilePayload } from "../types/result_file";
import { mapResultFileRow } from "../types/result_file";
import { buildUpdateQuery } from "../utils/sql";

const TABLE = "result_files";

export const listResultFiles = async (env: Environment): Promise<ResultFile[]> => {
  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE}`).all();
  return (results ?? []).map(mapResultFileRow);
};

export const getResultFile = async (env: Environment, id: string): Promise<ResultFile | null> => {
  const { results } = await env.D1_DB
    .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
    .bind(id)
    .all();
  const row = results?.[0];
  return row ? mapResultFileRow(row) : null;
};

export const createResultFile = async (
  env: Environment,
  payload: CreateResultFilePayload
): Promise<ResultFile> => {
  const id = payload.id ?? crypto.randomUUID();
  const cols = [
    "id",
    "competition_id",
    "year",
    "stage",
    "file_path",
  ];
  const placeholders = cols.map(() => "?").join(", ");
  const params = [
    id,
    payload.competition_id,
    payload.year,
    payload.stage,
    payload.file_path,
  ];

  await env.D1_DB
    .prepare(`INSERT INTO ${TABLE} (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...params)
    .run();

  const rf = await getResultFile(env, id);
  if (!rf) throw new Error("Failed to fetch created result file");
  return rf;
};

export const updateResultFile = async (
  env: Environment,
  id: string,
  payload: UpdateResultFilePayload
): Promise<ResultFile | null> => {
  const { sql, params } = buildUpdateQuery(TABLE, "id", id, payload as Record<string, unknown>);
  await env.D1_DB.prepare(sql).bind(...params).run();
  return await getResultFile(env, id);
};

export const deleteResultFile = async (env: Environment, id: string): Promise<boolean> => {
  const res = await env.D1_DB.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).bind(id).run();
  return (res.success as boolean) ?? true;
};
