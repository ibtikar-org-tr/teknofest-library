import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { BrandLockup } from '@/components/logomark'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const { t } = useLocale()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '#about', label: t.nav.about },
    { href: '#facts', label: t.nav.facts },
    { href: '#program', label: t.nav.program },
    { href: '#agenda', label: t.nav.agenda },
    { href: '#exhibition', label: t.nav.exhibition },
    { href: '#kitchen', label: t.nav.kitchen },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'h-16 border-border bg-background/95 shadow-md backdrop-blur-md'
          : 'h-20 border-white/10 bg-background/50 backdrop-blur-sm',
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        <a href="#top" aria-label={t.nav.homeAria} className="min-w-0">
          <BrandLockup compact />
        </a>

        <nav className="hidden items-center gap-6 xl:flex" aria-label={t.nav.primaryNav}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}

          <span className="mx-1 h-6 w-px bg-border" />
          <LanguageSwitcher />
          <a
            href={LINKS.register}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-transform hover:scale-105 hover:bg-primary/90"
          >
            {t.nav.registerNow}
          </a>
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-foreground"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          aria-label={t.nav.mobileNav}
          className="absolute inset-x-0 top-full border-b border-border bg-background xl:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href={LINKS.register}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-white"
              >
                {t.nav.registerNow}
              </a>
            </li>
            <li>
              <a
                href={LINKS.registerStudentStartups}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="block py-2 text-base font-medium text-foreground transition-colors hover:text-primary"
              >
                {t.registerPaths.studentStartups}
              </a>
            </li>
            <li>
              <a
                href={LINKS.registerTeknofestTeams}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="block py-2 text-base font-medium text-foreground transition-colors hover:text-primary"
              >
                {t.registerPaths.teknofestTeams}
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
