import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'

export function PrinciplesSection() {
  const { t } = useLocale()

  return (
    <section className="bg-secondary py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.values.label} />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {t.values.items.map((item, index) => (
            <div
              key={item.title}
              className="anim-card flex flex-col justify-between gap-6 rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <span className="font-display text-sm font-bold text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-base font-bold text-foreground">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
