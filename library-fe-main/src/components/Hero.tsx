import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import heroBg from "@assets/generated_images/teknofest_hero_background.png";
import { useLanguage } from "@/lib/LanguageContext";
import { useRef } from "react";

export default function Hero() {
  const { t, direction } = useLanguage();
  const isRtl = direction === "rtl";
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const scrollToCompetitions = () => {
    document
      .getElementById("mainpage_competitions_section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] w-full overflow-hidden flex items-end md:items-center"
    >
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover scale-105"
        />
        {/* Cinematic overlays — keep the festival image dominant, text readable */}
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,12,24,0.88)_0%,rgba(8,12,24,0.55)_42%,rgba(8,12,24,0.2)_70%,rgba(8,12,24,0.35)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,12,24,0.75)_0%,transparent_42%)]" />
        <motion.div
          aria-hidden
          className="absolute -left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        style={{ opacity, y: contentY }}
        className="container relative z-10 px-4 pb-24 pt-32 md:pb-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl text-white"
        >
          <p className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-wide mb-5">
            TK<span className="text-primary">Library</span>
          </p>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide text-white/95 mb-4 max-w-2xl">
            {t("hero.title_start")}{" "}
            <span className="text-primary">{t("hero.title_end")}</span>
          </h1>

          <p className="text-base md:text-lg text-white/75 mb-9 max-w-xl leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={scrollToCompetitions}
              size="lg"
              className="h-12 px-7 rounded-sm bg-primary text-white hover:bg-primary/90 font-semibold tracking-wide"
            >
              {t("hero.discover")}
            </Button>
            <button
              type="button"
              onClick={scrollToCompetitions}
              className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              {t("hero.browse")}
              <ArrowDown className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.35 }}
        className={`pointer-events-none absolute bottom-0 ${isRtl ? "left-0 origin-left" : "right-0 origin-right"} h-1 w-2/5 bg-primary`}
      />
    </section>
  );
}
