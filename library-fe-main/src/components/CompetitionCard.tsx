import LangLink from "@/components/LangLink";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import type { CompetitionType } from "@/lib/competitions";

export interface CompetitionProps {
  id: string;
  title: string;
  category: string;
  image: string;
  status: "open" | "closed" | "coming_soon";
  deadline: string;
  teamSize: string;
  prize: string;
  tkNumber?: string;
  t3kysNumber?: string;
  years?: number[];
  applicationLink?: string;
  type?: CompetitionType | null;
}

export default function CompetitionCard({
  competition,
  index,
}: {
  competition: CompetitionProps;
  index: number;
}) {
  const { t } = useLanguage();

  const statusColors = {
    open: "bg-emerald-500/15 text-emerald-100 border-emerald-400/30",
    closed: "bg-red-500/15 text-red-100 border-red-400/30",
    coming_soon: "bg-amber-500/15 text-amber-100 border-amber-400/30",
  };

  const statusText = {
    open: t("card.applicationsOpen"),
    closed: t("card.applicationsClosed"),
    coming_soon: t("card.comingSoon"),
  };

  const metaBits = [
    competition.years && competition.years.length > 0
      ? competition.years.join(", ")
      : null,
    competition.teamSize && competition.teamSize !== t("card.notSpecified")
      ? competition.teamSize
      : null,
  ].filter(Boolean) as string[];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
      className="group h-full opacity-100"
    >
      <LangLink href={`/competition/${competition.id}`} className="block h-full">
        <div className="relative h-full overflow-hidden border border-border/70 bg-card transition-colors duration-300 group-hover:border-primary/40">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={competition.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,12,24,0.92)_0%,rgba(8,12,24,0.35)_45%,rgba(8,12,24,0.15)_100%)]" />

            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 rtl:left-3 rtl:right-auto rtl:items-start">
              <Badge
                variant="outline"
                className={`backdrop-blur-sm border ${statusColors[competition.status]}`}
              >
                {statusText[competition.status]}
              </Badge>
              {competition.type && (
                <Badge
                  variant="outline"
                  className="border-white/30 bg-black/45 text-white backdrop-blur-sm"
                >
                  {competition.type === "innovative"
                    ? t("card.innovative")
                    : t("card.competitive")}
                </Badge>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-10">
              <h3 className="text-white text-lg md:text-xl font-bold font-display leading-snug line-clamp-2">
                {competition.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              {metaBits.length > 0 ? (
                <>
                  <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{metaBits.join(" · ")}</span>
                </>
              ) : (
                <span className="text-muted-foreground/80">{t("card.viewDetails")}</span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 rounded-sm px-2"
              tabIndex={-1}
            >
              {t("card.viewDetails")}
            </Button>
          </div>
        </div>
      </LangLink>
    </motion.article>
  );
}
