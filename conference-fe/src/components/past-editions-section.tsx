import { ArrowLeft } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'
import { TAC_2023_HERO_IMAGE } from '@/lib/tac-2023-images'
import { TAC_2024_HERO_IMAGE } from '@/lib/tac-2024-images'
import { buildPageHref, navigateToPage, type Page } from '@/lib/page-url'

export function PastEditionsSection() {
  const { t } = useLocale()
  const p = t.pastEditions

  const editions: {
    page: Page
    href: string
    image: string
    title: string
    body: string
    link: string
  }[] = [
    {
      page: 'tac-2024',
      href: buildPageHref('tac-2024'),
      image: TAC_2024_HERO_IMAGE,
      title: p.tac2024Title,
      body: p.tac2024Body,
      link: p.tac2024Link,
    },
    {
      page: 'tac-2023',
      href: buildPageHref('tac-2023'),
      image: TAC_2023_HERO_IMAGE,
      title: p.tac2023Title,
      body: p.tac2023Body,
      link: p.tac2023Link,
    },
  ]

  return (
    <section id="past-editions" className="bg-card/30 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={p.label} />
        <h2 className="mt-8 max-w-3xl text-balance font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {p.title}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{p.body}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {editions.map((edition) => (
            <a
              key={edition.page}
              href={edition.href}
              onClick={(e) => navigateToPage(e, edition.page)}
              className="group block transition-colors"
            >
              <div className="flex h-full items-center gap-4 overflow-hidden border border-border bg-card p-4 transition-colors group-hover:border-primary/40 sm:p-5">
                <img
                  src={edition.image}
                  alt=""
                  className="size-16 shrink-0 bg-secondary object-cover sm:size-20"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold sm:text-base">{edition.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                    {edition.body}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary sm:text-sm">
                    {edition.link}
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-0 ltr:rotate-180" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-4 border border-dashed border-border bg-background/60 px-5 py-4">
          <p className="text-sm font-semibold text-foreground">{p.cancelled2025Label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{p.cancelled2025Body}</p>
        </div>
      </div>
    </section>
  )
}
