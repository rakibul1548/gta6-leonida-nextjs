import { useEffect, useRef, useState } from 'react'
import { cast, type Cast } from '../content/cast'
import { Art, Clip } from '../ui/media'
import { set, setLead, useGame } from '../game/store'
import { satellite } from '../game/switch'
import { sfx } from '../audio/engine'

export function Lead() {
  const lead = useGame((s) => s.lead)
  const startIx = cast.findIndex((c) => c.lead === (lead ?? 'lucia'))
  const [active, setActive] = useState(startIx < 0 ? 3 : startIx)
  const [mobile, setMobile] = useState(false)
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = matchMedia('(max-width: 900px)')
    const on = () => setMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (!mobile || !strip.current) return
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.ix))),
      { root: strip.current, threshold: 0.6 },
    )
    strip.current.querySelectorAll('[data-ix]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [mobile])

  const pickLead = (c: Cast) => {
    if (!c.lead) return set({ dossier: c.id })
    satellite({ title: `Switching to ${c.first}`, accent: c.color, portrait: c.lead, mid: () => setLead(c.lead!) })
  }

  const move = (d: number) => {
    setActive((a) => {
      const n = (a + d + cast.length) % cast.length
      sfx.blip()
      const el = document.getElementById(`cast-${cast[n].id}`)
      el?.focus({ preventScroll: true })
      if (mobile) el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      return n
    })
  }

  const cur = cast[active]
  return (
    <section id="lead" className="chapter lead" aria-label="Choose your lead">
      <div className="lead__head wrap">
        <span className="t-label t-accent" data-reveal>
          05 · Cast
        </span>
        <h2 className="d-section" data-reveal style={{ ['--d' as string]: '.05s' }}>
          Choose your lead
        </h2>
        <p className="t-body t-muted lead__hint" data-reveal style={{ ['--d' as string]: '.1s' }}>
          {lead ? `Playing as ${lead === 'jason' ? 'Jason' : 'Lucia'}. The colours, the road trip and your card follow your pick.` : 'Point at anyone to see them move. Jason and Lucia are playable; everyone else has a file.'}
        </p>
      </div>
      <div
        className={`lead__panels ${mobile ? 'is-mobile' : ''}`}
        ref={strip}
        role="listbox"
        aria-label="Characters"
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).tagName === 'BUTTON') return
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault()
            move(1)
          }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault()
            move(-1)
          }
          if (e.key === 'Enter') pickLead(cur)
        }}
      >
        {cast.map((c, i) => {
          const on = i === active
          const isLead = !!c.lead && lead === c.lead
          return (
            <div
              key={c.id}
              id={`cast-${c.id}`}
              data-ix={i}
              role="option"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              className={`lead__panel ${on ? 'is-active' : ''} ${isLead ? 'is-lead' : ''} ${c.lead ? 'is-playable' : ''}`}
              style={{ ['--c' as string]: c.color }}
              onMouseEnter={() => {
                if (!mobile && active !== i) {
                  setActive(i)
                  sfx.blip()
                }
              }}
              onFocus={() => setActive(i)}
              onClick={() => (on ? pickLead(c) : setActive(i))}
              data-cursor={on ? (c.lead ? 'PLAY' : 'FILE') : 'LOOK'}
            >
              <div className="lead__media">
                <Art k={c.art} variant="portrait" alt="" sizes={mobile ? '90vw' : '45vw'} maxW={1080} position="50% 30%" className="lead__still" />
                <Clip k={c.clip} active={on} need={720} className="lead__clip" position={c.id === 'jason-duval' ? '45% 50%' : c.id === 'lucia-caminos' ? '58% 40%' : '50% 40%'} rate={0.85} />
              </div>
              <div className="lead__shade" />
              <span className="lead__vname">
                {c.first} {c.last}
              </span>
              <div className="lead__info">
                {on && <span className="live-badge">● Official clip</span>}
                <h3 className="d-section lead__name" key={c.id + on}>
                  {c.first}
                  <br />
                  {c.last}
                </h3>
                <p className="t-body-l">{c.role}</p>
                <div className="chips">
                  {c.traits.map((t) => (
                    <span key={t} className="chip is-static">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="lead__actions">
                  {c.lead ? (
                    <>
                      <button
                        className="pill pill--accent"
                        style={{ background: c.color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          pickLead(c)
                        }}
                      >
                        {isLead ? `Playing as ${c.first}` : `Play as ${c.first}`}
                      </button>
                      <button
                        className="pill pill--ghost pill--sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          set({ dossier: c.id })
                        }}
                      >
                        Dossier
                      </button>
                    </>
                  ) : (
                    <button
                      className="pill pill--ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        set({ dossier: c.id })
                      }}
                    >
                      Open dossier
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
