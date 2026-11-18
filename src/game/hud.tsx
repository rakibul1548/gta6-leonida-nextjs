import { useEffect, useRef, useState } from 'react'
import { chapters, SECRETS, type ChapterId } from '../content/world'
import { LOGO, clipPoster } from '../content/media'
import { openMenu, useGame, get } from './store'
import { onTick, scrollY } from './scroll'
import { fastTravel } from './switch'
import { setClock, sfx } from '../audio/engine'

const KEYS: [number, number][] = [
  [0, 17 * 60 + 40],
  [0.2, 18 * 60 + 55],
  [0.42, 20 * 60 + 30],
  [0.62, 23 * 60 + 10],
  [0.8, 26 * 60 + 20],
  [0.93, 29 * 60 + 40],
  [1, 30 * 60 + 25],
]

export function clockMinutes(p: number) {
  for (let i = 1; i < KEYS.length; i++) {
    if (p <= KEYS[i][0]) {
      const [a, ma] = KEYS[i - 1]
      const [b, mb] = KEYS[i]
      return ma + ((p - a) / (b - a)) * (mb - ma)
    }
  }
  return KEYS[KEYS.length - 1][1]
}
export const clockText = (m: number) => {
  const mm = Math.floor(m) % (24 * 60)
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
}

const BLIPS: Record<ChapterId, [number, number]> = {
  hero: [0.22, 0.78],
  wait: [0.3, 0.6],
  saga: [0.24, 0.42],
  story: [0.4, 0.3],
  lead: [0.58, 0.24],
  loadout: [0.68, 0.2],
  leonida: [0.74, 0.36],
  gameplay: [0.78, 0.54],
  drivein: [0.66, 0.68],
  cover: [0.52, 0.78],
  launch: [0.44, 0.62],
  passed: [0.5, 0.48],
}

export function HUD() {
  const chapter = useGame((s) => s.chapter)
  const visited = useGame((s) => s.visited)
  const secrets = useGame((s) => s.secrets)
  const wanted = useGame((s) => s.wanted)
  const playing = useGame((s) => s.playing)
  const entered = useGame((s) => s.entered)
  const hidden = useGame((s) => s.hudHidden)
  const lead = useGame((s) => s.lead)
  const clockRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let last = ''
    let lastP = -1
    return onTick(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const p = Math.min(1, Math.max(0, scrollY() / max))
      const st = get()
      const txt = st.chapter === 'hero' && st.heroTime ? st.heroTime : clockText(clockMinutes(p))
      if (txt !== last && clockRef.current) {
        clockRef.current.textContent = txt
        last = txt
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`
      if (Math.abs(p - lastP) > 0.004) {
        lastP = p
        setClock(p)
        const sc = scrollY() > 40
        setScrolled((v) => (v === sc ? v : sc))
      }
    })
  }, [])

  const cur = chapters.find((c) => c.id === chapter) ?? chapters[0]
  const navItems = chapters.filter((c) => c.nav)

  return (
    <div className={`hud ${entered ? 'is-on' : ''} ${playing || hidden ? 'is-quiet' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <header className="hud__top">
        <button className="hud__logo" onClick={() => fastTravel('hero', 'Vice City, USA')} aria-label="Back to top" data-cursor="TOP">
          <img src={LOGO} alt="" width={600} height={467} />
        </button>
        <span className="hud__fan t-label">Fan-made</span>
        <nav className="hud__nav" aria-label="Chapters">
          {navItems.map((c) => (
            <button key={c.id} className={`t-label ${chapter === c.id ? 'is-active' : ''}`} onMouseEnter={() => sfx.blip()} onClick={() => fastTravel(c.id, c.name)}>
              {c.nav}
            </button>
          ))}
        </nav>
        <div className="hud__status">
          {lead && <span className={`hud__face hud__face--${lead}`} style={{ backgroundImage: `url(${clipPoster(lead === 'jason' ? 'jason-duval' : 'lucia-caminos')})` }} title={lead === 'jason' ? 'Playing as Jason' : 'Playing as Lucia'} />}
          <span className="hud__clock t-label" ref={clockRef}>
            17:40
          </span>
          <span className={`hud__stars ${wanted ? 'is-wanted' : ''}`} aria-label={`${secrets.length} of ${SECRETS.length} secrets found`}>
            {SECRETS.map((s, i) => (
              <i key={s.id} className={i < secrets.length ? 'on' : ''}>
                ★
              </i>
            ))}
          </span>
          <button className="pill pill--ghost pill--sm hud__menu" onClick={() => openMenu('map')} data-cursor="MENU">
            Menu
          </button>
        </div>
      </header>

      <div className={`radar ${open ? 'is-open' : ''}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}>
        <div className="radar__disc">
          <div className="radar__sweep" />
          <svg viewBox="0 0 100 100" className="radar__route" aria-hidden="true">
            <polyline points={chapters.map((c) => BLIPS[c.id].map((v) => v * 100).join(',')).join(' ')} />
          </svg>
          {chapters.map((c) => (
            <button
              key={c.id}
              className={`radar__blip ${c.id === chapter ? 'is-here' : ''} ${visited.includes(c.id) ? 'is-seen' : ''}`}
              style={{ left: `${BLIPS[c.id][0] * 100}%`, top: `${BLIPS[c.id][1] * 100}%` }}
              onClick={() => fastTravel(c.id, c.name)}
              aria-label={`Fast travel to ${c.name}`}
              tabIndex={0}
            >
              <span className="radar__tip t-label">
                {c.n} {c.name}
              </span>
            </button>
          ))}
        </div>
        <div className="radar__label t-label">
          <b>{cur.n}</b> {cur.name}
        </div>
      </div>

      <button className="pill-progress" onClick={() => openMenu('map')} aria-label="Open map">
        <span className="t-label">
          {cur.n} · {cur.name}
        </span>
        {cur.touch && <span className="pill-progress__hint">{cur.touch}</span>}
        <span className="pill-progress__bar">
          <span ref={barRef} />
        </span>
      </button>

      <div className="prompts" aria-hidden="true">
        {cur.prompts.map(([k, v]) => (
          <span key={k + v}>
            {k.split(' ').map((x) => (
              <kbd key={x}>{x}</kbd>
            ))}
            {v}
          </span>
        ))}
        <span>
          <kbd>Esc</kbd>Menu
        </span>
      </div>
    </div>
  )
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  const playing = useGame((s) => s.playing)
  if (playing) return null
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <b>{t.title}</b>
          {t.sub && <span>{t.sub}</span>}
        </div>
      ))}
    </div>
  )
}

export function Reticle() {
  const ref = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [hot, setHot] = useState(false)
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('has-reticle')
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y
    let lastEl: Element | null = null
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      const t = e.target as Element
      if (t === lastEl) return
      lastEl = t
      const c = t.closest?.('[data-cursor]') as HTMLElement | null
      const lab = c?.dataset.cursor || ''
      setLabel(lab)
      setHot(!!t.closest?.('a, button, [role=button], input, [data-cursor]'))
    }
    const onOver = () => {
      const el = document.elementFromPoint(tx, ty)
      lastEl = el
      const c = el?.closest?.('[data-cursor]') as HTMLElement | null
      setLabel(c?.dataset.cursor || '')
      setHot(!!el?.closest?.('a, button, [role=button], input, [data-cursor]'))
    }
    const id = window.setInterval(onOver, 250)
    const off = onTick(() => {
      x += (tx - x) * 0.28
      y += (ty - y) * 0.28
      if (ref.current) ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    })
    window.addEventListener('pointermove', onMove, { passive: true })
    const onDown = () => ref.current?.classList.add('is-down')
    const onUp = () => ref.current?.classList.remove('is-down')
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    const onLeave = () => ref.current?.classList.add('is-gone')
    const onEnter = () => ref.current?.classList.remove('is-gone')
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    return () => {
      off()
      window.clearInterval(id)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.documentElement.classList.remove('has-reticle')
    }
  }, [])
  return (
    <div ref={ref} className={`reticle ${hot ? 'is-hot' : ''} ${label ? 'has-label' : ''}`} aria-hidden="true">
      <span className="reticle__ring" />
      <span className="reticle__dot" />
      <span className="reticle__label t-label">{label}</span>
    </div>
  )
}

export function useChapterTracking() {
  const quality = useGame((s) => s.quality)
  const reduced = useGame((s) => s.reduced)
  const glLost = useGame((s) => s.glLost)
  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) {
          const id = e.target.id as ChapterId
          const s = get()
          if (s.chapter !== id) useGame.setState({ chapter: id })
          if (!s.visited.includes(id)) useGame.setState({ visited: [...s.visited, id] })
        }
      },
      { rootMargin: '-48% 0px -48% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [quality, reduced, glLost])
}
