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

export interface TimelineEntry {
  description: string;
  date: string;
}

export interface AwardEntry {
  degree: string;
  award: string;
}

export interface CompetitionDataApi {
  competition_id: number;
  year: string;
  timeline: TimelineEntry[] | Record<string, never> | null;
  awards: Record<string, AwardEntry[]> | AwardEntry[] | null;
  criteria: Record<string, string> | Record<string, never> | null;
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
  if (minMember && maxMember) return `${minMember}–${maxMember} ${membersLabel}`;
  if (minMember && !maxMember) return `${minMember}+ ${membersLabel}`;
  if (!minMember && maxMember) return `≤${maxMember} ${membersLabel}`;
  return fallback;
};

const looksLikeOpaqueId = (name: string) => {
  if (!name) return true;
  if (/^[A-Za-z0-9]{16,}$/.test(name)) return true;
  if (name.length >= 20 && (name.match(/_/g) ?? []).length < 2) return true;
  return false;
};

const humanizePathSegment = (raw: string) =>
  raw
    .replace(/\.[^.]+$/, "")
    .replace(/^\d{4}[_-]/, "")
    .replace(/[_-]+[A-Za-z0-9]{4,8}$/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Prefer a readable filename; fall back to parent folder when the file is a hash/id. */
export const getReportFileLabel = (filePath: string, fallback = "Report") => {
  try {
    const pathname = filePath.includes("://")
      ? new URL(filePath).pathname
      : filePath;
    const parts = pathname
      .split("/")
      .filter(Boolean)
      .map((part) => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part;
        }
      });

    const filename = parts[parts.length - 1] ?? "";
    const folder = parts[parts.length - 2] ?? "";
    const stem = filename.replace(/\.[^.]+$/, "");

    if (!looksLikeOpaqueId(stem)) {
      return humanizePathSegment(stem) || fallback;
    }

    const folderLabel = humanizePathSegment(folder);
    if (folderLabel) {
      return `${folderLabel} · ${stem.slice(0, 8)}`;
    }

    return stem.slice(0, 12) || fallback;
  } catch {
    return fallback;
  }
};

export const getFileNameFromPath = (filePath: string) => {
  try {
    const pathname = filePath.includes("://")
      ? new URL(filePath).pathname
      : filePath;
    const parts = pathname.split("/").filter(Boolean);
    const raw = parts[parts.length - 1] ?? "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  } catch {
    return "";
  }
};

export const getFileExtension = (filePath: string) => {
  const name = getFileNameFromPath(filePath);
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toUpperCase() ?? null;
};
