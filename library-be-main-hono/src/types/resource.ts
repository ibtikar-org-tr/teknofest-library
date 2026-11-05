export interface Resource {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  competition_id: string; // TEXT
  team_id: string; // TEXT
  resource_type: string;
  resource_url: string;
  description: string;
  year: number;
  comments: string[];
}

export interface CreateResourcePayload {
  id?: string;
  competition_id: string;
  team_id: string;
  resource_type: string;
  resource_url: string;
  description: string;
  year: number;
  comments?: string[];
}

export type UpdateResourcePayload = Partial<CreateResourcePayload>;

export const mapResourceRow = (row: any): Resource => {
  const parseJSON = (v: any): any[] => {
    try {
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  };
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
    competition_id: row.competition_id,
    team_id: row.team_id,
    resource_type: row.resource_type,
    resource_url: row.resource_url,
    description: row.description,
    year: Number(row.year),
    comments: parseJSON(row.comments),
  };
};
