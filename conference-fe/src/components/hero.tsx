import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useLocale } from '@/i18n/locale-provider'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/utils'
import { gsap, prefersReducedMotion, revealTween, useGSAP } from '@/lib/gsap'

export function Hero() {
  const { t, dir } = useLocale()
  const isRtl = dir === 'rtl'
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const bg = rootRef.current?.querySelector<HTMLElement>('.hero-bg-img')
      const veil = rootRef.current?.querySelector<HTMLElement>('.hero-veil')

      if (prefersReducedMotion()) {
        gsap.set(['.hero-el', '.hero-brand', '.hero-accent', veil, bg], { clearProps: 'all' })
        return
      }

      gsap.set('.hero-el', { opacity: 0, y: 36 })
      gsap.set('.hero-brand', { opacity: 0, y: 64, scale: 0.96, filter: 'blur(8px)' })
      gsap.set('.hero-accent', { scaleX: 0, transformOrigin: isRtl ? '100% 50%' : '0% 50%' })
      if (veil) gsap.set(veil, { opacity: 0.55 })
      if (bg) gsap.set(bg, { scale: 1.18, yPercent: -4 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (bg) {
        tl.to(bg, { scale: 1.08, yPercent: 0, duration: 1.8, ease: 'power2.out' }, 0)
      }
      if (veil) {
        tl.to(veil, { opacity: 1, duration: 1.2, ease: 'power1.out' }, 0.15)
      }

      tl.to('.hero-el-eyebrow', revealTween({ opacity: 1, y: 0, duration: 0.7 }), 0.35)
        .to('.hero-el-line', revealTween({ opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }), 0.5)
        .to(
          '.hero-brand',
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.15,
            ease: 'power4.out',
            clearProps: 'transform,filter',
          },
          0.7,
        )
        .to('.hero-el-body', revealTween({ opacity: 1, y: 0, duration: 0.8 }), 1.05)
        .to('.hero-el-cta', revealTween({ opacity: 1, y: 0, duration: 0.65, stagger: 0.1 }), 1.2)
        .to('.hero-el-link', revealTween({ opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }), 1.4)
        .to('.hero-accent', { scaleX: 1, duration: 0.9, ease: 'power3.inOut', stagger: 0.08 }, 1.25)

      if (bg) {
        gsap.to(bg, {
          yPercent: 8,
          scale: 1.02,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.7,
          },
        })
      }
    },
    { scope: rootRef, dependencies: [dir, t.hero.brandTitle], revertOnUpdate: true },
  )

  return (
    <section
      ref={rootRef}
      id="top"
      className="relative flex min-h-[40rem] w-full items-center overflow-hidden pb-28 pt-28 md:min-h-[80vh] md:pb-32"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/teknofest_hero_background.png"
          alt=""
          className="hero-bg-img h-full w-full scale-110 object-cover will-change-transform"
        />
        <div
          className={cn(
            'hero-veil absolute inset-0',
            isRtl
              ? 'bg-linear-to-l from-background/90 via-background/60 to-transparent'
              : 'bg-linear-to-r from-background/90 via-background/60 to-transparent',
          )}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-20 md:px-8">
        <div className="max-w-3xl">
          <div className="hero-el hero-el-eyebrow mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{t.hero.eyebrow}</span>
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-foreground md:text-7xl">
            <span className="hero-el hero-el-line inline-block">
              {t.hero.titleLine1}
              {t.hero.titleLine2Before ? ` ${t.hero.titleLine2Before}` : ''}{' '}
              {t.hero.titleLine2Accent}
            </span>
            <br />
            <span className="hero-brand inline-block bg-linear-to-r from-accent via-primary to-[#f4a261] bg-clip-text text-transparent">
              {t.hero.brandTitle}
            </span>
          </h1>

          <p className="hero-el hero-el-body mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t.hero.body}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href={LINKS.register}
              target="_blank"
              rel="noreferrer"
              className="hero-el hero-el-cta inline-flex h-14 items-center justify-center bg-primary px-8 text-lg font-bold text-white skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform duration-200 hover:scale-105 hover:bg-primary/90"
            >
              <span className="skew-x-[10deg] rtl:skew-x-[-10deg]">{t.hero.registerNow}</span>
            </a>
            <a
              href="#agenda"
              className="hero-el hero-el-cta inline-flex h-14 items-center justify-center border border-primary/50 bg-background/40 px-8 text-lg font-bold text-foreground backdrop-blur-sm skew-x-[-10deg] rtl:skew-x-[10deg] transition-transform duration-200 hover:scale-105 hover:bg-primary/5"
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
              className="hero-el hero-el-link text-sm font-semibold text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
            >
              {t.registerPaths.studentStartups}
            </a>
            <a
              href={LINKS.registerTeknofestTeams}
              target="_blank"
              rel="noreferrer"
              className="hero-el hero-el-link text-sm font-semibold text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
            >
              {t.registerPaths.teknofestTeams}
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'hero-accent absolute bottom-0 h-2 w-1/3 bg-primary',
          isRtl ? 'left-0' : 'right-0',
        )}
      />
      <div
        className={cn(
          'hero-accent absolute bottom-2 h-2 w-1/4 bg-primary/50',
          isRtl ? 'left-0' : 'right-0',
        )}
      />
    </section>
  )
}
