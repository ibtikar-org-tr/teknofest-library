import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trophy, Calendar, Users, Download, ArrowRight, CheckCircle2 } from "lucide-react";
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
                    <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 mb-8">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
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
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-2xl font-bold font-display mb-4">Challenge Description</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                {description}
                            </p>
                            <p className="text-muted-foreground mb-6">
                                The Rocket Competition challenges students to demonstrate their engineering skills in a real-world scenario. 
                                Teams are required to design a rocket that can carry a 4kg payload to a target altitude of 20,000 feet 
                                and recover it safely. The payload must perform specific scientific experiments during the flight.
                            </p>

                            <h3 className="text-2xl font-bold font-display mb-4 mt-8">Key Objectives</h3>
                            <ul className="grid gap-3">
                                {["Reach target altitude of 20,000 ft", "Deploy recovery system safely", "Payload integration and functionality", "Real-time telemetry transmission"].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </TabsContent>

                    <TabsContent value="rules">
                        <div className="border border-border rounded-xl p-6 bg-card">
                            <h3 className="text-xl font-bold mb-4">Technical Regulations</h3>
                            <p className="mb-6 text-muted-foreground">Download the full technical rulebook for detailed specifications.</p>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-16 px-0 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                                                            asChild={Boolean(externalLink)}
                                                            disabled={!externalLink}
                                                        >
                                                            {externalLink ? (
                                                                <a
                                                                    href={externalLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center justify-between w-full h-full px-6"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                                            <Download className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <div className="font-bold">Competition Rulebook v2.1</div>
                                                                            <div className="text-xs text-muted-foreground">PDF • 2.4 MB</div>
                                                                        </div>
                                                                    </div>
                                                                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                                </a>
                                                            ) : (
                                                                <div className="flex items-center justify-between w-full h-full px-6 text-muted-foreground">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                                            <Download className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <div className="font-bold">Competition Rulebook v2.1</div>
                                                                            <div className="text-xs text-muted-foreground">PDF • 2.4 MB</div>
                                                                        </div>
                                                                    </div>
                                                                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </Button>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="awards">
                        <CompetitionAwards awards={competitionData?.awards ?? null} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="faq">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Can we use commercial motors?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, teams in the High Altitude category are allowed to use commercial solid rocket motors from approved vendors.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Is there a reimbursement for materials?</AccordionTrigger>
                                <AccordionContent>
                                    Finalist teams will receive a material support budget of up to ₺20,000 to cover construction costs.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
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
