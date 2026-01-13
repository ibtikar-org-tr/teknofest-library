export interface ResultFile {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  competition_id: number;
  year: string;
  stage: string;
  file_path: string;
}

export interface CreateResultFilePayload {
  id?: string;
  competition_id: number;
  year: string;
  stage: string;
  file_path: string;
}

export type UpdateResultFilePayload = Partial<CreateResultFilePayload>;

export const mapResultFileRow = (row: any): ResultFile => {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
    competition_id: Number(row.competition_id),
    year: row.year,
    stage: row.stage,
    file_path: row.file_path,
  };
};
