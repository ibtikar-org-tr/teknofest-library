import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import CompetitionCard, { type CompetitionProps } from "@/components/CompetitionCard";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
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
import heroBg from "@assets/generated_images/teknofest_hero_background.png"; // reusing as fallback

const FALLBACK_CATEGORY = "General";
const FALLBACK_STATUS: CompetitionProps["status"] = "open";
const FALLBACK_DEADLINE = "TBD";
const FALLBACK_PRIZE = "TBA";
const CATEGORIES = ["All", FALLBACK_CATEGORY];
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
    deadline: FALLBACK_DEADLINE,
    teamSize: formatTeamSize(
      competition.min_member,
      competition.max_member,
      t("card.members"),
      t("card.notSpecified"),
    ),
    prize: FALLBACK_PRIZE,
    tkNumber: competition.tk_number ?? undefined,
    t3kysNumber: competition.t3kys_number ?? undefined,
    years: competition.years ?? [],
    applicationLink,
  };
};

export default function CompetitionsPage() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
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

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesCategory = activeCategory === "All" || comp.category === activeCategory;
    const matchesSearch = comp.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />

        <section className="container mx-auto px-4 py-16 -mt-20 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            {/* Filter Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-bold font-display text-foreground">
                  {t('filters.title')}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {t('filters.subtitle')}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute rtl:right-3 rtl:left-auto left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder={t('filters.searchPlaceholder')}
                  className="pl-10 rtl:pl-3 rtl:pr-10 bg-background/50 border-border focus:border-primary/50 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeCategory === category
                      ? "bg-primary text-white shadow-md scale-105"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20 text-muted-foreground"
                >
                  {t("filters.loading") ?? "Loading competitions..."}
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20 text-red-500"
                >
                  {t("filters.error") ?? "Failed to load competitions."}
                </motion.div>
              ) : filteredCompetitions.length > 0 ? (
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence>
                  {filteredCompetitions.map((competition, index) => (
                    <CompetitionCard 
                      key={competition.id} 
                      competition={competition} 
                      index={index} 
                    />
                  ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Filter className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t('filters.noResults')}</h3>
                  <p className="text-muted-foreground">
                    {t('filters.tryAdjusting')}
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                    className="mt-4 text-primary"
                  >
                    {t('filters.reset')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Call to Action Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20"
          >
            <h2 className="text-4xl font-bold font-display mb-6">{t('cta.title')}</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
              {t('cta.register')}
            </Button>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
