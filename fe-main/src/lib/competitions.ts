import { type Language } from "@/lib/translations";

export interface CompetitionApi {
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
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const localeOrder = (language: Language): Language[] => {
  const order: Language[] = [language, "en", "tr", "ar"];
  return Array.from(new Set(order));
};

export const pickLocalizedField = (
  competition: CompetitionApi,
  language: Language,
  suffix: "name" | "description" | "link" | "application_link",
): string | null => {
  for (const locale of localeOrder(language)) {
    const key = `${locale}_${suffix}` as keyof CompetitionApi;
    const value = competition[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
};

export const formatTeamSize = (
  minMember: number | null,
  maxMember: number | null,
  membersLabel: string,
  fallback: string,
) => {
  if (minMember && maxMember) return `${minMember}-${maxMember} ${membersLabel}`;
  if (minMember && !maxMember) return `${minMember}+ ${membersLabel}`;
  if (!minMember && maxMember) return `${membersLabel} <= ${maxMember}`;
  return fallback;
};
