import { ArrowRight } from 'lucide-react'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'

export function Hero() {
  const { t, dir } = useLocale()
  const isRtl = dir === 'rtl'

  return (
    <section
      id="top"
      className="relative flex min-h-[40rem] w-full items-center overflow-hidden pb-28 pt-28 md:min-h-[80vh] md:pb-32"
    >
      <div className="absolute inset-0 z-0">
        <img
          src="/images/teknofest_hero_background.png"
          alt=""
          className="h-full w-full scale-110 object-cover"
        />
        <div
          className={cn(
            'absolute inset-0',
            isRtl
              ? 'bg-linear-to-l from-background/90 via-background/60 to-transparent'
              : 'bg-linear-to-r from-background/90 via-background/60 to-transparent',
          )}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-20 md:px-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{t.hero.eyebrow}</span>
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-foreground md:text-7xl">
            {t.hero.titleLine1}
            {t.hero.titleLine2Before ? ` ${t.hero.titleLine2Before}` : ''}{' '}
            {t.hero.titleLine2Accent}
            <br />
            <span className="inline-block bg-linear-to-r from-primary to-red-600 bg-clip-text text-transparent">
              {t.hero.brandTitle}
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{t.hero.body}</p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href={LINKS.register}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-14 items-center justify-center bg-primary px-8 text-lg font-bold text-white skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform duration-200 hover:scale-105 hover:bg-primary/90"
            >
              <span className="skew-x-[10deg] rtl:skew-x-[-10deg]">{t.hero.registerNow}</span>
            </a>
            <a
              href="#agenda"
              className="inline-flex h-14 items-center justify-center border border-primary/50 bg-background/40 px-8 text-lg font-bold text-foreground backdrop-blur-sm skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform duration-200 hover:scale-105 hover:bg-primary/5"
            >
              <span className="flex items-center gap-2 skew-x-[10deg] rtl:skew-x-[-10deg]">
                {t.hero.exploreAgenda}
                <ArrowRight className={cn('size-5', isRtl && 'rotate-180')} />
              </span>
            </a>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            <a
              href={LINKS.registerStudentStartups}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
            >
              {t.registerPaths.studentStartups}
            </a>
            <a
              href={LINKS.registerTeknofestTeams}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
            >
              {t.registerPaths.teknofestTeams}
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'absolute bottom-0 h-2 w-1/3 bg-primary',
          isRtl ? 'left-0' : 'right-0',
        )}
      />
      <div
        className={cn(
          'absolute bottom-2 h-2 w-1/4 bg-primary/50',
          isRtl ? 'left-0' : 'right-0',
        )}
      />
    </section>
  )
}
