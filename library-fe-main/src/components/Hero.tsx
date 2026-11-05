import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBg from "@assets/generated_images/teknofest_hero_background.png";
import { useLanguage } from "@/lib/LanguageContext";
import { useRef } from "react";

export default function Hero() {
  const { t, direction } = useLanguage();
  const isRtl = direction === 'rtl';
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  } as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div ref={ref} className="relative h-[80vh] min-h-150 w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Teknofest Hero"
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          <motion.div variants={textVariants} className="inline-block px-3 py-1 mb-4 border border-primary/30 bg-primary/10 rounded-full">
            <span className="text-primary font-bold tracking-widest text-xs uppercase">
              {t('hero.tag')}
            </span>
          </motion.div>
          
          <motion.h1 variants={textVariants} className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6 text-foreground">
            {t('hero.title_start')} <br />
            <motion.span 
              className="text-transparent bg-clip-text bg-linear-to-r from-primary to-red-600 inline-block"
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200%" }}
            >
              {t('hero.title_end')}
            </motion.span>
          </motion.h1>
          
          <motion.p variants={textVariants} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
            {t('hero.description')}
          </motion.p>
          
          <motion.div variants={textVariants} className="flex flex-col sm:flex-row gap-4">
            <Button 
                onClick={() => {
                const competitionsSection = document.getElementById('mainpage_competitions_section');
                if (competitionsSection) {
                  competitionsSection.scrollIntoView({ behavior: 'smooth' });
                } else { console.warn("Competitions section not found") }
                }}
                size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 rounded-none skew-x-[-10deg] rtl:skew-x-10 transition-transform hover:scale-105 active:scale-95 duration-200">
              <span className="skew-x-10 rtl:skew-x-[-10deg]">{t('hero.discover')}</span>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 text-foreground hover:bg-primary/5 text-lg px-8 h-14 rounded-none skew-x-[-10deg] rtl:skew-x-10 transition-transform hover:scale-105 active:scale-95 duration-200">
              <span className="skew-x-10 rtl:skew-x-[-10deg] flex items-center gap-2">
                {t('hero.watch')} 
                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className={`absolute bottom-0 ${isRtl ? 'left-0 origin-left' : 'right-0 origin-right'} w-1/3 h-2 bg-primary`} 
      />
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className={`absolute bottom-2 ${isRtl ? 'left-0 origin-left' : 'right-0 origin-right'} w-1/4 h-2 bg-primary/50`} 
      />
    </div>
  );
}
