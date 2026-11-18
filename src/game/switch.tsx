import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { clipPoster, shotUrl } from '../content/media'
import { sfx } from '../audio/engine'
import { get, useGame } from './store'
import { scrollTo } from './scroll'

type Opts = { title: string; sub?: string; accent?: string; portrait?: 'jason' | 'lucia'; mid?: () => void }
type Job = Opts & { sub: string; view: string; resolve: () => void }

const VIEWS = ['vice-city-27', 'vice-city-03', 'leonida-keys-02', 'vice-city-12', 'grassrivers-03']
let viewIx = 0
const queue: Job[] = []
let pump: (() => void) | null = null
let active = false

export function satellite(opts: Opts) {
  return new Promise<void>((resolve) => {
    if (!pump || get().reduced) {
      opts.mid?.()
      resolve()
      return
    }
    queue.push({ sub: 'Satellite · Leonida', ...opts, view: VIEWS[viewIx++ % VIEWS.length], resolve })
    if (!active) pump()
  })
}

export function fastTravel(id: string, label: string) {
  const el = document.getElementById(id)
  if (!el) return
  return satellite({ title: label, sub: 'Fast travel', mid: () => scrollTo(el, { immediate: true }) })
}

export function SatelliteSwitch() {
  const root = useRef<HTMLDivElement>(null)
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    pump = () => {
      const next = queue.shift()
      if (!next) return
      active = true
      setJob(next)
    }
    let idle = 0
    const warm = () => {
      VIEWS.forEach((id) => {
        const i = new Image()
        i.src = shotUrl(id, 1280)
      })
    }
    const unsub = useGame.subscribe((s) => {
      if (s.entered && !idle) idle = window.setTimeout(warm, 6000)
    })
    return () => {
      pump = null
      unsub()
      window.clearTimeout(idle)
    }
  }, [])

  useEffect(() => {
    if (!job || !root.current) return
    const el = root.current
    const img = el.querySelector<HTMLElement>('.sat__img')!
    const label = el.querySelector<HTMLElement>('.sat__label')!
    const ring = el.querySelector<HTMLElement>('.sat__ring')!
    const face = el.querySelector<HTMLElement>('.sat__face')
    const page = document.querySelector<HTMLElement>('#page')
    sfx.whoosh(1.5)
    const done = () => {
      gsap.set(el, { visibility: 'hidden', '--o': 0 })
      if (page) gsap.set(page, { clearProps: 'filter,scale,transform,transformOrigin' })
      job.resolve()
      active = false
      setJob(null)
      if (queue.length) window.setTimeout(() => pump?.(), 30)
    }
    const tl = gsap.timeline({ onComplete: done })
    gsap.set(el, { visibility: 'visible', '--o': 0 })
    if (page) gsap.set(page, { transformOrigin: `50% ${window.scrollY + window.innerHeight / 2}px` })
    tl.to(el, { '--o': 1, duration: 0.42, ease: 'power2.in' }, 0)
    if (page) tl.to(page, { filter: 'blur(10px) saturate(1.4)', scale: 0.94, duration: 0.42, ease: 'power2.in' }, 0)
    if (page) tl.set(page, { clearProps: 'filter,scale,transform,transformOrigin' }, 0.58)
    tl.fromTo(img, { scale: 2.6, filter: 'blur(14px) saturate(1.6)', xPercent: 0, yPercent: 0 }, { scale: 1.08, filter: 'blur(0px) saturate(1.2)', duration: 0.55, ease: 'power3.out' }, 0.1)
    tl.fromTo(ring, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 0.35)
    if (face) tl.fromTo(face, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.2)' }, 0.42)
    tl.fromTo(label, { y: 40, opacity: 0, skewX: -12 }, { y: 0, opacity: 1, skewX: 0, duration: 0.42, ease: 'expo.out' }, 0.38)
    tl.add(() => job.mid?.(), 0.62)
    tl.to(img, { xPercent: -5, yPercent: 2, duration: 0.7, ease: 'sine.inOut' }, 0.6)
    tl.to([ring, face].filter(Boolean), { scale: 0.6, opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.12)
    tl.to(img, { scale: 3, filter: 'blur(16px)', duration: 0.5, ease: 'power3.in' }, 1.15)
    tl.to(label, { opacity: 0, y: -24, duration: 0.25 }, 1.18)
    tl.to(el, { '--o': 0, duration: 0.4, ease: 'power2.out' }, 1.3)
    return () => {
      tl.kill()
    }
  }, [job])

  return (
    <div ref={root} className="sat" aria-hidden={!job} style={{ visibility: 'hidden' }}>
      <div className="sat__img" style={{ backgroundImage: job ? `url(${shotUrl(job.view, 1280)})` : undefined }} />
      <div className="sat__scan" />
      <div className="sat__ring">
        <span />
      </div>
      {job?.portrait && (
        <div
          className="sat__face"
          style={{ backgroundImage: `url(${clipPoster(job.portrait === 'jason' ? 'jason-duval' : 'lucia-caminos')})`, borderColor: job.accent, backgroundPosition: job.portrait === 'jason' ? '46% 25%' : '56% 30%' }}
        />
      )}
      <div className="sat__cross" />
      <div className="sat__sub t-label">{job?.sub}</div>
      <div className="sat__label">
        <span className="d-sub" style={{ color: job?.accent }}>{job?.title}</span>
      </div>
    </div>
  )
}
