import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import CompetitionCard, { type CompetitionProps } from "@/components/CompetitionCard";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  buildApiUrl,
  formatTeamSize,
  pickLocalizedField,
  type CompetitionApi,
} from "@/lib/competitions";

import rocketImg from "@assets/generated_images/rocket_competition.png";
import aiImg from "@assets/generated_images/ai_competition.png";
import droneImg from "@assets/generated_images/drone_competition.png";
import roboticsImg from "@assets/generated_images/robotics_competition.png";
import agriImg from "@assets/generated_images/agritech_competition.png";
import heroBg from "@assets/generated_images/teknofest_hero_background.png";

const FALLBACK_CATEGORY = "General";
const FALLBACK_STATUS: CompetitionProps["status"] = "open";
const FALLBACK_IMAGES = [rocketImg, aiImg, droneImg, roboticsImg, agriImg, heroBg];

const mapCompetitionToCard = (
  competition: CompetitionApi,
  index: number,
  language: ReturnType<typeof useLanguage>["language"],
  t: ReturnType<typeof useLanguage>["t"],
): CompetitionProps => {
  const title = pickLocalizedField(competition, language, "name") ?? t("filters.title");
  const applicationLink =
    pickLocalizedField(competition, language, "application_link") ?? undefined;
  return {
    id: String(competition.id),
    title,
    category: FALLBACK_CATEGORY,
    image: competition.image_path ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    status: FALLBACK_STATUS,
    deadline: "",
    teamSize: formatTeamSize(
      competition.min_member,
      competition.max_member,
      t("card.members"),
      t("card.notSpecified"),
    ),
    prize: "",
    tkNumber: competition.tk_number ?? undefined,
    t3kysNumber: competition.t3kys_number ?? undefined,
    years: competition.years ?? [],
    applicationLink,
  };
};

export default function CompetitionsPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: apiCompetitions,
    isLoading,
    error,
  } = useQuery<CompetitionApi[]>({
    queryKey: [buildApiUrl("/api/competitions")],
  });

  const competitions = useMemo(
    () =>
      (apiCompetitions ?? []).map((competition, index) =>
        mapCompetitionToCard(competition, index, language, t),
      ),
    [apiCompetitions, language, t],
  );

  const filteredCompetitions = competitions.filter((comp) =>
    comp.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const countLabel = (t("filters.count") ?? "{count} competitions").replace(
    "{count}",
    String(filteredCompetitions.length),
  );

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="grow">
        <Hero />

        <section
          id="mainpage_competitions_section"
          className="relative z-20 border-t border-border/60 bg-[linear-gradient(180deg,hsl(210_40%_96%)_0%,hsl(var(--background))_28%)]"
        >
          <div className="container mx-auto px-4 py-14 md:py-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                  {t("filters.title")}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  {t("filters.subtitle")}
                </p>
                {!isLoading && !error && (
                  <p className="mt-3 text-sm font-medium text-primary">{countLabel}</p>
                )}
              </div>

              <div className="relative w-full md:w-[22rem]">
                <Search className="absolute rtl:right-3 rtl:left-auto left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t("filters.searchPlaceholder")}
                  className="h-11 pl-10 rtl:pl-3 rtl:pr-10 bg-background border-border focus-visible:ring-primary/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">
                {t("filters.loading") ?? "Loading competitions..."}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">
                {t("filters.error") ?? "Failed to load competitions."}
              </div>
            ) : filteredCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                {filteredCompetitions.map((competition, index) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-md bg-muted mb-4">
                  <Filter className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("filters.noResults")}</h3>
                <p className="text-muted-foreground">{t("filters.tryAdjusting")}</p>
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-primary"
                >
                  {t("filters.reset")}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl mx-auto border border-primary/20 bg-primary/[0.04] px-8 py-12 md:px-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("cta.description")}
            </p>
            <Button
              onClick={() =>
                window.open("https://www.teknofest.org", "_blank", "noopener,noreferrer")
              }
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 rounded-sm"
            >
              {t("cta.register")}
            </Button>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
