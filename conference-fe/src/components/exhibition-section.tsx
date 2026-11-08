import {
  ArrowRight,
  BookOpen,
  Camera,
  GraduationCap,
  Handshake,
  Rocket,
  Trophy,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'

const ITEM_ICONS = [Rocket, GraduationCap, UsersRound, Trophy] as const
const CORNER_ICONS = [UserPlus, Handshake, BookOpen, Camera] as const

export function ExhibitionSection() {
  const { t, dir } = useLocale()
  const isRtl = dir === 'rtl'

  return (
    <section id="exhibition" className="relative overflow-hidden bg-secondary py-20 md:py-28">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-b from-primary/8 via-transparent to-transparent',
          isRtl ? 'left-0' : 'right-0',
        )}
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel title={t.exhibition.label} />
            <h2 className="anim-title mt-6 max-w-2xl font-display text-3xl font-bold leading-tight text-foreground md:text-5xl">
              {t.exhibition.title}
            </h2>
          </div>
          <p className="anim-text max-w-xl text-pretty leading-relaxed text-muted-foreground lg:col-span-5 lg:pb-1">
            {t.exhibition.body}
          </p>
        </div>

        <div className="anim-panel mt-12 border-y border-border/70 bg-background/70 backdrop-blur-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {t.exhibition.items.map((item, index) => {
              const Icon = ITEM_ICONS[index] ?? Rocket
              return (
                <article
                  key={item.title}
                  className={cn(
                    'anim-card group relative flex flex-col gap-4 p-6 transition-colors duration-300 hover:bg-primary/[0.04] md:p-7',
                    index < t.exhibition.items.length - 1 && 'border-border/70 sm:border-e',
                    index < 2 && 'border-b border-border/70 lg:border-b-0',
                  )}
                >
                  <div className="absolute inset-x-0 top-0 h-1 origin-start scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-10 items-center justify-center bg-primary text-white transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-widest text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold leading-snug text-foreground md:text-xl">
                    {item.title}
                  </h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </article>
              )
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-start">
          <a
            href={LINKS.registerStudentStartups}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center bg-primary px-6 font-bold text-white skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform hover:scale-105"
          >
            <span className="flex items-center gap-2 skew-x-[10deg] rtl:skew-x-[-10deg]">
              {t.exhibition.registerCta}
              <ArrowRight className={cn('size-4', isRtl && 'rotate-180')} />
            </span>
          </a>
        </div>

        <div className="mt-16 md:mt-20">
          <SectionLabel title={t.exhibition.cornersLabel} />
          <h3 className="anim-title mt-6 max-w-2xl font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">
            {t.exhibition.cornersTitle}
          </h3>

          <ol className="relative mt-10 grid gap-0 md:grid-cols-4">
            <div
              aria-hidden="true"
              className="absolute start-[12.5%] end-[12.5%] top-5 hidden h-px bg-border md:block"
            />
            {t.exhibition.corners.map((item, index) => {
              const Icon = CORNER_ICONS[index] ?? Camera
              return (
                <li
                  key={item.title}
                  className={cn(
                    'anim-card relative flex flex-col gap-4 border-border/60 py-6 md:border-0 md:px-4 md:py-0',
                    index < t.exhibition.corners.length - 1 && 'border-b md:border-b-0',
                  )}
                >
                  <div className="relative z-10 flex size-10 items-center justify-center border border-border bg-background text-primary shadow-sm transition-transform duration-300 hover:scale-110">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-mono text-[0.65rem] font-bold tracking-[0.2em] text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h4 className="mt-2 font-display text-lg font-bold text-foreground">{item.title}</h4>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
