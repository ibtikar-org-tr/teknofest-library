import { Compass, Star, MessagesSquare, Store, ChefHat, Users2, Sparkles } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'

const ICONS = [Compass, Star, MessagesSquare, Store, ChefHat, Users2]

export function AimsSection() {
  const { t } = useLocale()

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.benefits.label} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.benefits.items.map((aim, index) => {
            const Icon = ICONS[index] ?? Sparkles
            return (
              <div
                key={aim.title}
                className="anim-card rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold leading-snug text-foreground">{aim.title}</h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">{aim.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
