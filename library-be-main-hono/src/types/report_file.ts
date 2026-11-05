export interface ReportFile {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  competition_id: number;
  team_id: string | null;
  year: string;
  file_path: string;
  rank: string | null;
  stage: string | null;
  language: string | null;
}

export interface CreateReportFilePayload {
  id?: string;
  competition_id: number;
  team_id?: string | null;
  year: string;
  file_path: string;
  rank?: string | null;
  stage?: string | null;
  language?: string | null;
}

export type UpdateReportFilePayload = Partial<CreateReportFilePayload>;

export const mapReportFileRow = (row: any): ReportFile => {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
    competition_id: Number(row.competition_id),
    team_id: row.team_id ?? null,
    year: row.year,
    file_path: row.file_path,
    rank: row.rank ?? null,
    stage: row.stage ?? null,
    language: row.language ?? null,
  };
};
