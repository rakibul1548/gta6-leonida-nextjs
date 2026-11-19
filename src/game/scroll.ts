import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let velocity = 0
const ticks = new Set<(t: number, dt: number) => void>()

export function initScroll(smooth: boolean) {
  if (lenis) lenis.destroy()
  lenis = null
  if (smooth) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false })
    lenis.on('scroll', (l: Lenis) => {
      velocity = l.velocity
      ScrollTrigger.update()
    })
  } else {
    let last = window.scrollY
    window.addEventListener(
      'scroll',
      () => {
        velocity = window.scrollY - last
        last = window.scrollY
        ScrollTrigger.update()
      },
      { passive: true },
    )
  }
}

let started = false
export function startTicker() {
  if (started) return
  started = true
  gsap.ticker.lagSmoothing(500, 33)
  let prev = performance.now()
  gsap.ticker.add((time) => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - prev) / 1000)
    prev = now
    lenis?.raf(time * 1000)
    if (!lenis) velocity *= 0.9
    ticks.forEach((fn) => fn(now / 1000, dt))
  })
}

export const onTick = (fn: (t: number, dt: number) => void) => {
  ticks.add(fn)
  return () => {
    ticks.delete(fn)
  }
}

export const getVelocity = () => velocity
export const scrollY = () => (lenis ? lenis.scroll : window.scrollY)

export function scrollTo(target: number | HTMLElement | string, opts: { immediate?: boolean; offset?: number; duration?: number } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (el == null) return
  if (lenis) {
    lenis.scrollTo(el as number | HTMLElement, { immediate: opts.immediate, offset: opts.offset ?? 0, duration: opts.duration ?? 1.4, force: true, lock: false })
  } else {
    const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0)
    window.scrollTo({ top: y, behavior: opts.immediate ? 'auto' : 'smooth' })
  }
}

export function lockScroll(lock: boolean) {
  if (lenis) {
    if (lock) lenis.stop()
    else lenis.start()
  }
  document.documentElement.classList.toggle('is-locked', lock)
  document.body.classList.toggle('is-locked', lock)
  if (lock) {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  }
}

export function elTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + scrollY()
}
