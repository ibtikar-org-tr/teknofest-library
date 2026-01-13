import type { Environment } from "../types/env";
import type { ReportFile, CreateReportFilePayload, UpdateReportFilePayload } from "../types/report_file";
import { mapReportFileRow } from "../types/report_file";
import { buildUpdateQuery } from "../utils/sql";

const TABLE = "report_files";

export const listReportFiles = async (env: Environment): Promise<ReportFile[]> => {
  const { results } = await env.D1_DB.prepare(`SELECT * FROM ${TABLE}`).all();
  return (results ?? []).map(mapReportFileRow);
};

export const getReportFile = async (env: Environment, id: string): Promise<ReportFile | null> => {
  const { results } = await env.D1_DB
    .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
    .bind(id)
    .all();
  const row = results?.[0];
  return row ? mapReportFileRow(row) : null;
};

export const createReportFile = async (
  env: Environment,
  payload: CreateReportFilePayload
): Promise<ReportFile> => {
  const id = payload.id ?? crypto.randomUUID();
  const cols = [
    "id",
    "competition_id",
    "team_id",
    "year",
    "file_path",
    "rank",
    "stage",
    "language",
  ];
  const placeholders = cols.map(() => "?").join(", ");
  const params = [
    id,
    payload.competition_id,
    payload.team_id ?? null,
    payload.year,
    payload.file_path,
    payload.rank ?? null,
    payload.stage ?? null,
    payload.language ?? null,
  ];

  await env.D1_DB
    .prepare(`INSERT INTO ${TABLE} (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...params)
    .run();

  const rf = await getReportFile(env, id);
  if (!rf) throw new Error("Failed to fetch created report file");
  return rf;
};

export const updateReportFile = async (
  env: Environment,
  id: string,
  payload: UpdateReportFilePayload
): Promise<ReportFile | null> => {
  const { sql, params } = buildUpdateQuery(TABLE, "id", id, payload as Record<string, unknown>);
  await env.D1_DB.prepare(sql).bind(...params).run();
  return await getReportFile(env, id);
};

export const deleteReportFile = async (env: Environment, id: string): Promise<boolean> => {
  const res = await env.D1_DB.prepare(`DELETE FROM ${TABLE} WHERE id = ?`).bind(id).run();
  return (res.success as boolean) ?? true;
};
