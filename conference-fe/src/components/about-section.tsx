import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'

export function AboutSection() {
  const { t } = useLocale()

  const panels = [
    { tag: t.about.vision, body: t.about.visionBody },
    { tag: t.about.mission, body: t.about.missionBody },
  ]

  return (
    <section id="about" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.about.label} />

        <div className="mt-8 grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6">
            <h2 className="anim-title text-balance font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {t.about.title}
            </h2>
            <p className="anim-text mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground">{t.about.body}</p>
          </div>

          <div className="grid gap-4 md:col-span-6">
            {panels.map((panel) => (
              <div key={panel.tag} className="anim-card rounded-xl border border-border/50 bg-card p-8 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">{panel.tag}</span>
                <p className="mt-4 text-pretty leading-relaxed text-foreground/85">&ldquo;{panel.body}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
