export interface Team {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  description: string | null;
  stage: string | null;
  institution_name: string | null;
  member_count: number | null;
  tap_members: string[]; // UUIDs
  members_list: string[]; // names
  leader: string | null; // UUID
  competition_id: number;
  years: number[];
  status: string | null;
  rank: number | null;
  relation: string | null;
  intro_file_path: string | null;
  team_link: string | null;
}

export interface CreateTeamPayload {
  id?: string; // if not provided, generated
  name: string;
  description?: string | null;
  stage?: string | null;
  institution_name?: string | null;
  member_count?: number | null;
  tap_members?: string[];
  members_list?: string[];
  leader?: string | null;
  competition_id: number;
  years?: number[];
  status?: string | null;
  rank?: number | null;
  relation?: string | null;
  intro_file_path?: string | null;
  team_link?: string | null;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

export const mapTeamRow = (row: any): Team => {
  const parseJSON = (v: any): any[] => {
    try {
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  };
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
    description: row.description ?? null,
    stage: row.stage ?? null,
    institution_name: row.institution_name ?? null,
    member_count: row.member_count != null ? Number(row.member_count) : null,
    tap_members: parseJSON(row.tap_members),
    members_list: parseJSON(row.members_list),
    leader: row.leader ?? null,
    competition_id: Number(row.competition_id),
    years: parseJSON(row.years),
    status: row.status ?? null,
    rank: row.rank != null ? Number(row.rank) : null,
    relation: row.relation ?? null,
    intro_file_path: row.intro_file_path ?? null,
    team_link: row.team_link ?? null,
  };
};
