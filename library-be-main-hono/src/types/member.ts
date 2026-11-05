export interface Member {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  ar_name: string;
  en_name: string;
  membership_number: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  year: number;
  sex: string;
  birthdate: string; // TIMESTAMP
  country: string;
  city: string;
  district: string;
  team_ids: string[]; // UUIDs
  status: string;
  is_advisor: boolean;
  is_leader: boolean;
  skills: string[];
  rating: number;
  comments: string[]; // UUIDs
}

export interface CreateMemberPayload {
  id?: string; // generated if not provided
  ar_name: string;
  en_name: string;
  membership_number: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  year: number;
  sex: string;
  birthdate: string;
  country: string;
  city: string;
  district: string;
  team_ids?: string[];
  status: string;
  is_advisor?: boolean;
  is_leader?: boolean;
  skills?: string[];
  rating: number;
  comments?: string[];
}

export type UpdateMemberPayload = Partial<CreateMemberPayload>;

export const mapMemberRow = (row: any): Member => {
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
    ar_name: row.ar_name,
    en_name: row.en_name,
    membership_number: row.membership_number,
    email: row.email,
    phone: row.phone,
    university: row.university,
    major: row.major,
    year: Number(row.year),
    sex: row.sex,
    birthdate: row.birthdate,
    country: row.country,
    city: row.city,
    district: row.district,
    team_ids: parseJSON(row.team_ids),
    status: row.status,
    is_advisor: Boolean(row.is_advisor),
    is_leader: Boolean(row.is_leader),
    skills: parseJSON(row.skills),
    rating: Number(row.rating),
    comments: parseJSON(row.comments),
  };
};
