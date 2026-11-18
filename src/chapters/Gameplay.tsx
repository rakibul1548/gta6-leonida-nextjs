import { useEffect, useRef, useState } from 'react'
import { shotById } from '../content/media'
import { ytWatch } from '../content/world'
import { Art, Clip, ShotImg } from '../ui/media'
import { getVelocity, onTick } from '../game/scroll'
import { set, useGame } from '../game/store'
import { sfx } from '../audio/engine'

type Frame = { kind: 'shot'; id: string } | { kind: 'clip'; id: string; label: string }

const A: Frame[] = ['vice-city-05', 'jason-and-lucia-04', 'vice-city-14', 'leonida-keys-03', 'vice-city-20', 'lucia-caminos-06', 'port-gellhorn-02', 'vice-city-09', 'grassrivers-04', 'jason-and-lucia-11']
  .filter((id) => shotById.has(id))
  .map((id) => ({ kind: 'shot', id }))

const B: Frame[] = [
  { kind: 'clip', id: 'real-dimez', label: 'Real Dimez' },
  { kind: 'shot', id: 'grassrivers-05' },
  { kind: 'shot', id: 'jason-duval-08' },
  { kind: 'clip', id: 'raul-bautista', label: 'Raul Bautista' },
  { kind: 'shot', id: 'ambrosia-03' },
  { kind: 'shot', id: 'mount-kalaga-national-park-02' },
  { kind: 'clip', id: 'jason-duval', label: 'Jason Duval' },
  { kind: 'shot', id: 'vice-city-24' },
  { kind: 'clip', id: 'lucia-caminos', label: 'Lucia Caminos' },
  { kind: 'shot', id: 'leonida-keys-05' },
].filter((f) => f.kind === 'clip' || shotById.has(f.id)) as Frame[]

function Strip({ frames, dir, tilt }: { frames: Frame[]; dir: 1 | -1; tilt: number }) {
  const track = useRef<HTMLDivElement>(null)
  const reduced = useGame((s) => s.reduced)
  const [hover, setHover] = useState<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  hoverRef.current = hover
  const drag = useRef<{ x: number; o: number; moved: boolean } | null>(null)
  const off = useRef(0)

  useEffect(() => {
    if (reduced) return
    return onTick((_, dt) => {
      const el = track.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.bottom < -100 || r.top > window.innerHeight + 100) return
      const half = el.scrollWidth / 2
      if (!drag.current) {
        const v = Math.min(60, Math.abs(getVelocity()))
        const slow = hoverRef.current != null ? 0.15 : 1
        off.current += dir * (36 + v * 18) * dt * slow
      }
      if (off.current < -half) off.current += half
      if (off.current > 0) off.current -= half
      el.style.transform = `translate3d(${off.current.toFixed(1)}px,0,0)`
    })
  }, [dir, reduced])

  const list = [...frames, ...frames]
  const open = (f: Frame) => {
    if (f.kind === 'shot') {
      const ids = frames.filter((x) => x.kind === 'shot').map((x) => x.id)
      set({ lightbox: { ids, index: ids.indexOf(f.id) } })
    } else set({ dossier: f.id })
  }
  return (
    <div className="strip" style={{ ['--tilt' as string]: `${tilt}deg` }}>
      <div
        className="strip__track"
        ref={track}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, o: off.current, moved: false }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const dx = e.clientX - drag.current.x
          if (Math.abs(dx) > 6) drag.current.moved = true
          off.current = drag.current.o + dx
        }}
        onPointerUp={() => {
          setTimeout(() => (drag.current = null), 0)
        }}
        onPointerLeave={() => (drag.current = null)}
      >
        {list.map((f, i) => (
          <button
            key={i}
            className={`strip__frame ${hover === i ? 'is-hover' : ''}`}
            onMouseEnter={() => {
              setHover(i)
              sfx.blip()
            }}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => {
              if (drag.current?.moved) return
              open(f)
            }}
            tabIndex={i < frames.length ? 0 : -1}
            aria-hidden={i >= frames.length}
            data-cursor={f.kind === 'clip' ? 'PLAY' : 'VIEW'}
          >
            {f.kind === 'shot' ? <ShotImg id={f.id} alt={`${shotById.get(f.id)?.label} screenshot`} sizes="420px" maxW={1280} /> : <Clip k={f.id} active={hover === i} need={720} />}
            <span className="strip__cap t-label">
              {f.kind === 'clip' ? <>▶ {f.label}</> : shotById.get(f.id)?.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

const PILLARS = [
  { t: 'Two leads', d: 'One story from both sides. Jason and Lucia, together and on their own.', img: { art: 'jason-and-lucia-02' } },
  { t: 'Six regions', d: 'From the neon of Vice City to the forest of Mount Kalaga, the whole state of Leonida.', img: { shot: 'leonida-keys-01' } },
  { t: 'Scores', d: 'Banks, crews and plans that go sideways. Raul is always hiring.', img: { shot: 'raul-bautista-02' } },
  { t: 'Going viral', d: 'Everyone in Leonida is filming. Everyone wants a hit.', img: { shot: 'real-dimez-02' } },
  { t: 'Land, sea, air', d: 'Cars, bikes, speedboats and helicopters all appear across the official art.', img: { art: 'official-cover-art' } },
]

export function Gameplay() {
  const [open, setOpen] = useState(0)
  return (
    <section id="gameplay" className="chapter gameplay" aria-label="Gameplay">
      <div className="gameplay__head wrap">
        <span className="t-label t-accent" data-reveal>
          08 · Gameplay
        </span>
        <h2 className="d-marquee" data-reveal style={{ ['--d' as string]: '.05s' }}>
          Gameplay
        </h2>
        <p className="t-body-l t-muted" data-reveal style={{ ['--d' as string]: '.1s' }}>
          Every frame below comes from Rockstar's official screenshots and clips. Drag the strips. Point at a frame to stop it.
        </p>
      </div>
      <div className="strips">
        <Strip frames={A} dir={-1} tilt={-4} />
        <Strip frames={B} dir={1} tilt={3} />
      </div>
      <div className="pillars wrap" role="list">
        {PILLARS.map((p, i) => (
          <button
            key={p.t}
            role="listitem"
            className={`pillar ${open === i ? 'is-open' : ''}`}
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            onClick={() => setOpen(i)}
            data-reveal
            style={{ ['--d' as string]: `${i * 0.05}s` }}
          >
            <div className="pillar__img">{'art' in p.img && p.img.art ? <Art k={p.img.art} alt="" sizes="40vw" maxW={1920} /> : <ShotImg id={(p.img as { shot: string }).shot} alt="" sizes="40vw" maxW={1920} />}</div>
            <div className="pillar__shade" />
            <span className="pillar__n t-label">0{i + 1}</span>
            <div className="pillar__copy">
              <h3 className="d-sub">{p.t}</h3>
              <p className="t-body">{p.d}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="gameplay__cta wrap" data-reveal>
        <a className="pill pill--ghost" href={ytWatch('tJbzMqJGH4k')} target="_blank" rel="noreferrer" data-cursor="YOUTUBE">
          Watch “An Extended Look” on YouTube ↗ <span className="t-muted">26:48</span>
        </a>
        <span className="t-label t-muted">Age-restricted on YouTube, so it opens there.</span>
      </div>
    </section>
  )
}
