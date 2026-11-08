import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'

export function FactsSection() {
  const { t } = useLocale()

  return (
    <section id="facts" className="relative bg-background pb-8 pt-10 md:pb-12 md:pt-14">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="anim-panel anim-scale-in rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg backdrop-blur-xl md:p-8">
          <SectionLabel title={t.facts.label} />
          <h2 className="anim-title mt-4 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
            {t.facts.title}
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.facts.items.map((item) => (
              <article
                key={item.label}
                className="anim-card rounded-xl border border-border/50 bg-card p-6 transition-transform hover:-translate-y-1"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-primary">{item.label}</span>
                <p dir="ltr" className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
