import { ArrowRight } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'

export function ExhibitionSection() {
  const { t, dir } = useLocale()

  return (
    <section id="exhibition" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.exhibition.label} />
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {t.exhibition.title}
        </h2>
        <p className="mt-6 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{t.exhibition.body}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {t.exhibition.items.map((item, index) => (
            <article
              key={item.title}
              className="rounded-xl border border-border/50 bg-card p-7 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-display text-xl font-bold text-foreground">{item.title}</h3>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>

        <a
          href={LINKS.registerStudentStartups}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex h-12 items-center justify-center bg-primary px-6 font-bold text-white skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform hover:scale-105"
        >
          <span className="flex items-center gap-2 skew-x-[10deg] rtl:skew-x-[-10deg]">
            {t.exhibition.registerCta}
            <ArrowRight className={cn('size-4', dir === 'rtl' && 'rotate-180')} />
          </span>
        </a>

        <div className="mt-16">
          <SectionLabel title={t.exhibition.cornersLabel} />
          <h3 className="mt-6 max-w-xl font-display text-2xl font-bold text-foreground">
            {t.exhibition.cornersTitle}
          </h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {t.exhibition.corners.map((item, i) => (
              <article
                key={item.title}
                className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-display text-lg font-bold text-foreground">{item.title}</span>
                  <span className="shrink-0 text-xs font-bold text-primary">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
