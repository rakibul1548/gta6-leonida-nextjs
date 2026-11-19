import { useEffect, useRef, useState } from 'react'
import type { HeroGL } from '../gl/hero'
import { HERO_SCENES } from '../gl/quality'
import { Art } from '../ui/media'
import { LOGO } from '../content/media'
import { LAUNCH, OFFICIAL } from '../content/world'
import { addSecret, set, toast, useGame, useLaunch } from '../game/store'
import { flock, FLAMINGO_SVG } from '../game/cheats'
import { sfx } from '../audio/engine'
import { clamp, pad2 } from '../ui/fx'

export function useCountdown() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const ms = Math.max(0, LAUNCH.getTime() - now)
  return { d: Math.floor(ms / 86400000), h: Math.floor(ms / 3600000) % 24, m: Math.floor(ms / 60000) % 60, s: Math.floor(ms / 1000) % 60, done: ms === 0 }
}

export function Countdown({ compact = false }: { compact?: boolean }) {
  const c = useCountdown()
  const state = useLaunch()
  if (state === 'post') {
    return (
      <div className={`countdown is-out ${compact ? 'is-compact' : ''}`}>
        <span className="d-sub">Out now</span>
      </div>
    )
  }
  const cells: [number, string][] = [
    [c.d, 'Days'],
    [c.h, 'Hrs'],
    [c.m, 'Min'],
    [c.s, 'Sec'],
  ]
  return (
    <div className={`countdown ${compact ? 'is-compact' : ''}`} role="timer" aria-label={`${c.d} days ${c.h} hours ${c.m} minutes until launch`}>
      {cells.map(([v, l]) => (
        <div key={l} className="countdown__cell">
          <b>{pad2(v)}</b>
          <i>{l}</i>
        </div>
      ))}
    </div>
  )
}

export function playVideo(id: string) {
  set({ pendingVideo: id })
}

function timeLabel(v: number) {
  const mins = 12 * 60 + v * 12 * 60
  const h = Math.floor(mins / 60) % 24
  const m = Math.floor(mins % 60)
  return `${pad2(h)}:${pad2(m)}`
}

export function Hero() {
  const host = useRef<HTMLDivElement>(null)
  const gl = useRef<HeroGL | null>(null)
  const reduced = useGame((s) => s.reduced)
  const quality = useGame((s) => s.quality)
  const entered = useGame((s) => s.entered)
  const launch = useLaunch()
  const [dial, setDial] = useState(0.5)
  const [glReady, setGlReady] = useState(false)
  const glLost = useGame((s) => s.glLost)
  const useGL = !reduced && quality !== 'low' && !glLost
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 0.8)

  useEffect(() => {
    const onResize = () => setPhone(window.innerWidth / window.innerHeight < 0.8)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const scene = dial < 0.34 ? 0 : dial < 0.67 ? 1 : 2
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  useEffect(() => {
    if (!useGL || !host.current) return
    let alive = true
    let h: HeroGL | null = null
    import('../gl/hero').then(({ createHero }) => {
      if (!alive || !host.current) return
      h = createHero(host.current, phone)
      gl.current = h
      h.setScene(sceneRef.current)
      h.ready.then(() => alive && setGlReady(true))
    })
    return () => {
      alive = false
      h?.dispose()
      gl.current = null
      setGlReady(false)
    }
  }, [useGL, phone])

  useEffect(() => {
    set({ heroTime: dial >= 0.995 ? '00:00' : timeLabel(dial) })
  }, [dial])

  useEffect(() => {
    gl.current?.setScene(scene)
    gl.current?.setNight(clamp((dial - 0.8) / 0.2))
  }, [scene, dial])

  const midnightFired = useRef(false)
  useEffect(() => {
    if (dial >= 0.995 && !midnightFired.current) {
      midnightFired.current = true
      if (addSecret('midnight')) toast('Midnight in Vice City', 'The city never really sleeps', 'pink')
    }
    if (dial < 0.9) midnightFired.current = false
  }, [dial])

  const sceneMeta = HERO_SCENES[scene]
  return (
    <section id="hero" className={`chapter hero ${entered ? 'is-entered' : ''}`} aria-label="Grand Theft Auto VI · Vice City, USA">
      <div className="hero__stage" ref={host}>
        {(!useGL || !glReady) && (
          <div className="hero__still">
            {HERO_SCENES.map((s, i) => (useGL && i !== 1 ? null :
              <Art
                key={s.key}
                k={s.key}
                variant={phone ? s.phone : 'landscape'}
                alt={i === 1 ? 'Jason and Lucia leaning on a car at golden hour in Vice City' : ''}
                sizes="100vw"
                eager={i === 1}
                className={`hero__still-img ${i === scene ? 'is-on' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="hero__scrim" />
      <Birds />
      <button
        className="hero__flamingo"
        aria-label="A flamingo"
        data-cursor="?"
        onClick={() => {
          sfx.select()
          flock()
          addSecret('flamingo')
        }}
        dangerouslySetInnerHTML={{ __html: FLAMINGO_SVG }}
      />
      <TimeDial value={dial} onChange={setDial} label={sceneMeta.label} />

      <div className="hero__content wrap">
        <div className="hero__lockup">
          <img className="hero__logo" src={LOGO} alt="Grand Theft Auto VI" width={600} height={467} />
          <div className="hero__date">
            <span className="t-label">{launch === 'post' ? 'Out now · November 19, 2026' : 'Coming November 19, 2026'}</span>
            <Countdown />
          </div>
        </div>
        <label className="hero__timebar">
          <span className="t-label">
            {dial >= 0.995 ? '00:00 · Midnight' : `${timeLabel(dial)} · ${sceneMeta.label}`}
          </span>
          <input type="range" min={0} max={1000} value={Math.round(dial * 1000)} onChange={(e) => setDial(Number(e.target.value) / 1000)} aria-label="Time of day" />
        </label>
        <div className="hero__actions">
          <button className="pill pill--primary" onClick={() => playVideo('rz1B4B2yBZY')} data-cursor="PLAY">
            <span aria-hidden="true">▶</span> Watch Trailer
          </button>
          <a className="pill pill--ghost" href="#leonida" onClick={(e) => { e.preventDefault(); document.getElementById('leonida')?.scrollIntoView({ behavior: 'smooth' }) }}>
            Explore Leonida
          </a>
          {launch === 'post' && (
            <a className="pill pill--ghost" href={OFFICIAL} target="_blank" rel="noreferrer">
              Official site ↗
            </a>
          )}
        </div>
        <div className="hero__platforms t-label">
          <span>PlayStation 5</span>
          <span>Xbox Series X|S</span>
        </div>
      </div>
      <div className="hero__scrollcue t-label" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}

function TimeDial({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const angle = -80 + value * 160
  const R = 120
  const kx = Math.cos((angle * Math.PI) / 180) * R
  const ky = Math.sin((angle * Math.PI) / 180) * R

  function fromPointer(e: PointerEvent | React.PointerEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.right + 0
    const cy = r.top + r.height / 2
    const a = (Math.atan2(e.clientY - cy, -(e.clientX - cx)) * 180) / Math.PI
    const v = clamp((-a + 80) / 160)
    onChange(v)
  }

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && fromPointer(e)
    const up = () => (dragging.current = false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  })

  const t = timeLabel(value)
  return (
    <div className="dial" ref={ref}>
      <svg className="dial__arc" viewBox="-130 -130 140 260" aria-hidden="true">
        <path d={`M ${-Math.cos((80 * Math.PI) / 180) * R} ${-Math.sin((80 * Math.PI) / 180) * R} A ${R} ${R} 0 0 0 ${-Math.cos((80 * Math.PI) / 180) * R} ${Math.sin((80 * Math.PI) / 180) * R}`} />
      </svg>
      <div
        className="dial__knob"
        role="slider"
        tabIndex={0}
        aria-label="Time of day"
        aria-valuemin={12}
        aria-valuemax={24}
        aria-valuenow={Math.round(12 + value * 12)}
        aria-valuetext={`${t}, ${label}`}
        data-cursor="DRAG"
        style={{ transform: `translate(${-kx}px, ${ky}px)` }}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          fromPointer(e)
          sfx.blip()
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') onChange(clamp(value - 0.05))
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') onChange(clamp(value + 0.05))
          if (e.key === 'End') onChange(1)
          if (e.key === 'Home') onChange(0)
        }}
      >
        <span className={value > 0.67 ? 'is-moon' : ''} />
      </div>
      <div className="dial__label" style={{ transform: `translate(${-kx - 26}px, ${ky}px)` }}>
        <b className="t-label">{value >= 0.995 ? '00:00' : t}</b>
        <span className="t-label t-muted">{value >= 0.995 ? 'Midnight' : label}</span>
      </div>
    </div>
  )
}

function Birds() {
  return (
    <div className="birds" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="bird" viewBox="0 0 40 16" style={{ ['--i' as string]: i }}>
          <path d="M0 8 Q10 0 20 8 Q30 0 40 8" />
        </svg>
      ))}
    </div>
  )
}
