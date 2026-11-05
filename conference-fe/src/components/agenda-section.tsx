import { useState } from 'react'
import { SectionLabel } from '@/components/section-label'
import type { DayId } from '@/i18n/types'
import { useLocale } from '@/i18n/locale-provider'
import { cn } from '@/lib/utils'

export function AgendaSection() {
  const { t } = useLocale()
  const [activeDay, setActiveDay] = useState<DayId>('day1')
  const day = t.agenda.days.find((item) => item.id === activeDay) ?? t.agenda.days[0]

  return (
    <section id="agenda" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.agenda.label} />
        <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {t.agenda.title}
        </h2>

        <div role="tablist" aria-label={t.agenda.label} className="mt-10 grid gap-4 sm:grid-cols-2">
          {t.agenda.days.map((item) => {
            const selected = item.id === day.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveDay(item.id)}
                className={cn(
                  'rounded-xl border p-5 text-start transition-all',
                  selected
                    ? 'border-primary bg-primary text-white shadow-lg'
                    : 'border-border/50 bg-card hover:-translate-y-0.5 hover:border-primary/40',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest',
                    selected ? 'text-white/80' : 'text-muted-foreground',
                  )}
                >
                  {item.kicker} · <span dir="ltr">{item.hours}</span>
                </span>
                <span className="mt-1 block font-display text-lg font-bold">{item.title}</span>
                <span className={cn('mt-2 block text-sm leading-relaxed', selected ? 'text-white/80' : 'text-muted-foreground')}>
                  {item.subtitle}
                </span>
              </button>
            )
          })}
        </div>

        <ol className="mt-8 overflow-hidden rounded-xl border border-border/50 bg-card">
          {day.items.map((item, index) => (
            <li
              key={`${day.id}-${item.time}-${item.title}`}
              className={cn(
                'grid gap-4 px-5 py-6 md:grid-cols-12 md:gap-8 md:px-8',
                index !== 0 && 'border-t border-border/50',
              )}
            >
              <div className="md:col-span-3">
                <span dir="ltr" className="text-xs font-bold uppercase tracking-widest text-primary">
                  {item.time}
                </span>
                <span className="mt-2 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t.agenda.kindLabel[item.kind]}
                </span>
              </div>
              <div className="md:col-span-9">
                <h3 className="font-display text-lg font-bold leading-snug text-foreground">{item.title}</h3>
                {item.body ? (
                  <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{item.body}</p>
                ) : null}
                {item.topics?.length ? (
                  <ul className="mt-4 flex flex-col gap-2">
                    {item.topics.map((topic) => (
                      <li
                        key={`${topic.title}-${topic.tr ?? ''}`}
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-s-2 border-primary ps-3"
                      >
                        <span className="text-sm text-foreground/85">{topic.title}</span>
                        {topic.tr ? (
                          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            {topic.tr}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
