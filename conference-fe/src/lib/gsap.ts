import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Clears transform after reveal tweens — avoids sticky compositor layers. */
export const REVEAL_CLEAR_PROPS = 'transform'

export function revealTween(overrides: gsap.TweenVars = {}): gsap.TweenVars {
  return {
    ease: 'power2.out',
    overwrite: true,
    clearProps: REVEAL_CLEAR_PROPS,
    ...overrides,
  }
}

export { gsap, ScrollTrigger, useGSAP }
