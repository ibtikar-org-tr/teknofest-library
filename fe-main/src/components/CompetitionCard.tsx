import { Link } from "wouter";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Trophy, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export interface CompetitionProps {
  id: string;
  title: string;
  category: string;
  image: string;
  status: "open" | "closed" | "coming_soon";
  deadline: string;
  teamSize: string;
  prize: string;
}

export default function CompetitionCard({ competition, index }: { competition: CompetitionProps; index: number }) {
  const { t } = useLanguage();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const statusColors = {
    open: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    closed: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
    coming_soon: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
  };

  const statusText = {
    open: t('card.applicationsOpen'),
    closed: t('card.applicationsClosed'),
    coming_soon: t('card.comingSoon'),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 50 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
    >
      <div 
        className="group relative h-full rounded-xl border border-border/50 bg-card overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                hsl(var(--primary) / 0.15),
                transparent 80%
              )
            `,
          }}
        />
        
        <Card className="h-full flex flex-col bg-transparent border-none relative z-10">
          {/* Image Container */}
          <div className="relative h-48 overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <motion.img
              src={competition.image}
              alt={competition.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6 }}
            />
            <Badge 
              variant="outline" 
              className={`absolute top-4 right-4 rtl:left-4 rtl:right-auto z-20 backdrop-blur-md border ${statusColors[competition.status]}`}
            >
              {statusText[competition.status]}
            </Badge>
            <div className="absolute bottom-4 left-4 rtl:right-4 rtl:left-auto z-20">
              <span className="text-primary text-xs font-bold uppercase tracking-wider mb-1 block">
                {competition.category}
              </span>
              <h3 className="text-white text-xl font-bold font-display leading-tight line-clamp-2">
                {competition.title}
              </h3>
            </div>
          </div>

          <CardContent className="flex-1 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{competition.deadline}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                <span>{competition.teamSize}</span>
              </div>
              <div className="col-span-2 flex items-center gap-3 text-sm font-medium text-foreground mt-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span>{t('card.prizePool')}: {competition.prize}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pb-6 pt-0">
            <Link href={`/competition/${competition.id}`}>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-white transition-colors group-hover:bg-primary group-hover:text-white">
                {t('card.viewDetails')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
}
