import { Rocket, Twitter, Instagram } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { PiTelegramLogo } from "react-icons/pi";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg">
                <Rocket className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-display tracking-wider">
                TK<span className="text-primary">Library</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              {/* <a href="#" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-primary hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a> */}
              <a href="#" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-primary hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-primary hover:text-white transition-colors">
                <PiTelegramLogo className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.competitions')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.announcements')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.results')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.faq')}</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-bold text-lg mb-6">{t('footer.categories')}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.technology')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.education')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.environment')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t('footer.links.rocket')}</a></li>
            </ul>
          </div>

          {/* Contact */}
          {/* <div>
            <h4 className="font-display font-bold text-lg mb-6">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Teknofest Avenue, Innovation District, Istanbul, Turkey</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+90 212 123 45 67</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>contact@teknofest.org</span>
              </li>
            </ul>
          </div> */}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            {t('footer.rights')}
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-primary">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
