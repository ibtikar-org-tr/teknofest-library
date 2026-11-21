import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getReportFileMeta,
  type ReportKind,
  type ReportLevel,
  type ReportTrack,
} from "@/lib/competitions";
import { useLanguage } from "@/lib/LanguageContext";
import { Download, FileText, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReportFileItem {
  id: string;
  year?: string | null;
  stage?: string | null;
  rank?: string | null;
  language?: string | null;
  file_path: string;
}

type TemplateFilter = "all" | "templates" | "other";

type FilterChipProps = {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
};

function FilterChip({ active, label, count, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className={cn("tabular-nums", active ? "text-white/80" : "text-muted-foreground")}>
          {count}
        </span>
      )}
    </button>
  );
}

function FilterRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <span className="w-20 shrink-0 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

type EnrichedItem = {
  file: ReportFileItem;
  meta: ReturnType<typeof getReportFileMeta>;
};

function FileCard({
  file,
  meta,
  levelLabel,
  kindLabel,
  trackLabel,
  downloadLabel,
}: {
  file: ReportFileItem;
  meta: ReturnType<typeof getReportFileMeta>;
  levelLabel: (value: ReportLevel) => string;
  kindLabel: (value: ReportKind) => string;
  trackLabel: (value: ReportTrack) => string;
  downloadLabel: string;
}) {
  return (
    <div className="group relative border border-border bg-linear-to-br from-card to-card/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="break-words text-base font-semibold leading-snug md:text-lg">
                {meta.label}
              </div>
              {meta.fileName && (
                <div
                  className="mt-1 break-all font-mono text-xs text-muted-foreground"
                  title={meta.fileName}
                >
                  {meta.fileName}
                </div>
              )}
              <div className="mt-1 text-xs text-muted-foreground/80">
                {[file.year, file.stage, file.rank].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {meta.isTemplate && (
              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20">
                {kindLabel("template")}
              </Badge>
            )}
            {meta.extension && (
              <Badge variant="outline" className="bg-secondary/50">
                {meta.extension}
              </Badge>
            )}
            <Badge variant="outline" className="bg-secondary/50">
              {levelLabel(meta.level)}
            </Badge>
            {!meta.isTemplate && (
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
              >
                {kindLabel(meta.kind)}
              </Badge>
            )}
            {meta.track !== "general" && (
              <Badge variant="outline" className="bg-secondary/50">
                {trackLabel(meta.track)}
              </Badge>
            )}
            {file.language && (
              <Badge variant="outline" className="bg-secondary/50">
                {file.language.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
        <Button
          size="lg"
          className="shrink-0 bg-primary text-white hover:bg-primary/90"
          asChild
        >
          <a href={file.file_path} target="_blank" rel="noreferrer">
            <Download className="me-2 h-4 w-4" />
            {downloadLabel}
          </a>
        </Button>
      </div>
    </div>
  );
}

function GroupedSections({
  items,
  levelLabel,
  kindLabel,
  trackLabel,
  downloadLabel,
}: {
  items: EnrichedItem[];
  levelLabel: (value: ReportLevel) => string;
  kindLabel: (value: ReportKind) => string;
  trackLabel: (value: ReportTrack) => string;
  downloadLabel: string;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, EnrichedItem[]>();
    for (const item of items) {
      const key = item.meta.folderLabel;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "tr"));
  }, [items]);

  return (
    <div className="space-y-8">
      {grouped.map(([groupLabel, groupItems]) => (
        <section key={groupLabel}>
          <div className="mb-3 flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">{groupLabel}</h4>
            <Badge variant="outline" className="text-[11px]">
              {groupItems.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {groupItems.map(({ file, meta }) => (
              <FileCard
                key={file.id}
                file={file}
                meta={meta}
                levelLabel={levelLabel}
                kindLabel={kindLabel}
                trackLabel={trackLabel}
                downloadLabel={downloadLabel}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ReportFilesPanel({ files }: { files: ReportFileItem[] }) {
  const { t, direction } = useLanguage();
  const isRtl = direction === "rtl";

  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");
  const [level, setLevel] = useState<ReportLevel | "all">("all");
  const [kind, setKind] = useState<ReportKind | "all">("all");
  const [track, setTrack] = useState<ReportTrack | "all">("all");
  const [extension, setExtension] = useState<string | "all">("all");

  const levelLabel = (value: ReportLevel) => t(`reports.levels.${value}`);
  const kindLabel = (value: ReportKind) => t(`reports.kinds.${value}`);
  const trackLabel = (value: ReportTrack) => t(`reports.tracks.${value}`);

  const enriched = useMemo(
    () =>
      files.map((file) => {
        const fallback = file.year
          ? String(t("reports.reportFallbackYear") ?? "Report {year}").replace(
              "{year}",
              String(file.year),
            )
          : t("reports.reportFallback") ?? "Report";
        return {
          file,
          meta: getReportFileMeta(file.file_path, fallback),
        };
      }),
    [files, t],
  );

  const templateCount = useMemo(
    () => enriched.filter(({ meta }) => meta.isTemplate).length,
    [enriched],
  );
  const otherCount = enriched.length - templateCount;

  const counts = useMemo(() => {
    const levels = new Map<ReportLevel, number>();
    const kinds = new Map<ReportKind, number>();
    const tracks = new Map<ReportTrack, number>();
    const extensions = new Map<string, number>();

    for (const { meta } of enriched) {
      levels.set(meta.level, (levels.get(meta.level) ?? 0) + 1);
      kinds.set(meta.kind, (kinds.get(meta.kind) ?? 0) + 1);
      tracks.set(meta.track, (tracks.get(meta.track) ?? 0) + 1);
      if (meta.extension) {
        extensions.set(meta.extension, (extensions.get(meta.extension) ?? 0) + 1);
      }
    }

    return { levels, kinds, tracks, extensions };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ file, meta }) => {
      if (templateFilter === "templates" && !meta.isTemplate) return false;
      if (templateFilter === "other" && meta.isTemplate) return false;
      if (level !== "all" && meta.level !== level) return false;
      if (kind !== "all" && meta.kind !== kind) return false;
      if (track !== "all" && meta.track !== track) return false;
      if (extension !== "all" && meta.extension !== extension) return false;
      if (!q) return true;
      const haystack = [
        meta.label,
        meta.fileName,
        meta.folderLabel,
        file.year,
        file.stage,
        file.rank,
        levelLabel(meta.level),
        kindLabel(meta.kind),
        trackLabel(meta.track),
        meta.isTemplate ? kindLabel("template") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enriched, search, templateFilter, level, kind, track, extension, t]);

  const templateItems = useMemo(
    () => filtered.filter(({ meta }) => meta.isTemplate),
    [filtered],
  );
  const nonTemplateItems = useMemo(
    () => filtered.filter(({ meta }) => !meta.isTemplate),
    [filtered],
  );

  const showSplitSections =
    templateFilter === "all" && templateItems.length > 0 && nonTemplateItems.length > 0;

  const hasActiveFilters =
    search.trim() !== "" ||
    templateFilter !== "all" ||
    level !== "all" ||
    kind !== "all" ||
    track !== "all" ||
    extension !== "all";

  const resetFilters = () => {
    setSearch("");
    setTemplateFilter("all");
    setLevel("all");
    setKind("all");
    setTrack("all");
    setExtension("all");
  };

  const levelOptions = (Array.from(counts.levels.keys()) as ReportLevel[]).sort();
  // Hide redundant "template" chip when the dedicated Şablon filter is present.
  const kindOptions = (Array.from(counts.kinds.keys()) as ReportKind[])
    .filter((value) => !(templateCount > 0 && value === "template"))
    .sort();
  const trackOptions = (Array.from(counts.tracks.keys()) as ReportTrack[]).sort();
  const extensionOptions = Array.from(counts.extensions.keys()).sort();

  const cardProps = {
    levelLabel,
    kindLabel,
    trackLabel,
    downloadLabel: t("reports.download") ?? "Download",
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-bold">{t("reports.title")}</h3>
        <Badge className="ms-auto bg-primary/20 text-primary hover:bg-primary/30">
          {filtered.length}
          {filtered.length !== files.length ? ` / ${files.length}` : ""}
        </Badge>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-border bg-card/60 p-4">
        <div className="relative">
          <Search
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
              isRtl ? "right-3" : "left-3",
            )}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("reports.searchPlaceholder")}
            className={cn("h-10", isRtl ? "pr-9" : "pl-9")}
          />
        </div>

        <div className="space-y-3">
          {templateCount > 0 && (
            <FilterRow title={t("reports.templateFilter")}>
              <FilterChip
                active={templateFilter === "all"}
                label={t("reports.all")}
                count={files.length}
                onClick={() => setTemplateFilter("all")}
              />
              <FilterChip
                active={templateFilter === "templates"}
                label={t("reports.templatesOnly")}
                count={templateCount}
                onClick={() => setTemplateFilter("templates")}
              />
              {otherCount > 0 && (
                <FilterChip
                  active={templateFilter === "other"}
                  label={t("reports.otherFiles")}
                  count={otherCount}
                  onClick={() => setTemplateFilter("other")}
                />
              )}
            </FilterRow>
          )}

          {levelOptions.length > 1 && (
            <FilterRow title={t("reports.level")}>
              <FilterChip
                active={level === "all"}
                label={t("reports.all")}
                count={files.length}
                onClick={() => setLevel("all")}
              />
              {levelOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={level === value}
                  label={levelLabel(value)}
                  count={counts.levels.get(value) ?? 0}
                  onClick={() => setLevel(value)}
                />
              ))}
            </FilterRow>
          )}

          {kindOptions.length > 1 && (
            <FilterRow title={t("reports.type")}>
              <FilterChip
                active={kind === "all"}
                label={t("reports.all")}
                count={files.length}
                onClick={() => setKind("all")}
              />
              {kindOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={kind === value}
                  label={kindLabel(value)}
                  count={counts.kinds.get(value) ?? 0}
                  onClick={() => setKind(value)}
                />
              ))}
            </FilterRow>
          )}

          {trackOptions.length > 1 && (
            <FilterRow title={t("reports.track")}>
              <FilterChip
                active={track === "all"}
                label={t("reports.all")}
                count={files.length}
                onClick={() => setTrack("all")}
              />
              {trackOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={track === value}
                  label={trackLabel(value)}
                  count={counts.tracks.get(value) ?? 0}
                  onClick={() => setTrack(value)}
                />
              ))}
            </FilterRow>
          )}

          {extensionOptions.length > 1 && (
            <FilterRow title={t("reports.format")}>
              <FilterChip
                active={extension === "all"}
                label={t("reports.all")}
                count={files.length}
                onClick={() => setExtension("all")}
              />
              {extensionOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={extension === value}
                  label={value}
                  count={counts.extensions.get(value) ?? 0}
                  onClick={() => setExtension(value)}
                />
              ))}
            </FilterRow>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-muted-foreground"
              onClick={resetFilters}
            >
              <X className="h-3.5 w-3.5" />
              {t("reports.clearFilters")}
            </Button>
          </div>
        )}
      </div>

      {templateCount === 0 && files.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {t("reports.noTemplatesNote")}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="mb-3 text-muted-foreground">{t("reports.noMatches")}</p>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            {t("reports.resetFilters")}
          </Button>
        </div>
      ) : showSplitSections ? (
        <div className="space-y-10">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <h4 className="font-display text-lg font-bold text-foreground">
                {t("reports.templatesSection")}
              </h4>
              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20">
                {templateItems.length}
              </Badge>
            </div>
            <GroupedSections items={templateItems} {...cardProps} />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-3">
              <h4 className="font-display text-lg font-bold text-foreground">
                {t("reports.otherSection")}
              </h4>
              <Badge variant="outline">{nonTemplateItems.length}</Badge>
            </div>
            <GroupedSections items={nonTemplateItems} {...cardProps} />
          </div>
        </div>
      ) : (
        <GroupedSections items={filtered} {...cardProps} />
      )}
    </div>
  );
}
