import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Art } from '../ui/media'
import { LOGO, artUrl } from '../content/media'
import { HERO_SCENES, heroNeed } from '../gl/quality'
import { set, get } from '../game/store'
import { enableSound, sfx } from '../audio/engine'

const TIPS = [
  'Turn the sound on. Vice City is better at night.',
  'Esc opens the pause menu. So does Start on a controller.',
  'Old cheat codes still work here. Try one.',
  'Six secrets are hidden across Leonida.',
  'Pick a lead and the whole site changes for them.',
]

const STATIC = typeof window !== 'undefined' && !!(window as unknown as { __staticBoot?: boolean }).__staticBoot

const PANELS = [
  { k: 'jason-and-lucia-rooftop', pos: '40% 50%' },
  { k: 'jason-and-lucia-lock-and-load', pos: '45% 50%' },
  { k: 'jason-and-lucia-robbery', pos: '55% 50%' },
]

export function Boot({ onEnter }: { onEnter: (sound: boolean) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [total, setTotal] = useState(1)
  const [tip, setTip] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 0.8)

  useEffect(() => {
    const onResize = () => setPhone(window.innerWidth / window.innerHeight < 0.8)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const heroScene = HERO_SCENES[1]
    const heroVariant = phone ? heroScene.phone : 'landscape'
    const urls = [
      LOGO,
      artUrl(heroScene.key, heroVariant, Math.min(1920, heroNeed(phone))),
      `/media/d/${heroScene.key}-${heroVariant}.webp`,
      ...PANELS.map((p) => artUrl(p.k, phone ? 'portrait' : 'landscape', 1080)),
    ]
    setTotal(urls.length)
    let n = 0
    urls.forEach((u) => {
      const i = new Image()
      i.onload = i.onerror = () => {
        n++
        setLoaded(n)
      }
      i.src = u
    })
    const t = window.setInterval(() => setTip((x) => (x + 1) % TIPS.length), 3200)
    return () => window.clearInterval(t)
  }, [phone])

  useEffect(() => {
    let raf = 0
    const target = loaded / total
    const step = () => {
      setProgress((p) => {
        const next = p + (target - p) * 0.2 + 0.005
        return Math.min(target, next)
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [loaded, total])

  useEffect(() => {
    if (!root.current) return
    const isReduced = typeof window !== 'undefined' && (get().reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (isReduced) return
    const ctx = gsap.context(() => {
      if (!STATIC) gsap.from('.boot__panel picture', { scale: 1.18, filter: 'brightness(2) saturate(0.4)', duration: 1.6, ease: 'expo.out', stagger: 0.09 })
      if (!STATIC) gsap.from('.boot__panel', { clipPath: 'inset(0 0 38% 0)', duration: 1.1, ease: 'expo.out', stagger: 0.08 })
      gsap.from('.boot__ui > *', { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.35 })
    }, root)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (leaving || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement)?.tagName === 'BUTTON') return
      if (e.key !== 'Enter' && e.key !== ' ' && e.key.length !== 1) return
      e.preventDefault()
      enter(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function enter(sound: boolean) {
    if (leaving) return
    setLeaving(true)
    if (sound) {
      enableSound(true)
      sfx.boot()
    }
    set({ sound, soundPref: sound })
    const tl = gsap.timeline({ onComplete: () => onEnter(sound) })
    tl.to('.boot__ui', { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' }, 0)
    tl.to('.boot__panel', { yPercent: (i: number) => (i % 2 ? -110 : 110), duration: 0.9, ease: 'expo.inOut', stagger: 0.07 }, 0.1)
    tl.to(root.current, { autoAlpha: 0, duration: 0.45 }, 0.65)
    if (get().reduced) tl.timeScale(4)
  }

  const pct = Math.round(progress * 100)
  return (
    <div className="boot" ref={root} role="dialog" aria-modal="true" aria-label="Loading Leonida">
      <div className="boot__panels" aria-hidden="true">
        {PANELS.map((p, i) => (
          <div key={p.k} className="boot__panel" style={{ ['--i' as string]: i }}>
            <Art k={p.k} variant={phone ? 'portrait' : 'landscape'} alt="" sizes={phone ? '40vw' : '58vw'} eager priority={i === 1} position={p.pos} maxW={1920} imgStyle={STATIC ? { opacity: 1, transition: 'none' } : undefined} />
          </div>
        ))}
      </div>
      <div className="boot__shade" />
      <p className="boot__fan t-label">Fan-made · not affiliated with Rockstar Games or Take-Two Interactive</p>
      <div className="boot__ui">
        <img className="boot__logo" src={LOGO} alt="Grand Theft Auto VI" width={600} height={467} />
        <div className="boot__copy">
          <h1 className="d-sub">Loading Leonida</h1>
          <p className="t-body-l t-muted boot__tip" key={tip}>
            Tip: {TIPS[tip]}
          </p>
        </div>
        <div className="boot__actions">
          <button className="pill pill--primary" onClick={() => enter(true)} data-cursor="ENTER">
            Enter with sound
          </button>
          <button className="pill pill--ghost" onClick={() => enter(false)} data-cursor="ENTER">
            Enter muted
          </button>
        </div>
      </div>
      <div className="boot__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="boot__meta t-label" aria-live="polite">
        <span>
          Streaming Leonida · {loaded} / {total}
        </span>
        <span>{pct}%</span>
      </div>
    </div>
  )
}
