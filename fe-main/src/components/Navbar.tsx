import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket, MessageSquare, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type Language } from "@/lib/translations";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { name: t('nav.competitions'), href: "/" },
    { name: t('nav.resources'), href: "/resources" },
    { name: t('nav.dates'), href: "/dates" },
    { name: t('nav.chatbot'), href: "/chatbot" },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <motion.nav 
      className={cn(
        "fixed top-0 w-full z-50 border-b transition-all duration-300",
        isScrolled 
          ? "bg-background/95 backdrop-blur-md border-border h-16 shadow-md" 
          : "bg-background/50 backdrop-blur-sm border-white/10 h-20 supports-[backdrop-filter]:bg-background/30"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-10 h-10 flex items-center justify-center bg-primary rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <Rocket className="text-white w-6 h-6 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
          </div>
          <span className="text-2xl font-bold font-display tracking-wider text-foreground">
            TK<span className="text-primary">Library</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-sm font-medium transition-colors uppercase tracking-wide border-b-2 border-transparent hover:text-primary relative",
                location === link.href ? "text-primary" : "text-foreground/80"
              )}
            >
              {link.name}
              {location === link.href && (
                <motion.div 
                  layoutId="underline" 
                  className="absolute left-0 right-0 bottom-[-2px] h-[2px] bg-primary"
                />
              )}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-border mx-2"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(language === lang.code && "bg-primary/10 text-primary")}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/chatbot">
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white font-bold tracking-wide uppercase gap-2 hover:scale-105 transition-transform duration-200">
              <MessageSquare className="w-4 h-4" />
              {t('nav.askAi')}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(language === lang.code && "bg-primary/10 text-primary")}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-background border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    href={link.href}
                    className={cn(
                      "text-lg font-medium hover:text-primary transition-colors block py-2",
                      location === link.href ? "text-primary" : "text-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/chatbot" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary text-white uppercase font-bold">
                    {t('nav.askAi')}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
