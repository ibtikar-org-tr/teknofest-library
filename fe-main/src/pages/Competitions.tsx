import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import CompetitionCard, { type CompetitionProps } from "@/components/CompetitionCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data with real images
import rocketImg from "@assets/generated_images/rocket_competition.png";
import aiImg from "@assets/generated_images/ai_competition.png";
import droneImg from "@assets/generated_images/drone_competition.png";
import roboticsImg from "@assets/generated_images/robotics_competition.png";
import agriImg from "@assets/generated_images/agritech_competition.png";
import heroBg from "@assets/generated_images/teknofest_hero_background.png"; // reusing as fallback

const COMPETITIONS: CompetitionProps[] = [
  {
    id: "1",
    title: "Rocket Competition",
    category: "Aerospace",
    image: rocketImg,
    status: "open",
    deadline: "Mar 15, 2025",
    teamSize: "3-5 Members",
    prize: "₺100,000",
  },
  {
    id: "2",
    title: "Artificial Intelligence in Health",
    category: "AI & Software",
    image: aiImg,
    status: "open",
    deadline: "Apr 01, 2025",
    teamSize: "2-4 Members",
    prize: "₺80,000",
  },
  {
    id: "3",
    title: "Fighting UAV Competition",
    category: "Aerospace",
    image: droneImg,
    status: "coming_soon",
    deadline: "May 10, 2025",
    teamSize: "4-6 Members",
    prize: "₺150,000",
  },
  {
    id: "4",
    title: "Industrial Robotics",
    category: "Robotics",
    image: roboticsImg,
    status: "open",
    deadline: "Mar 20, 2025",
    teamSize: "3-5 Members",
    prize: "₺90,000",
  },
  {
    id: "5",
    title: "Agricultural Technologies",
    category: "Agriculture",
    image: agriImg,
    status: "closed",
    deadline: "Jan 15, 2025",
    teamSize: "2-5 Members",
    prize: "₺75,000",
  },
  {
    id: "6",
    title: "Smart Transportation",
    category: "Transportation",
    image: heroBg,
    status: "open",
    deadline: "Apr 15, 2025",
    teamSize: "3-5 Members",
    prize: "₺85,000",
  },
];

const CATEGORIES = ["All", "Aerospace", "AI & Software", "Robotics", "Agriculture", "Transportation"];

export default function CompetitionsPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompetitions = COMPETITIONS.filter((comp) => {
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
              {filteredCompetitions.length > 0 ? (
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
