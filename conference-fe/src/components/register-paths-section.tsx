import { ArrowRight } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'

export function RegisterPathsSection() {
  const { t, dir } = useLocale()
  const isRtl = dir === 'rtl'

  const paths = [
    {
      href: LINKS.registerStudentStartups,
      label: t.registerPaths.studentStartups,
    },
    {
      href: LINKS.registerTeknofestTeams,
      label: t.registerPaths.teknofestTeams,
    },
  ] as const

  return (
    <section id="register-paths" className="relative z-10 border-y border-border/60 bg-navy py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel title={t.registerPaths.label} />
        <h2 className="mt-4 max-w-2xl font-display text-2xl font-bold leading-tight text-navy-foreground md:text-3xl">
          {t.registerPaths.title}
        </h2>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-navy-foreground/75">
          {t.registerPaths.body}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {paths.map((path) => (
            <a
              key={path.href}
              href={path.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center border border-navy-foreground/25 bg-navy-foreground/5 px-6 font-bold text-navy-foreground skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform hover:scale-105 hover:bg-navy-foreground/10"
            >
              <span className="flex items-center gap-2 skew-x-[10deg] rtl:skew-x-[-10deg]">
                {path.label}
                <ArrowRight className={cn('size-4', isRtl && 'rotate-180')} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
