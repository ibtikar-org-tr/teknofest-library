import { Share2, Mail, MessageCircle, GitBranch, FileText, GraduationCap } from 'lucide-react'
import { BrandLockup } from '@/components/logomark'
import { LinkedInIcon, TelegramIcon } from '@/components/social-icons'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { buildPageHref, isArchivePage, navigateToPage } from '@/lib/page-url'

const CONNECT_HREFS = [
  { href: LINKS.instagram, key: 'instagram' as const, icon: Share2 },
  { href: LINKS.linkedin, key: 'linkedin' as const, icon: LinkedInIcon },
  { href: LINKS.telegramChannel, key: 'telegramChannel' as const, icon: TelegramIcon },
  { href: LINKS.telegramContact, key: 'telegramContact' as const, icon: TelegramIcon },
  { href: LINKS.whatsapp, key: 'whatsapp' as const, icon: MessageCircle },
  { href: LINKS.email, key: 'email' as const, icon: Mail },
  { href: LINKS.github, key: 'github' as const, icon: GitBranch },
  { href: LINKS.lms, key: 'lms' as const, icon: GraduationCap },
  { href: LINKS.bylaws, key: 'bylaws' as const, icon: FileText },
]

type Partner = {
  name: string
  href?: string
  logo: string
}

const PARTNERS: Partner[] = [
  {
    name: 'الجمعية السورية للذكاء الاصطناعي وريادة الأعمال',
    href: LINKS.saae,
    logo: '/partners/saae_logo.jpeg',
  },
  {
    name: 'تجمع المهندسين السوريين في تركيا',
    href: 'http://mtd.ngo/',
    logo: '/partners/mtd.png',
  },
  {
    name: 'Youth Affairs',
    href: 'https://www.facebook.com/Youthafairs/',
    logo: '/partners/youth-affairs.png',
  },
  {
    name: 'Tulip Technologies',
    href: 'https://www.tuliptechs.com/',
    logo: '/partners/tulip.png',
  },
  {
    name: 'Happy Center',
    href: 'https://www.happycenter.com.tr/',
    logo: '/partners/happy-center.png',
  },
  {
    name: 'Bina',
    href: 'https://binaprogram.org/',
    logo: '/partners/bina.png',
  },
  {
    name: 'Atölye Üsküdar',
    href: 'https://atolyeuskudar.com/',
    logo: '/partners/atolye-uskudar.png',
  },
  {
    name: 'MAPS',
    href: undefined,
    logo: '/partners/maps.png',
  },
  {
    name: 'Babi Alem',
    href: 'https://babialem.org/',
    logo: '/partners/babi-alem.png',
  },
  {
    name: 'Tollabi',
    href: undefined,
    logo: '/partners/tollabi.png',
  },
]

export function SiteFooter() {
  const { t, page, archive } = useLocale()
  const isArchive = isArchivePage(page)
  const homeHref = buildPageHref('home')

  return (
    <footer id="contact" className="mt-12 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandLockup
              compact
              href={isArchive ? homeHref : '#top'}
              onNavigate={isArchive ? (e) => navigateToPage(e, 'home') : undefined}
              className="mb-6"
            />
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{t.footer.blurb}</p>
            <div className="flex flex-wrap gap-3">
              {CONNECT_HREFS.slice(0, 5).map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={item.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                  aria-label={t.footer[item.key]}
                  className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-white"
                >
                  <item.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-display text-lg font-bold">{t.footer.connect}</h4>
            <ul className="space-y-3">
              {CONNECT_HREFS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={item.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t.footer[item.key]}
                  </a>
                </li>
              ))}
            </ul>
            <h4 className="mb-4 mt-8 font-display text-lg font-bold">{t.footer.pastEditions}</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={buildPageHref('tac-2024')}
                  onClick={(e) => navigateToPage(e, 'tac-2024')}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t.nav.tac2024}
                </a>
              </li>
              <li>
                <a
                  href={buildPageHref('tac-2023')}
                  onClick={(e) => navigateToPage(e, 'tac-2023')}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t.nav.tac2023}
                </a>
              </li>
              {isArchive ? (
                <li>
                  <a
                    href={homeHref}
                    onClick={(e) => navigateToPage(e, 'home')}
                    className="text-sm text-primary transition-colors hover:text-primary/80"
                  >
                    {archive?.nav.backTo2026 ?? 'TAC 2026'}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-6 font-display text-lg font-bold">{t.footer.partners}</h4>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PARTNERS.map((partner) => {
                const content = (
                  <img src={partner.logo} alt={partner.name} className="h-10 w-full object-contain" />
                )

                return (
                  <li
                    key={partner.name}
                    className="flex items-center justify-center rounded-lg border border-border bg-background px-3 py-4"
                  >
                    {partner.href ? (
                      <a
                        href={partner.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full"
                        aria-label={partner.name}
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-center text-xs text-muted-foreground md:text-left">{t.footer.rights}</p>
          <p className="text-xs text-muted-foreground">
            {isArchive && archive ? archive.footer.dates : t.footer.location}
          </p>
        </div>
      </div>
    </footer>
  )
}
