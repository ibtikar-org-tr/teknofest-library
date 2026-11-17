import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket, MessageSquare, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import LangLink from "@/components/LangLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Language } from "@/lib/translations";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location === "/";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 40);
  });

  const overHero = isHome && !isScrolled;

  const navLinks = [
    { name: t("nav.competitions"), href: "/" },
    { name: t("nav.resources"), href: "/resources" },
    { name: t("nav.dates"), href: "/dates" },
    { name: t("nav.chatbot"), href: "/chatbot" },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "tr", label: "Türkçe" },
    { code: "ar", label: "العربية" },
  ];

  return (
    <motion.nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-border h-16 shadow-sm"
          : overHero
            ? "bg-transparent border-transparent h-20"
            : "bg-background/80 backdrop-blur-sm border-border/40 h-20",
      )}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <LangLink href="/" className="flex items-center gap-2.5 group">
          <div
            className={cn(
              "relative w-9 h-9 flex items-center justify-center rounded-md overflow-hidden transition-transform duration-300 group-hover:scale-105",
              overHero ? "bg-primary" : "bg-primary",
            )}
          >
            <Rocket className="text-white w-5 h-5" />
          </div>
          <span
            className={cn(
              "text-xl font-bold font-display tracking-wider transition-colors",
              overHero ? "text-white" : "text-foreground",
            )}
          >
            TK<span className="text-primary">Library</span>
          </span>
        </LangLink>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <LangLink
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-sm font-medium uppercase tracking-wide transition-colors",
                location === link.href
                  ? "text-primary"
                  : overHero
                    ? "text-white/80 hover:text-white"
                    : "text-foreground/75 hover:text-primary",
              )}
            >
              {link.name}
              {location === link.href && (
                <motion.div
                  layoutId="underline"
                  className="absolute left-0 right-0 -bottom-1 h-0.5 bg-primary"
                />
              )}
            </LangLink>
          ))}

          <div
            className={cn(
              "h-5 w-px mx-1",
              overHero ? "bg-white/25" : "bg-border",
            )}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2",
                  overHero && "text-white hover:bg-white/10 hover:text-white",
                )}
              >
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

          <LangLink href="/chatbot">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold tracking-wide uppercase gap-2 rounded-sm">
              <MessageSquare className="w-4 h-4" />
              {t("nav.askAi")}
            </Button>
          </LangLink>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", overHero && "text-white hover:bg-white/10")}
              >
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
            className={cn("p-2", overHero ? "text-white" : "text-foreground")}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-background border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <LangLink
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-lg font-medium py-2",
                    location === link.href ? "text-primary" : "text-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </LangLink>
              ))}
              <LangLink href="/chatbot" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-primary text-white uppercase font-bold rounded-sm">
                  {t("nav.askAi")}
                </Button>
              </LangLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
