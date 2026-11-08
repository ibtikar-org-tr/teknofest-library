import { Mic2, MessagesSquare, LayoutGrid, ChefHat } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import type { ProgramId } from '@/i18n/types'
import { useLocale } from '@/i18n/locale-provider'

const PROGRAM_ICONS: Record<ProgramId, typeof Mic2> = {
  stars: Mic2,
  panels: MessagesSquare,
  exhibition: LayoutGrid,
  kitchen: ChefHat,
}

export function ProgramSection() {
  const { t } = useLocale()

  return (
    <section id="program" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.program.label} />
        <h2 className="anim-title mt-6 max-w-xl font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {t.program.title}
        </h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {t.program.items.map((item) => {
            const Icon = PROGRAM_ICONS[item.id]
            return (
              <article
                key={item.id}
                className="anim-card flex flex-col rounded-xl border border-border/50 bg-card p-7 shadow-sm transition-transform hover:-translate-y-1 md:p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                    <Icon className="size-5 text-white" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {item.kicker}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold leading-snug text-foreground">{item.title}</h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                <ul className="mt-6 flex flex-col gap-2">
                  {item.points.map((point) => (
                    <li
                      key={point}
                      className="border-s-2 border-primary ps-3 text-pretty text-sm leading-relaxed text-foreground/80"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
