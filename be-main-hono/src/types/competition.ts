export interface Competition {
	id: number;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	image_path: string | null;
	tk_number: string | null;
	t3kys_number: string | null;
	application_link_tr: string | null;
	application_link_en: string | null;
	application_link_ar: string | null;
	tr_name: string | null;
	tr_description: string | null;
	tr_link: string | null;
	en_name: string | null;
	en_description: string | null;
	en_link: string | null;
	ar_name: string | null;
	ar_description: string | null;
	ar_link: string | null;
	years: number[];
	min_member: number | null;
	max_member: number | null;
	ggroup: string | null;
}

export interface TimelineEntry {
	description: string;
	date: string;
}

export interface AwardEntry {
	rank: string;
	prize: string;
}

export interface CompetitionData {
	competition_id: number;
	year: number;
	timeline: TimelineEntry[] | null;
	awards: Record<string, AwardEntry[]> | AwardEntry[] | null;
	criteria: Record<string, any> | null;
}

export interface CreateCompetitionPayload {
	image_path?: string | null;
	tk_number?: string | null;
	t3kys_number?: string | null;
	application_link_tr?: string | null;
	application_link_en?: string | null;
	application_link_ar?: string | null;
	tr_name?: string | null;
	tr_description?: string | null;
	tr_link?: string | null;
	en_name?: string | null;
	en_description?: string | null;
	en_link?: string | null;
	ar_name?: string | null;
	ar_description?: string | null;
	ar_link?: string | null;
	years?: number[];
	min_member?: number | null;
	max_member?: number | null;
	ggroup?: string | null;
}

export type UpdateCompetitionPayload = Partial<CreateCompetitionPayload>;

export const mapCompetitionRow = (row: any): Competition => {
	return {
		id: Number(row.id),
		created_at: row.created_at,
		updated_at: row.updated_at,
		deleted_at: row.deleted_at ?? null,
		image_path: row.image_path ?? null,
		tk_number: row.tk_number ?? null,
		t3kys_number: row.t3kys_number ?? null,
		application_link_tr: row.application_link_tr ?? null,
		application_link_en: row.application_link_en ?? null,
		application_link_ar: row.application_link_ar ?? null,
		tr_name: row.tr_name ?? null,
		tr_description: row.tr_description ?? null,
		tr_link: row.tr_link ?? null,
		en_name: row.en_name ?? null,
		en_description: row.en_description ?? null,
		en_link: row.en_link ?? null,
		ar_name: row.ar_name ?? null,
		ar_description: row.ar_description ?? null,
		ar_link: row.ar_link ?? null,
		years: (() => {
			try {
				return row.years ? JSON.parse(row.years) : [];
			} catch {
				return [];
			}
		})(),
		min_member: row.min_member != null ? Number(row.min_member) : null,
		max_member: row.max_member != null ? Number(row.max_member) : null,
		ggroup: row.ggroup ?? null,
	};
};

