import { useEffect, useMemo, useRef, useState } from 'react'
import type { Trip } from '../gl/trip'
import { routeFor, type Region } from '../content/world'
import { shotsByTag } from '../content/media'
import { Art, ShotImg } from '../ui/media'
import { addSecret, get, set, useGame } from '../game/store'
import { onTick, scrollTo, scrollY, elTop } from '../game/scroll'
import { sfx } from '../audio/engine'
import { wouldBeCheatPrefix } from '../game/cheats'
import { canAskTilt, requestTilt } from '../ui/fx'

export function Leonida() {
  const reduced = useGame((s) => s.reduced)
  const quality = useGame((s) => s.quality)
  const glLost = useGame((s) => s.glLost)
  const useGL = !reduced && quality !== 'low' && !glLost
  return useGL ? <RoadTrip /> : <Postcards />
}

function RoadTrip() {
  const section = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const trip = useRef<Trip | null>(null)
  const lead = useGame((s) => s.lead)
  const foundSky = useGame((s) => s.secrets.includes('lookup'))
  const route = useMemo(() => routeFor(lead), [lead])
  const routeRef = useRef(route)
  routeRef.current = route
  const [stop, setStop] = useState(0)
  const [mode, setMode] = useState<'walk' | 'cruise'>('walk')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const [active, setActive] = useState(false)
  const barRef = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '150% 0px 150% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!host.current || !near) return
    let alive = true
    let t: Trip | null = null
    import('../gl/trip').then(({ createTrip }) => {
    if (!alive || !host.current) return
    t = createTrip(host.current, {
      route: routeRef.current,
      onStop: (i) => {
        setStop(i)
        sfx.blip()
      },
      onPick: (kind, id) => {
        sfx.select()
        const r = routeRef.current.find((x) => x.postcard === id || shotsByTag(x.shots).some((s) => s.id === id))
        if (kind === 'postcard') set({ lightbox: { ids: [`art:${id}`, ...(r ? shotsByTag(r.shots).map((s) => s.id) : [])], index: 0 } })
        else {
          const ids = r ? shotsByTag(r.shots).map((s) => s.id) : [id]
          set({ lightbox: { ids, index: Math.max(0, ids.indexOf(id)) } })
        }
      },
      onLookUp: () => addSecret('lookup'),
    })
    trip.current = t
    t.setMode(modeRef.current)
    })
    return () => {
      alive = false
      t?.dispose()
      trip.current = null
    }
  }, [near])

  useEffect(() => {
    trip.current?.setRoute(route)
  }, [route])

  useEffect(() => {
    trip.current?.setMode(mode)
  }, [mode])

  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '100px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    return onTick(() => {
      const el = section.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)))
      trip.current?.setProgress(p)
      if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`
      const on = r.top <= 1 && r.bottom >= vh - 1
      setActive((a) => (a === on ? a : on))
    })
  }, [inView])

  const stopScroll = (i: number) => {
    const el = section.current
    if (!el) return 0
    const n = routeRef.current.length - 1
    return elTop(el) + (i / n) * (el.offsetHeight - window.innerHeight)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active || get().menu || get().lightbox || get().share || get().dossier) return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const vh = window.innerHeight
      if ((e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S' || e.key === 'e' || e.key === 'E' || e.key === 'q' || e.key === 'Q') && wouldBeCheatPrefix(e.key)) return
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault()
        scrollTo(scrollY() - vh * 0.7, { duration: 0.9 })
      }
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault()
        scrollTo(scrollY() + vh * 0.7, { duration: 0.9 })
      }
      if (e.key === 'e' || e.key === 'E') {
        if (stop < routeRef.current.length - 1) scrollTo(stopScroll(stop + 1), { duration: 1.6 })
      }
      if (e.key === 'q' || e.key === 'Q') {
        if (stop > 0) scrollTo(stopScroll(stop - 1), { duration: 1.6 })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, stop])

  const reg: Region = route[Math.min(stop, route.length - 1)]
  return (
    <section id="leonida" className={`chapter trip ${active ? 'is-active' : ''}`} ref={section} aria-label="Only in Leonida, a road trip through six regions">
      <div className="trip__sticky">
        <div className="trip__gl" ref={host} />
        <div className="trip__ui" data-ui>
          <div className="trip__head">
            <span className="t-label t-accent">07 · Only in Leonida</span>
            <h2 className="d-sub trip__title" key={reg.id} aria-live="polite">
              <span className="trip__count">
                {String(stop + 1).padStart(2, '0')} / {String(route.length).padStart(2, '0')}
              </span>{' '}
              {reg.name}
            </h2>
            <p className="t-body-l trip__line" key={reg.id + 'l'}>
              {reg.line}
            </p>
          </div>
          <div className="trip__modes" role="group" aria-label="Travel mode">
            <button className={`pill pill--sm ${mode === 'walk' ? 'pill--primary' : 'pill--ghost'}`} onClick={() => setMode('walk')} aria-pressed={mode === 'walk'}>
              Walk
            </button>
            <button className={`pill pill--sm ${mode === 'cruise' ? 'pill--primary' : 'pill--ghost'}`} onClick={() => setMode('cruise')} aria-pressed={mode === 'cruise'}>
              Cruise
            </button>
            {canAskTilt() && (
              <button className="pill pill--sm pill--ghost" onClick={() => requestTilt()}>
                Tilt to look
              </button>
            )}
            <button
              className="pill pill--sm pill--ghost"
              onClick={() => {
                const el = section.current
                if (el) scrollTo(elTop(el) + el.offsetHeight - window.innerHeight * 0.2, { duration: 1.2 })
              }}
            >
              Skip tour →
            </button>
          </div>
          <div className="trip__stops">
            {route.map((r, i) => (
              <button key={r.id} className={`trip__stop ${i === stop ? 'is-here' : ''} ${i < stop ? 'is-past' : ''}`} onClick={() => scrollTo(stopScroll(i), { duration: 1.6 })} aria-label={`Go to ${r.name}`}>
                <i />
                <span className="t-label">{r.short}</span>
              </button>
            ))}
            <span className="trip__bar">
              <span ref={barRef} />
            </span>
          </div>
          <div className="trip__keys" aria-hidden="true">
            <span>
              <kbd>W</kbd>
              <kbd>S</kbd>Move
            </span>
            <span>
              <kbd>Mouse</kbd>Look
            </span>
            <span>
              <kbd>E</kbd>Next stop
            </span>
            <span>
              <kbd>Click</kbd>Open photo
            </span>
          </div>
          {stop === route.length - 1 && !foundSky && <p className="trip__whisper t-label">Look up.</p>}
        </div>
      </div>
    </section>
  )
}

function Postcards() {
  const lead = useGame((s) => s.lead)
  const route = routeFor(lead)
  const found = useGame((s) => s.secrets.includes('lookup'))
  const [sky, setSky] = useState(found)
  return (
    <section id="leonida" className="chapter postcards" aria-label="Only in Leonida">
      <div className="wrap">
        <span className="t-label t-accent" data-reveal>
          07 · Only in Leonida
        </span>
        <h2 className="d-section" data-reveal>
          Six stops
        </h2>
      </div>
      <div className="postcards__strip">
        {route.map((r, i) => {
          const ids = shotsByTag(r.shots).slice(0, 3).map((s) => s.id)
          return (
            <article key={r.id} className="postcards__card" data-reveal style={{ ['--d' as string]: `${i * 0.05}s` }}>
              <button className="postcards__pc" onClick={() => set({ lightbox: { ids: [`art:${r.postcard}`, ...shotsByTag(r.shots).map((s) => s.id)], index: 0 } })}>
                <Art k={r.postcard} alt={`${r.name} postcard`} sizes="(max-width: 760px) 86vw, 640px" maxW={1920} />
              </button>
              <div className="postcards__meta">
                <span className="t-label t-muted">
                  {String(i + 1).padStart(2, '0')} / 06
                </span>
                <h3 className="d-sub">{r.name}</h3>
                <p className="t-body t-muted">{r.line}</p>
              </div>
              <div className="postcards__shots">
                {ids.map((id, k) => (
                  <button key={id} onClick={() => set({ lightbox: { ids: shotsByTag(r.shots).map((s) => s.id), index: k } })}>
                    <ShotImg id={id} alt="" sizes="200px" maxW={640} />
                  </button>
                ))}
              </div>
            </article>
          )
        })}
      </div>
      <div className="postcards__sky wrap">
        {sky ? (
          <p className="d-sub postcards__msg">See you in Leonida · 11 · 19 · 2026</p>
        ) : (
          <button
            className="pill pill--ghost"
            onClick={() => {
              setSky(true)
              addSecret('lookup')
            }}
          >
            ↑ Look up
          </button>
        )}
      </div>
    </section>
  )
}
