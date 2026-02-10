import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, Download, ArrowRight, FileText, Link2, Cpu, Database, BookOpen } from "lucide-react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
    buildApiUrl,
    formatTeamSize,
    pickLocalizedField,
    type CompetitionApi,
    type CompetitionDataApi,
} from "@/lib/competitions";
import { useLanguage } from "@/lib/LanguageContext";
import heroBg from "@assets/generated_images/rocket_competition.png";
import CompetitionTimeline from "@/components/CompetitionTimeline";
import CompetitionAwards from "@/components/CompetitionAwards";

export default function CompetitionDetail() {
  const [match, params] = useRoute("/competition/:id");
    const id = match ? params.id : "1";
    const { language, t } = useLanguage();

    const { data, isLoading, error } = useQuery<CompetitionApi>({
        queryKey: [buildApiUrl(`/api/competitions/${id}`)],
    });

    // Get the latest year or default to current year
    const currentYear = data?.years?.length ? Math.max(...data.years) : new Date().getFullYear();

    // Fetch competition data (timeline, awards, criteria)
    const { data: competitionData, isLoading: isLoadingData } = useQuery<CompetitionDataApi>({
        queryKey: [buildApiUrl(`/api/competition-data/${id}/${currentYear}`)],
        enabled: !!data, // Only fetch when competition data is loaded
    });

    // Fetch report files for this competition
    const { data: reportFiles, isLoading: isLoadingReportFiles } = useQuery<any[]>({
        queryKey: [buildApiUrl(`/api/report-files/competition/${id}`)],
        enabled: !!data,
    });

    // Fetch resources for this competition
    const { data: resources, isLoading: isLoadingResources } = useQuery<any[]>({
        queryKey: [buildApiUrl(`/api/resources/competition/${id}`)],
        enabled: !!data,
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
    const tkNumber = data?.tk_number ?? "-";
    const t3kysNumber = data?.t3kys_number ?? "-";
    const image = data?.image_path ?? heroBg;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0">
          <img
                        src={image}
                        alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 pb-12 relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex gap-2 mb-4">
                            <Badge variant="outline" className="bg-background/20 backdrop-blur-md border-white/20 text-white">{t("detail.yearsLabel")}: {yearsText}</Badge>
            </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-display text-white mb-2">{title}</h1>
          </div>
          
          <div className="flex gap-4">
                        {applicationLink ? (
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-lg" asChild>
                                <a href={applicationLink} target="_blank" rel="noreferrer">
                                    {t("card.applyLink")} <ArrowRight className="ml-2 w-5 h-5" />
                                </a>
                            </Button>
                        ) : (
                            <Button size="lg" className="bg-secondary text-secondary-foreground font-bold h-14 px-8 text-lg" disabled>
                                {t("card.applyLink")}
                            </Button>
                        )}
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 mb-8">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="rules">Rules</TabsTrigger>
                        <TabsTrigger value="awards">Awards</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
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
                                <h3 className="text-2xl font-bold font-display mb-4">Challenge Description</h3>
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
                                <p className="text-muted-foreground">No resources available for this competition</p>
                            </div>
                        ) : (
                            <>
                                {/* Report Files Section */}
                                {(reportFiles?.length ?? 0) > 0 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <FileText className="w-6 h-6 text-primary" />
                                            </div>
                                            <h3 className="text-2xl font-bold font-display">Report Files</h3>
                                            <Badge className="ml-auto bg-primary/20 text-primary hover:bg-primary/30">
                                                {reportFiles?.length ?? 0}
                                            </Badge>
                                        </div>
                                        <div className="grid gap-4">
                                            {reportFiles?.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="group relative p-6 border border-border rounded-xl bg-gradient-to-br from-card to-card/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
                                                                    <Download className="w-4 h-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-lg">{file.year}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {file.stage && <span className="inline-block mr-3">📋 {file.stage}</span>}
                                                                        {file.rank && <span className="inline-block">🏆 {file.rank}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {file.language && (
                                                                    <Badge variant="outline" className="bg-secondary/50">
                                                                        {file.language.toUpperCase()}
                                                                    </Badge>
                                                                )}
                                                                {file.stage && (
                                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                                        {file.stage}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="lg"
                                                            className="bg-primary hover:bg-primary/90 text-white shrink-0"
                                                            asChild
                                                        >
                                                            <a href={file.file_path} target="_blank" rel="noreferrer">
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Download
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Resources Section */}
                                {(resources?.length ?? 0) > 0 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold font-display">Learning Resources</h3>
                                            <Badge className="ml-auto bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30">
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
                                                        className="group relative p-6 border border-border rounded-xl bg-gradient-to-br from-card to-card/50 hover:border-blue-400/30 hover:shadow-lg transition-all duration-300"
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
                                                                            Year {resource.year}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                                    {resource.description}
                                                                </p>
                                                                <div className="inline-block">
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                                                        External Resource
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
                                                                    <ArrowRight className="w-4 h-4 mr-2" />
                                                                    Visit
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
                                <h3 className="text-xl font-bold mb-4">Technical Regulations</h3>
                                <p className="mb-6 text-muted-foreground">Download the full technical rulebook for detailed specifications.</p>
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
                                        View Rulebook
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                <p className="text-muted-foreground">No rulebook available for this competition</p>
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="awards">
                        <CompetitionAwards awards={competitionData?.awards ?? null} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="faq">
                        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">No FAQs available for this competition</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <div className="p-6 border border-border rounded-xl bg-card space-y-6 sticky top-24">
                    <h3 className="font-bold font-display text-xl">At a Glance</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Deadline</div>
                                <div className="font-medium">{t("detail.deadlineFallback")}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Team Size</div>
                                <div className="font-medium">{teamSize}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Prize Pool</div>
                                <div className="font-medium">{t("detail.prizeFallback")}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">{t("card.tkNumber")}</div>
                                <div className="font-medium">{tkNumber}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">{t("card.t3kysNumber")}</div>
                                <div className="font-medium">{t3kysNumber}</div>
                            </div>
                        </div>
                    </div>

                    {competitionData?.timeline && Array.isArray(competitionData.timeline) && competitionData.timeline.length > 0 && (
                        <div className="pt-6 border-t border-border">
                            <h4 className="font-bold mb-2">Timeline</h4>
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
