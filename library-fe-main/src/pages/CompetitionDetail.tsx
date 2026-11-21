import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Download, ArrowRight, FileText, Link2, Cpu, Database, BookOpen } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useRoute, useSearchParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
    buildApiUrl,
    formatTeamSize,
    pickLocalizedField,
    type CompetitionApi,
    type CompetitionDataApi,
} from "@/lib/competitions";
import { useLanguage } from "@/lib/LanguageContext";
import { withLang } from "@/lib/lang";
import heroBg from "@assets/generated_images/rocket_competition.png";
import CompetitionTimeline from "@/components/CompetitionTimeline";
import CompetitionAwards from "@/components/CompetitionAwards";
import ReportFilesPanel from "@/components/ReportFilesPanel";

const DETAIL_TABS = ["overview", "resources", "rules", "awards", "faq"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

const isDetailTab = (value: string | null): value is DetailTab =>
  !!value && (DETAIL_TABS as readonly string[]).includes(value);

function decodeRouteKey(raw: string | undefined): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function CompetitionDetail() {
  const [match, params] = useRoute("/competition/:id");
    const routeKey = decodeRouteKey(match ? params.id : undefined) || "1";
    const [, setLocation] = useLocation();
    const { language, t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab: DetailTab = isDetailTab(searchParams.get("tab"))
      ? (searchParams.get("tab") as DetailTab)
      : "overview";

    const setActiveTab = (tab: string) => {
      if (!isDetailTab(tab)) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "overview") {
            next.delete("tab");
          } else {
            next.set("tab", tab);
          }
          return next;
        },
        { replace: true },
      );
    };

    const { data, isLoading, error } = useQuery<CompetitionApi>({
        queryKey: [buildApiUrl(`/api/competitions/${encodeURIComponent(routeKey)}`)],
    });

    // Canonicalize name-based URLs to /competition/:id (keep lang/tab query).
    useEffect(() => {
      if (!data?.id) return;
      if (String(data.id) === routeKey) return;
      const qs = searchParams.toString();
      const path = `/competition/${data.id}${qs ? `?${qs}` : ""}`;
      setLocation(withLang(path, language), { replace: true });
    }, [data?.id, routeKey, searchParams, setLocation, language]);

    const competitionId = data?.id;

    // Get the latest year or default to current year
    const currentYear = data?.years?.length ? Math.max(...data.years) : new Date().getFullYear();

    // Fetch competition data (timeline, awards, criteria)
    const { data: competitionData, isLoading: isLoadingData } = useQuery<CompetitionDataApi>({
        queryKey: [buildApiUrl(`/api/competition-data/${competitionId}/${currentYear}`)],
        enabled: !!competitionId,
    });

    // Fetch report files for this competition
    const { data: reportFiles, isLoading: isLoadingReportFiles } = useQuery<any[]>({
        queryKey: [buildApiUrl(`/api/report-files/competition/${competitionId}`)],
        enabled: !!competitionId,
    });

    // Fetch resources for this competition
    const { data: resources, isLoading: isLoadingResources } = useQuery<any[]>({
        queryKey: [buildApiUrl(`/api/resources/competition/${competitionId}`)],
        enabled: !!competitionId,
    });

    const localized = (suffix: "name" | "description" | "link" | "application_link") =>
        data ? pickLocalizedField(data, language, suffix) : null;

    const title = localized("name") ?? t("filters.title");
    const description = localized("description") ?? t("detail.noDescription");
    const applicationLink = localized("application_link");
    const externalLink = localized("link");
    const teamSize = formatTeamSize(
        data?.min_member ?? null,
        data?.max_member ?? null,
        t("card.members"),
        t("card.notSpecified"),
    );
    const yearsText = data?.years?.length ? data.years.join(", ") : t("detail.noYears");

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      {/* Hero — dark scrim keeps title readable on light competition images */}
      <div className="relative flex h-[52vh] min-h-[22rem] w-full items-end overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#0b1220]">
          <img
            key={data?.image_path ?? "fallback"}
            src={data?.image_path || heroBg}
            alt=""
            className="h-full w-full scale-[1.02] object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.includes(String(heroBg))) {
                img.src = heroBg;
              }
            }}
          />
          {/* Always-dark cinematic overlays so white type stays legible */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,24,0.35)_0%,rgba(8,12,24,0.25)_40%,rgba(8,12,24,0.88)_82%,hsl(var(--background))_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,12,24,0.65)_0%,rgba(8,12,24,0.2)_55%,rgba(8,12,24,0.4)_100%)]" />
        </div>

        <div className="container relative z-10 mx-auto flex flex-col items-start justify-between gap-6 px-4 pb-10 pt-28 md:flex-row md:items-end md:pb-12">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-white/30 bg-black/50 text-white backdrop-blur-md"
              >
                {t("detail.yearsLabel")}: {yearsText}
              </Badge>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.65)] sm:text-4xl md:text-5xl lg:text-6xl">
              {title}
            </h1>
          </div>

          <div className="flex shrink-0 gap-3">
            {applicationLink ? (
              <Button
                size="lg"
                className="h-12 bg-primary px-7 text-base font-bold text-white shadow-lg shadow-black/25 hover:bg-primary/90 md:h-14 md:px-8 md:text-lg"
                asChild
              >
                <a href={applicationLink} target="_blank" rel="noreferrer">
                  {t("card.applyLink")} <ArrowRight className="ms-2 h-5 w-5" />
                </a>
              </Button>
            ) : (
              <Button
                size="lg"
                disabled
                className="h-12 border border-white/25 bg-black/40 px-7 text-base font-bold text-white/85 backdrop-blur-sm md:h-14 md:px-8 md:text-lg"
              >
                {t("card.applyLink")}
              </Button>
            )}
          </div>
        </div>
      </div>

    <main className="grow container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 mb-8">
                        <TabsTrigger value="overview">{t("detail.tabs.overview")}</TabsTrigger>
                        <TabsTrigger value="resources">{t("detail.tabs.resources")}</TabsTrigger>
                        <TabsTrigger value="rules">{t("detail.tabs.rules")}</TabsTrigger>
                        <TabsTrigger value="awards">{t("detail.tabs.awards")}</TabsTrigger>
                        <TabsTrigger value="faq">{t("detail.tabs.faq")}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-6">
                                                {isLoading && (
                                                    <div className="text-muted-foreground">{t("detail.loading")}</div>
                                                )}
                                                {error && (
                                                    <div className="text-red-500">{t("detail.error")}</div>
                                                )}
                        {description && (
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-2xl font-bold font-display mb-4">{t("detail.challengeDescription")}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        )}
                        {!description && !isLoading && (
                            <div className="text-center py-12 text-muted-foreground">
                                {t("detail.noDescription")}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-8">
                        {isLoadingReportFiles || isLoadingResources ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-muted-foreground animate-pulse">{t("detail.loading")}</div>
                            </div>
                        ) : (reportFiles?.length ?? 0) === 0 && (resources?.length ?? 0) === 0 ? (
                            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                <p className="text-muted-foreground">{t("detail.noResources")}</p>
                            </div>
                        ) : (
                            <>
                                {(reportFiles?.length ?? 0) > 0 && (
                                    <ReportFilesPanel files={reportFiles ?? []} />
                                )}

                                {(resources?.length ?? 0) > 0 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold font-display">{t("detail.learningResources")}</h3>
                                            <Badge className="ms-auto bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30">
                                                {resources?.length ?? 0}
                                            </Badge>
                                        </div>
                                        <div className="grid gap-4">
                                            {resources?.map((resource) => {
                                                const getResourceIcon = (type: string) => {
                                                    const lower = type.toLowerCase();
                                                    if (lower.includes('database')) return <Database className="w-5 h-5" />;
                                                    if (lower.includes('tutorial') || lower.includes('course')) return <BookOpen className="w-5 h-5" />;
                                                    if (lower.includes('api') || lower.includes('doc')) return <Cpu className="w-5 h-5" />;
                                                    return <Link2 className="w-5 h-5" />;
                                                };

                                                return (
                                                    <div
                                                        key={resource.id}
                                                        className="group relative p-6 border border-border rounded-xl bg-linear-to-br from-card to-card/50 hover:border-blue-400/30 hover:shadow-lg transition-all duration-300"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-start gap-3 mb-3">
                                                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors mt-1">
                                                                        {getResourceIcon(resource.resource_type)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-lg capitalize">
                                                                            {resource.resource_type.replace(/_/g, ' ')}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            {String(t("detail.yearLabel") ?? "Year {year}").replace(
                                                                                "{year}",
                                                                                String(resource.year),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                                    {resource.description}
                                                                </p>
                                                                <div className="inline-block">
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                                                        {t("detail.externalResource")}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="lg"
                                                                variant="outline"
                                                                className="border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10 shrink-0"
                                                                asChild
                                                            >
                                                                <a href={resource.resource_url} target="_blank" rel="noreferrer">
                                                                    <ArrowRight className="w-4 h-4 me-2" />
                                                                    {t("detail.visit")}
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="rules">
                        {externalLink ? (
                            <div className="border border-border rounded-xl p-6 bg-card">
                                <h3 className="text-xl font-bold mb-4">{t("detail.technicalRegulations")}</h3>
                                <p className="mb-6 text-muted-foreground">{t("detail.technicalRegulationsDesc")}</p>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                                    asChild
                                >
                                    <a
                                        href={externalLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        {t("detail.viewRulebook")}
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                <p className="text-muted-foreground">{t("detail.noRulebook")}</p>
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="awards">
                        <CompetitionAwards awards={competitionData?.awards ?? null} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="faq">
                        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">{t("detail.noFaqs")}</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="space-y-6">
                <div className="p-6 border border-border rounded-xl bg-card space-y-6 sticky top-24">
                    <h3 className="font-bold font-display text-xl">{t("detail.atAGlance")}</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">{t("detail.teamSize")}</div>
                                <div className="font-medium">{teamSize}</div>
                            </div>
                        </div>
                    </div>

                    {competitionData?.timeline && Array.isArray(competitionData.timeline) && competitionData.timeline.length > 0 && (
                        <div className="pt-6 border-t border-border">
                            <h4 className="font-bold mb-2">{t("detail.timeline")}</h4>
                            <CompetitionTimeline timeline={competitionData.timeline} isLoading={isLoadingData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
