import { useEffect, useRef, useState } from 'react'
import { Clip, Art } from '../ui/media'
import { clamp, useTilt } from '../ui/fx'
import { useGame, setLead } from '../game/store'
import { sfx } from '../audio/engine'
import { satellite } from '../game/switch'

type StoryAct = {
  id: string
  num: string
  title: string
  location: string
  lead: string
  quote: string
  synopsis: string
  tags: string[]
  accent: string
}

const STORY_ACTS: StoryAct[] = [
  {
    id: 'act-1',
    num: 'ACT I',
    title: 'The Release',
    location: 'Leonida Penitentiary · Vice City Outskirts',
    lead: 'Lucia Caminos',
    quote: '“Bad luck, I guess. But we finish what we start.”',
    synopsis:
      'Serving hard time for her family taught Lucia one thing: never leave your fate in someone else’s hands. The day she walks out into the blinding Florida sun, the blueprint for survival is already written.',
    tags: ['FREEDOM', 'CALCULATED', 'FAMILY FIRST'],
    accent: '#ff4fa3',
  },
  {
    id: 'act-2',
    num: 'ACT II',
    title: 'The Underworld',
    location: 'Port Gellhorn · The Florida Keys',
    lead: 'Jason Duval',
    quote: '“Things just got a whole lot more complicated.”',
    synopsis:
      'Ex-Army runner Jason Duval knows every hidden canal and backroad between the Keys and Vice City. When small-time smuggling escalates into high-stakes cartel contracts, there is no stepping backward.',
    tags: ['EX-ARMY', 'GETAWAY', 'THE KEYS'],
    accent: '#19d3c5',
  },
  {
    id: 'act-3',
    num: 'ACT III',
    title: 'Trust or Die',
    location: 'Vice City Metro · Ocean Drive',
    lead: 'Lucia & Jason',
    quote: '“The only way we’re gonna get through this is together.”',
    synopsis:
      'In a modern city wired with surveillance, live social feeds, and relentless federal heat, loyalty is their only currency. As the entire state closes in, they must risk everything on one impossible score.',
    tags: ['PARTNERS IN CRIME', 'THE SCORE', 'NO RETREAT'],
    accent: '#ffc857',
  },
]

export function Story() {
  const stage = useRef<HTMLDivElement>(null)
  const [split, setSplit] = useState(0.5)
  const [hover, setHover] = useState<'jason' | 'lucia' | null>(null)
  const [activeAct, setActiveAct] = useState<number>(0)
  const dragging = useRef(false)
  const lead = useGame((s) => s.lead)
  const jRef = useTilt<HTMLDivElement>(6, { base: 'rotate(-2deg)' })
  const lRef = useTilt<HTMLDivElement>(6, { base: 'rotate(2deg)' })

  useEffect(() => {
    if (lead === 'jason') setSplit(0.65)
    if (lead === 'lucia') setSplit(0.35)
  }, [lead])

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !stage.current) return
      const r = stage.current.getBoundingClientRect()
      setSplit(clamp((e.clientX - r.left) / r.width, 0.18, 0.82))
    }
    const up = () => (dragging.current = false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const jActive = hover === 'jason' || split > 0.55
  const lActive = hover === 'lucia' || split < 0.45

  const switchLead = (char: 'jason' | 'lucia') => {
    sfx.select()
    const isJ = char === 'jason'
    satellite({
      title: `Switching to ${isJ ? 'Jason' : 'Lucia'}`,
      accent: isJ ? '#19d3c5' : '#ff4fa3',
      portrait: char,
      mid: () => setLead(char),
    })
  }

  const currentAct = STORY_ACTS[activeAct]

  return (
    <section id="story" className="chapter story" aria-label="The story of Leonida">
      {/* Background cinematic atmosphere */}
      <div className="story__bg" aria-hidden="true">
        <Art k="jason-and-lucia-motel" alt="" sizes="100vw" maxW={1920} />
      </div>
      <div className="story__ambient" aria-hidden="true">
        <div className="story__glow story__glow--jason" style={{ opacity: split > 0.4 ? 0.35 : 0.15 }} />
        <div className="story__glow story__glow--lucia" style={{ opacity: split < 0.6 ? 0.35 : 0.15 }} />
      </div>

      <div className="story__wrap wrap">
        {/* Header Block */}
        <div className="story__header">
          <div className="story__badge-row">
            <span className="t-label t-accent story__chapter-tag" data-reveal>
              <i className="story__pulse-dot" /> 04 · The Story
            </span>
            <span className="story__sub-badge" data-reveal style={{ ['--d' as string]: '.04s' }}>
              Vice City · Official Narrative
            </span>
          </div>

          <h2 className="d-section story__heading" data-reveal style={{ ['--d' as string]: '.08s' }}>
            Vice City,
            <br />
            <span className="story__heading-accent">USA.</span>
          </h2>

          <p className="t-body-l story__intro" data-reveal style={{ ['--d' as string]: '.12s' }}>
            Jason and Lucia are each out of second chances. When a routine score spirals out of control, the whole state closes in: rival cartels, federal heat, and millions of cameras watching in real time.
          </p>

          <div className="story__quote-box" data-reveal style={{ ['--d' as string]: '.16s' }}>
            <span className="story__quote-bar" />
            <blockquote className="story__quote-text">
              “The only way we’re gonna get through this is by being together. A team. Trust?”
            </blockquote>
            <cite className="story__quote-cite">— Lucia &amp; Jason · Grand Theft Auto VI</cite>
          </div>

          {/* Perspective selector pills */}
          <div className="story__perspective-controls" data-reveal style={{ ['--d' as string]: '.2s' }}>
            <span className="story__ctrl-label">Perspective:</span>
            <div className="story__pills" role="tablist" aria-label="Perspective selector">
              <button
                role="tab"
                aria-selected={Math.abs(split - 0.5) < 0.08}
                className={`story__pill ${Math.abs(split - 0.5) < 0.08 ? 'is-active is-duo' : ''}`}
                onClick={() => {
                  setSplit(0.5)
                  sfx.blip()
                }}
              >
                <span>✦ Dual View (50 / 50)</span>
              </button>
              <button
                role="tab"
                aria-selected={split >= 0.6}
                className={`story__pill story__pill--jason ${split >= 0.6 ? 'is-active' : ''}`}
                onClick={() => {
                  setSplit(0.72)
                  sfx.blip()
                }}
              >
                <i className="story__pill-dot story__pill-dot--jason" />
                <span>Jason Duval</span>
              </button>
              <button
                role="tab"
                aria-selected={split <= 0.4}
                className={`story__pill story__pill--lucia ${split <= 0.4 ? 'is-active' : ''}`}
                onClick={() => {
                  setSplit(0.28)
                  sfx.blip()
                }}
              >
                <i className="story__pill-dot story__pill-dot--lucia" />
                <span>Lucia Caminos</span>
              </button>
            </div>
          </div>
        </div>

        {/* The Interactive Split Stage */}
        <div
          className="story__stage"
          ref={stage}
          style={{ ['--split' as string]: split }}
          data-reveal="scale"
          tabIndex={0}
          role="region"
          aria-label="Interactive character comparison stage"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setSplit((s) => clamp(s - 0.06, 0.18, 0.82))
            if (e.key === 'ArrowRight') setSplit((s) => clamp(s + 0.06, 0.18, 0.82))
          }}
        >
          {/* Jason Duval Card */}
          <div
            className={`story__slot story__slot--j ${jActive ? 'is-expanded' : ''}`}
            style={{ flexGrow: split }}
            onMouseEnter={() => {
              setHover('jason')
              sfx.blip()
            }}
            onMouseLeave={() => setHover(null)}
          >
            <div className="story__card story__card--j" ref={jRef}>
              <Clip k="jason-duval" active={jActive} need={720} position="45% 45%" rate={0.85} />
              <div className="story__card-shade" />

              {/* HUD Header */}
              <div className="story__card-hud">
                <div className="story__card-badge story__card-badge--j">
                  <span className="story__hud-title">JASON DUVAL</span>
                  <span className="story__hud-role">EX-ARMY · THE KEYS</span>
                </div>
                {jActive && <span className="live-badge live-badge--j">● Live Clip</span>}
              </div>

              {/* Character Details & Action */}
              <div className="story__card-bottom">
                <div className="story__card-tags">
                  <span className="story__tag">Keys Local</span>
                  <span className="story__tag">Wheelman</span>
                  <span className="story__tag">Tactical</span>
                </div>
                <p className="story__card-quote">“Things just got a whole lot more complicated.”</p>
                <button
                  className="pill pill--sm story__action-btn story__action-btn--j"
                  onClick={(e) => {
                    e.stopPropagation()
                    switchLead('jason')
                  }}
                  data-cursor="PLAY"
                >
                  Play as Jason
                </button>
              </div>
            </div>
          </div>

          {/* Lucia Caminos Card */}
          <div
            className={`story__slot story__slot--l ${lActive ? 'is-expanded' : ''}`}
            style={{ flexGrow: 1 - split }}
            onMouseEnter={() => {
              setHover('lucia')
              sfx.blip()
            }}
            onMouseLeave={() => setHover(null)}
          >
            <div className="story__card story__card--l" ref={lRef}>
              <Clip k="lucia-caminos" active={lActive} need={720} position="55% 40%" rate={0.85} />
              <div className="story__card-shade" />

              {/* HUD Header */}
              <div className="story__card-hud">
                <div className="story__card-badge story__card-badge--l">
                  <span className="story__hud-title">LUCIA CAMINOS</span>
                  <span className="story__hud-role">MASTERMIND · SURVIVOR</span>
                </div>
                {lActive && <span className="live-badge live-badge--l">● Live Clip</span>}
              </div>

              {/* Character Details & Action */}
              <div className="story__card-bottom">
                <div className="story__card-tags">
                  <span className="story__tag">Penitentiary</span>
                  <span className="story__tag">Strategist</span>
                  <span className="story__tag">Fighter</span>
                </div>
                <p className="story__card-quote">“Bad luck, maybe. But we finish what we start.”</p>
                <button
                  className="pill pill--sm story__action-btn story__action-btn--l"
                  onClick={(e) => {
                    e.stopPropagation()
                    switchLead('lucia')
                  }}
                  data-cursor="PLAY"
                >
                  Play as Lucia
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Slider Divider Handle */}
          <div
            className="story__handle"
            style={{ left: `${split * 100}%` }}
            role="slider"
            aria-label="Drag to adjust split perspective between Jason and Lucia"
            aria-valuemin={18}
            aria-valuemax={82}
            aria-valuenow={Math.round(split * 100)}
            tabIndex={0}
            onPointerDown={(e) => {
              dragging.current = true
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            }}
            onDoubleClick={() => {
              setSplit(0.5)
              sfx.blip()
            }}
            data-cursor="DRAG"
          >
            <div className="story__handle-center">
              <span className="story__handle-arrows" aria-hidden="true">
                ◀▶
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Pillars / Acts Showcase */}
        <div className="story__pillars-section">
          <div className="story__pillars-head">
            <h3 className="story__pillars-heading">Story Chronicles · Three Acts of Leonida</h3>
            <span className="story__pillars-hint">Click an act to explore key narrative milestones</span>
          </div>

          <div className="story__pillars-grid" role="tablist" aria-label="Story Acts">
            {STORY_ACTS.map((act, index) => {
              const isSelected = activeAct === index
              return (
                <div
                  key={act.id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isSelected}
                  className={`story__act-card ${isSelected ? 'is-active' : ''}`}
                  style={{ ['--act-accent' as string]: act.accent }}
                  onClick={() => {
                    setActiveAct(index)
                    sfx.blip()
                    if (index === 0) setSplit(0.3)
                    else if (index === 1) setSplit(0.7)
                    else setSplit(0.5)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveAct(index)
                      sfx.blip()
                    }
                  }}
                >
                  <div className="story__act-top">
                    <span className="story__act-num">{act.num}</span>
                    <span className="story__act-loc">{act.location}</span>
                  </div>

                  <h4 className="story__act-title">{act.title}</h4>
                  <p className="story__act-synopsis">{act.synopsis}</p>

                  <div className="story__act-footer">
                    <div className="story__act-tags">
                      {act.tags.map((t) => (
                        <span key={t} className="story__act-tag">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span className="story__act-lead-pill">{act.lead}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
