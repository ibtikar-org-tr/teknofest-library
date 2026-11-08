import { useRef, type ReactNode } from 'react'
import { useLocale } from '@/i18n/locale-provider'
import { gsap, prefersReducedMotion, revealTween, ScrollTrigger, useGSAP } from '@/lib/gsap'

export function SiteAnimations({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { lang, dir } = useLocale()
  const slideFrom = dir === 'rtl' ? 28 : -28

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      gsap.set('.anim-label', { opacity: 0, y: 20, filter: 'blur(4px)' })
      ScrollTrigger.batch('.anim-label', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(
            batch,
            revealTween({
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 0.75,
              stagger: 0.06,
              ease: 'power3.out',
              clearProps: 'transform,filter',
            }),
          ),
      })

      gsap.set('.anim-title', { opacity: 0, y: 56, scale: 0.985 })
      ScrollTrigger.batch('.anim-title', {
        start: 'top 86%',
        once: true,
        onEnter: (batch) =>
          gsap.to(
            batch,
            revealTween({
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.05,
              stagger: 0.1,
              ease: 'power4.out',
            }),
          ),
      })

      gsap.set('.anim-text', { opacity: 0, y: 28 })
      ScrollTrigger.batch('.anim-text', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, revealTween({ opacity: 1, y: 0, duration: 0.85, stagger: 0.07, ease: 'power3.out' })),
      })

      gsap.set('.anim-card', { opacity: 0, y: 56, scale: 0.94, rotateX: 4 })
      ScrollTrigger.batch('.anim-card', {
        start: 'top 90%',
        once: true,
        interval: 0.08,
        batchMax: 6,
        onEnter: (batch) =>
          gsap.to(
            batch,
            revealTween({
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.9,
              stagger: 0.1,
              ease: 'power3.out',
              transformPerspective: 900,
            }),
          ),
      })

      gsap.set('.anim-row', { opacity: 0, x: slideFrom })
      ScrollTrigger.batch('.anim-row', {
        start: 'top 93%',
        once: true,
        interval: 0.05,
        batchMax: 8,
        onEnter: (batch) =>
          gsap.to(batch, revealTween({ opacity: 1, x: 0, duration: 0.65, stagger: 0.045, ease: 'power3.out' })),
      })

      gsap.set('.anim-panel', { opacity: 0, y: 40, scale: 0.96 })
      ScrollTrigger.batch('.anim-panel', {
        start: 'top 84%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, revealTween({ opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power4.out' })),
      })

      gsap.set('.anim-cta', { opacity: 0, y: 22, scale: 0.98 })
      ScrollTrigger.batch('.anim-cta', {
        start: 'top 94%',
        once: true,
        onEnter: (batch) =>
          gsap.to(
            batch,
            revealTween({ opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.09, ease: 'power3.out' }),
          ),
      })

      gsap.utils.toArray<HTMLElement>('.anim-parallax').forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -6, scale: 1.06 },
          {
            yPercent: 6,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('.anim-scale-in').forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.96, opacity: 0.7 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top 96%',
              end: 'top 50%',
              scrub: 0.8,
            },
          },
        )
      })

      ScrollTrigger.refresh()
    },
    { scope: rootRef, dependencies: [lang, dir], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef} className="relative [perspective:1200px]">
      {children}
    </div>
  )
}
