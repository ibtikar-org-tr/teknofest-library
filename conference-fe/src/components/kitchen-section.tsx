import { ArrowRight } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'

export function KitchenSection() {
  const { t, dir } = useLocale()

  return (
    <section id="kitchen" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.kitchen.label} />
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary">{t.kitchen.kicker}</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {t.kitchen.title}
        </h2>
        <p className="mt-6 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{t.kitchen.body}</p>

        <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {t.kitchen.stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-card px-5 py-6 shadow-sm">
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</dt>
              <dd dir="ltr" className="mt-2 font-display text-3xl font-bold text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-16 font-display text-xl font-bold text-foreground">{t.kitchen.stepsLabel}</h3>
        <ol className="mt-6 grid gap-6 md:grid-cols-2">
          {t.kitchen.steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border/50 bg-card p-7 shadow-sm">
              <span className="text-xs font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
              <h4 className="mt-3 font-display text-lg font-bold text-foreground">{step.title}</h4>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid overflow-hidden rounded-2xl border border-border/50 md:grid-cols-12">
          <div className="bg-card p-8 md:col-span-7">
            <h3 className="font-display text-xl font-bold text-foreground">{t.kitchen.mentorsTitle}</h3>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{t.kitchen.mentorsBody}</p>
          </div>
          <aside className="flex flex-col justify-between gap-6 bg-navy p-8 text-navy-foreground md:col-span-5">
            <p className="text-pretty leading-relaxed text-navy-foreground/80">{t.footer.blurb}</p>
            <a
              href={LINKS.register}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center self-start bg-primary px-6 font-bold text-white skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform hover:scale-105"
            >
              <span className="flex items-center gap-2 skew-x-[10deg] rtl:skew-x-[-10deg]">
                {t.nav.registerNow}
                <ArrowRight className={cn('size-4', dir === 'rtl' && 'rotate-180')} />
              </span>
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}
