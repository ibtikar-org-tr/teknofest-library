import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  REPORT_KIND_LABELS,
  REPORT_LEVEL_LABELS,
  REPORT_TRACK_LABELS,
  getReportFileMeta,
  type ReportKind,
  type ReportLevel,
  type ReportTrack,
} from "@/lib/competitions";
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
      <span className="w-16 shrink-0 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function ReportFilesPanel({ files }: { files: ReportFileItem[] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<ReportLevel | "all">("all");
  const [kind, setKind] = useState<ReportKind | "all">("all");
  const [track, setTrack] = useState<ReportTrack | "all">("all");
  const [extension, setExtension] = useState<string | "all">("all");

  const enriched = useMemo(
    () =>
      files.map((file) => ({
        file,
        meta: getReportFileMeta(file.file_path, file.year ? `Report ${file.year}` : "Report"),
      })),
    [files],
  );

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
        REPORT_LEVEL_LABELS[meta.level],
        REPORT_KIND_LABELS[meta.kind],
        REPORT_TRACK_LABELS[meta.track],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enriched, search, level, kind, track, extension]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const key = item.meta.folderLabel;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "tr"));
  }, [filtered]);

  const hasActiveFilters =
    search.trim() !== "" ||
    level !== "all" ||
    kind !== "all" ||
    track !== "all" ||
    extension !== "all";

  const resetFilters = () => {
    setSearch("");
    setLevel("all");
    setKind("all");
    setTrack("all");
    setExtension("all");
  };

  const levelOptions = (Array.from(counts.levels.keys()) as ReportLevel[]).sort();
  const kindOptions = (Array.from(counts.kinds.keys()) as ReportKind[]).sort();
  const trackOptions = (Array.from(counts.tracks.keys()) as ReportTrack[]).sort();
  const extensionOptions = Array.from(counts.extensions.keys()).sort();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold font-display">Report Files</h3>
        <Badge className="ml-auto bg-primary/20 text-primary hover:bg-primary/30">
          {filtered.length}
          {filtered.length !== files.length ? ` / ${files.length}` : ""}
        </Badge>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-border bg-card/60 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by name, folder, type…"
            className="h-10 pl-9"
          />
        </div>

        <div className="space-y-3">
          {levelOptions.length > 1 && (
            <FilterRow title="Level">
              <FilterChip
                active={level === "all"}
                label="All"
                count={files.length}
                onClick={() => setLevel("all")}
              />
              {levelOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={level === value}
                  label={REPORT_LEVEL_LABELS[value]}
                  count={counts.levels.get(value) ?? 0}
                  onClick={() => setLevel(value)}
                />
              ))}
            </FilterRow>
          )}

          {kindOptions.length > 1 && (
            <FilterRow title="Type">
              <FilterChip
                active={kind === "all"}
                label="All"
                count={files.length}
                onClick={() => setKind("all")}
              />
              {kindOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={kind === value}
                  label={REPORT_KIND_LABELS[value]}
                  count={counts.kinds.get(value) ?? 0}
                  onClick={() => setKind(value)}
                />
              ))}
            </FilterRow>
          )}

          {trackOptions.length > 1 && (
            <FilterRow title="Track">
              <FilterChip
                active={track === "all"}
                label="All"
                count={files.length}
                onClick={() => setTrack("all")}
              />
              {trackOptions.map((value) => (
                <FilterChip
                  key={value}
                  active={track === value}
                  label={REPORT_TRACK_LABELS[value]}
                  count={counts.tracks.get(value) ?? 0}
                  onClick={() => setTrack(value)}
                />
              ))}
            </FilterRow>
          )}

          {extensionOptions.length > 1 && (
            <FilterRow title="Format">
              <FilterChip
                active={extension === "all"}
                label="All"
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
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground mb-3">No report files match these filters.</p>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([groupLabel, items]) => (
            <section key={groupLabel}>
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">{groupLabel}</h4>
                <Badge variant="outline" className="text-[11px]">
                  {items.length}
                </Badge>
              </div>
              <div className="grid gap-3">
                {items.map(({ file, meta }) => (
                  <div
                    key={file.id}
                    className="group relative border border-border bg-linear-to-br from-card to-card/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                  >
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
                          {meta.extension && (
                            <Badge variant="outline" className="bg-secondary/50">
                              {meta.extension}
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-secondary/50">
                            {REPORT_LEVEL_LABELS[meta.level]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          >
                            {REPORT_KIND_LABELS[meta.kind]}
                          </Badge>
                          {meta.track !== "general" && (
                            <Badge variant="outline" className="bg-secondary/50">
                              {REPORT_TRACK_LABELS[meta.track]}
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
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
