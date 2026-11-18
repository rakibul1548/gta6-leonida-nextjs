import { useEffect, useRef, useState } from 'react'
import { saga } from '../content/world'
import { Art } from '../ui/media'
import { set, useGame } from '../game/store'
import { sfx } from '../audio/engine'
import { clamp } from '../ui/fx'

const NOW_YEAR = Math.max(2026, new Date().getFullYear())

export function Saga() {
  const firstGame = useGame((s) => s.firstGame)
  const start = Math.max(0, saga.findIndex((g) => g.id === (firstGame ?? 'sa')))
  const [pos, setPos] = useState(start)
  const [shown, setShown] = useState(start)
  const posRef = useRef(start)
  const target = useRef(start)
  const drag = useRef<{ x: number; p: number; moved: boolean; id: number } | null>(null)
  const dragged = useRef(false)
  const stage = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  const animate = () => {
    cancelAnimationFrame(raf.current)
    const step = () => {
      const d = target.current - posRef.current
      posRef.current += d * 0.16
      if (Math.abs(d) < 0.001) posRef.current = target.current
      setPos(posRef.current)
      const r = Math.round(posRef.current)
      setShown((s) => (s === r ? s : r))
      if (posRef.current !== target.current) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const go = (i: number) => {
    const n = clamp(Math.round(i), 0, saga.length - 1)
    if (n !== Math.round(target.current)) sfx.blip()
    target.current = n
    animate()
  }

  useEffect(() => {
    const el = stage.current
    if (!el) return
    let acc = 0
    let t = 0
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      acc += e.deltaX
      window.clearTimeout(t)
      if (Math.abs(acc) > 60) {
        go(target.current + Math.sign(acc))
        acc = 0
      }
      t = window.setTimeout(() => (acc = 0), 120)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const cur = saga[shown]
  const years = NOW_YEAR - cur.year
  const picked = saga.find((g) => g.id === firstGame)

  return (
    <section id="saga" className="chapter saga" aria-label="The road to VI">
      <div className="saga__head wrap">
        <span className="t-label t-accent" data-reveal>
          03 · The road to VI
        </span>
        <h2 className="d-section" data-reveal style={{ ['--d' as string]: '.05s' }}>
          How far back
          <br />
          do you go?
        </h2>
        <p className="t-body-l t-muted" data-reveal style={{ ['--d' as string]: '.1s' }}>
          Twenty-nine years, eight games. Pick the first one you played.
        </p>
      </div>

      <div
        className="flow"
        ref={stage}
        tabIndex={0}
        role="listbox"
        aria-label="Grand Theft Auto games, oldest to newest"
        aria-activedescendant={`saga-${cur.id}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(target.current + 1)
          if (e.key === 'ArrowLeft') go(target.current - 1)
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            pick(cur.id)
          }
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, p: posRef.current, moved: false, id: e.pointerId }
          dragged.current = false
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const dx = e.clientX - drag.current.x
          if (!drag.current.moved) {
            if (Math.abs(dx) < 8) return
            drag.current.moved = true
            dragged.current = true
            ;(e.currentTarget as HTMLElement).setPointerCapture(drag.current.id)
          }
          posRef.current = clamp(drag.current.p - dx / 220, -0.4, saga.length - 0.6)
          target.current = posRef.current
          setPos(posRef.current)
          setShown(clamp(Math.round(posRef.current), 0, saga.length - 1))
        }}
        onPointerUp={() => {
          if (!drag.current) return
          const moved = drag.current.moved
          drag.current = null
          if (moved) go(posRef.current)
        }}
        onPointerCancel={() => (drag.current = null)}
        data-cursor="DRAG"
      >
        {saga.map((g, i) => {
          const off = i - pos
          const a = Math.abs(off)
          const rot = clamp(-off * 38, -58, 58)
          const x = off * (a < 1 ? 230 : 150 + 80 / a)
          return (
            <div
              key={g.id}
              id={`saga-${g.id}`}
              role="option"
              aria-selected={i === shown}
              className={`flow__item ${i === shown ? 'is-center' : ''} ${firstGame === g.id ? 'is-picked' : ''}`}
              style={{
                transform: `translateX(${x}px) translateZ(${-a * 140}px) rotateY(${rot}deg)`,
                zIndex: 100 - Math.round(a * 10),
                opacity: a > 4.2 ? 0 : 1 - Math.max(0, a - 2) * 0.25,
              }}
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false
                  return
                }
                if (i === shown) pick(g.id)
                else go(i)
              }}
            >
              <Tile g={g} />
            </div>
          )
        })}
      </div>

      <div className="saga__foot wrap">
        <div className="saga__meta" aria-live="polite">
          <span className="t-label t-muted">{cur.place}</span>
          <b className="d-sub">
            {cur.year} <i>·</i> {years === 0 ? 'this year' : `${years} years ago`}
          </b>
        </div>
        <div className="saga__actions">
          <button className="pill pill--ghost pill--sm" onClick={() => go(target.current - 1)} aria-label="Previous game">
            ←
          </button>
          <button className="pill pill--primary" onClick={() => pick(cur.id)} data-cursor="PICK">
            {cur.id === 'gta6' ? 'This is my first' : 'This was my first'}
          </button>
          <button className="pill pill--ghost pill--sm" onClick={() => go(target.current + 1)} aria-label="Next game">
            →
          </button>
        </div>
        <p className="saga__answer" aria-live="polite">
          {picked ? (picked.id === 'gta6' ? <>Day one. <span className="t-accent">Welcome to Leonida.</span></> : <>In since {picked.year}. <span className="t-accent">{NOW_YEAR - picked.year} years.</span></>) : <span className="t-muted">Your answer goes on your card.</span>}
        </p>
      </div>
    </section>
  )

  function pick(id: string) {
    set({ firstGame: id })
    sfx.select()
  }
}

function Tile({ g }: { g: (typeof saga)[number] }) {
  const [failed, setFailed] = useState(false)

  if (g.id === 'gta6') {
    return (
      <div className="tile tile--cover tile--vi">
        <Art k="official-cover-art" variant="portrait" alt="Grand Theft Auto VI official cover art" sizes="280px" maxW={1080} />
      </div>
    )
  }

  if (failed) {
    const [a, b, c] = g.colors
    return (
      <div className="tile" style={{ ['--a' as string]: a, ['--b' as string]: b, ['--c' as string]: c }} aria-label={`${g.title}, ${g.year}`}>
        <span className="tile__year t-label">{g.year}</span>
        <span className="tile__num">{g.numeral}</span>
        <span className="tile__title">{g.title.replace('Grand Theft Auto', 'Grand Theft Auto\n').split('\n').map((x, i) => <span key={i}>{x.replace(/^:\s*/, '')}</span>)}</span>
        <span className="tile__place t-label">{g.place}</span>
      </div>
    )
  }

  return (
    <div className="tile tile--cover" aria-label={`${g.title}, ${g.year}`}>
      <img
        src={`/media/saga/${g.id}.webp`}
        alt={`${g.title} official cover art`}
        className="tile__img"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
