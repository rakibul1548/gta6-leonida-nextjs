'use client'

import { useState } from 'react'
import TearTicket from '../ui/TearTicket'
import { Art } from '../ui/media'
import { sfx } from '../audio/engine'
import { setLead, addSecret, toast, useGame } from '../game/store'
import { satellite } from '../game/switch'

interface StoryTicketData {
  id: string
  label: string
  title: string
  subtitle: string
  issuer: string
  serial: string
  lead: string
  leadKey: 'jason' | 'lucia' | 'both'
  loc: string
  accent: string
  bg: string
  image: string
  rotate: number
  stubTitle: string
  stubSub: string
  stubCode: string
  tornTitle: string
  tornMsg: string
  summary: string
  quote: string
}

const STORY_TICKETS: StoryTicketData[] = [
  {
    id: 'lucia-parole',
    label: 'Lucia · Parole Pass',
    title: 'LEONIDA PENITENTIARY',
    subtitle: 'Conditional Discharge & Travel Clearance',
    issuer: 'STATE DEPT. OF CORRECTIONS',
    serial: 'DOC-0925-FL',
    lead: 'LUCIA CAMINOS',
    leadKey: 'lucia',
    loc: 'VICE CITY DISTRICT',
    accent: '#ff4fa3',
    bg: '#18101e',
    image: '/media/c/lucia-caminos.webp',
    rotate: -1.5,
    stubTitle: 'PAROLE PASS',
    stubSub: 'Valid 24h from gate',
    stubCode: 'LC-0925',
    tornTitle: 'PAROLE VIOLATED!',
    tornMsg: 'Lucia broke parole. Heading straight into Vice City.',
    summary: 'Fresh out of Leonida Penitentiary, Lucia knows survival means staying three steps ahead of the law.',
    quote: '“Bad luck, maybe. But we finish what we start.”',
  },
  {
    id: 'jason-run',
    label: 'Jason · Smuggler Pass',
    title: 'THE KEYS EXPRESSWAY',
    subtitle: 'Keys to Vice City Runner Transit Manifest',
    issuer: 'PORT GELLHORN FREIGHT',
    serial: 'KEYS-0408-KW',
    lead: 'JASON DUVAL',
    leadKey: 'jason',
    loc: 'OVERSEAS HIGHWAY',
    accent: '#19d3c5',
    bg: '#0f1722',
    image: '/media/c/jason-duval.webp',
    rotate: 1.5,
    stubTitle: 'TRANSIT TOLL',
    stubSub: 'Port Gellhorn ⇄ Keys',
    stubCode: 'JD-0408',
    tornTitle: 'RUNNER GONE ROGUE!',
    tornMsg: 'Jason cut the cartel radio. The getaway is on.',
    summary: 'Ex-Army tactical wheelman who knows every backroad and tidal canal between the Keys and Vice City.',
    quote: '“Things just got a whole lot more complicated.”',
  },
  {
    id: 'dual-heist',
    label: 'Dual View · The Big Score',
    title: 'VICE CITY HEIST TICKET',
    subtitle: 'Two Leads. Zero Alibis. One Score.',
    issuer: 'ONLY RAW SYNDICATE',
    serial: 'VC-2026-HEIST',
    lead: 'JASON & LUCIA',
    leadKey: 'both',
    loc: 'OCEAN DRIVE · MIAMI BLVD',
    accent: '#ffc857',
    bg: '#1d1510',
    image: '/media/c/jason-and-lucia-lock-and-load.webp',
    rotate: -0.5,
    stubTitle: 'HEIST PASS',
    stubSub: 'Partners in crime',
    stubCode: 'VI-TRUST',
    tornTitle: 'THE SCORE IS ON!',
    tornMsg: '“The only way we get through this is together.”',
    summary: 'In a city wired with livestreams and cartel surveillance, their only real currency is trusting each other.',
    quote: '“The only way we’re gonna get through this is by being together. Trust?”',
  },
]

export function Story() {
  const [selectedIx, setSelectedIx] = useState(0)
  const [tornMap, setTornMap] = useState<Record<string, boolean>>({})
  const currentLead = useGame((s) => s.lead)

  const ticket = STORY_TICKETS[selectedIx]
  const isTorn = !!tornMap[ticket.id]

  const handleTear = () => {
    sfx.cock()
    setTornMap((prev) => ({ ...prev, [ticket.id]: true }))
    toast(ticket.tornTitle, ticket.tornMsg, 'pink')
    addSecret('story')
  }

  const handleRestore = () => {
    sfx.blip()
    setTornMap((prev) => ({ ...prev, [ticket.id]: false }))
  }

  const switchLead = (char: 'jason' | 'lucia') => {
    sfx.select()
    satellite({
      title: `Switching to ${char === 'jason' ? 'Jason' : 'Lucia'}`,
      accent: char === 'jason' ? '#19d3c5' : '#ff4fa3',
      portrait: char,
      mid: () => setLead(char),
    })
  }

  return (
    <section id="story" className="chapter story" aria-label="The story of Leonida">
      {/* Background atmosphere */}
      <div className="story__bg" aria-hidden="true">
        <Art k="jason-and-lucia-motel" alt="" sizes="100vw" maxW={1920} />
      </div>
      <div className="story__ambient" aria-hidden="true">
        <div
          className="story__glow"
          style={{
            background: `radial-gradient(circle, ${ticket.accent}33 0%, transparent 70%)`,
            transition: 'background .6s ease',
          }}
        />
      </div>

      <div className="story__wrap wrap">
        {/* Compact Header */}
        <div className="story__header">
          <div className="story__badge-row">
            <span className="t-label t-accent story__chapter-tag" data-reveal>
              <i className="story__pulse-dot" /> 04 · The Story
            </span>
            <span className="story__sub-badge" data-reveal style={{ ['--d' as string]: '.04s' }}>
              Interactive Ticket
            </span>
          </div>

          <h2 className="d-section story__heading" data-reveal style={{ ['--d' as string]: '.08s' }}>
            Vice City,
            <br />
            <span className="story__heading-accent" style={{ color: ticket.accent }}>
              USA.
            </span>
          </h2>

          <p className="t-body story__intro-compact" data-reveal style={{ ['--d' as string]: '.12s' }}>
            {ticket.summary} Grab the perforated stub and <b>drag to tear</b>.
          </p>

          {/* Ticket selector pills */}
          <div className="story__ticket-pills" role="tablist" aria-label="Story ticket selector" data-reveal style={{ ['--d' as string]: '.16s' }}>
            {STORY_TICKETS.map((t, i) => {
              const active = i === selectedIx
              const torn = !!tornMap[t.id]
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  className={`story__pill ${active ? 'is-active' : ''}`}
                  style={{
                    ['--pill-color' as string]: t.accent,
                  }}
                  onClick={() => {
                    sfx.blip()
                    setSelectedIx(i)
                  }}
                >
                  <span className="story__pill-dot" style={{ background: t.accent }} />
                  <span>{t.label}</span>
                  {torn && <span className="story__pill-torn-badge">TORN</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* The TearTicket Centerpiece */}
        <div className="story__ticket-container" data-reveal="scale">
          <TearTicket
            key={ticket.id}
            image={ticket.image}
            imageAlt={ticket.title}
            width={520}
            height={260}
            stubSize={150}
            radius={16}
            holes={13}
            holeSize={6}
            notch={4}
            roughness={0.4}
            tearAngle={30}
            stretch={30}
            resistance={0.42}
            rotate={ticket.rotate}
            tilt
            tiltMax={8}
            tiltReach={260}
            parallax={8}
            perspective={1000}
            background={ticket.bg}
            color="#ffffff"
            border
            borderWidth={1.5}
            borderColor={ticket.accent}
            recenter
            torn={isTorn}
            onTear={handleTear}
            stub={
              <div className="story-stub">
                <span className="story-stub__tag" style={{ color: ticket.accent }}>
                  {ticket.stubTitle}
                </span>
                <span className="story-stub__sub">{ticket.stubSub}</span>
                <div className="story-stub__cut-hint">
                  <span className="story-stub__cut-icon">✂</span>
                  <span className="story-stub__cut-text">DRAG TO TEAR</span>
                </div>
                <span className="story-stub__code">{ticket.stubCode}</span>
              </div>
            }
          >
            <div className="story-body">
              <div className="story-body__top">
                <span className="story-body__issuer">{ticket.issuer}</span>
                <span className="story-body__serial" style={{ color: ticket.accent }}>
                  {ticket.serial}
                </span>
              </div>
              <div className="story-body__mid">
                <h3 className="story-body__title">{ticket.title}</h3>
                <p className="story-body__sub">{ticket.subtitle}</p>
              </div>
              <div className="story-body__bottom">
                <span className="story-body__lead-badge" style={{ borderColor: `${ticket.accent}66`, color: ticket.accent }}>
                  {ticket.lead}
                </span>
                <span className="story-body__loc">{ticket.loc}</span>
              </div>
            </div>
          </TearTicket>

          {/* Interactive Ticket Controls / Status Bar */}
          <div className="story__ticket-bar">
            {isTorn ? (
              <div className="story__torn-status">
                <span className="story__torn-tag">★ STUB DETACHED</span>
                <button className="pill pill--ghost pill--sm" onClick={handleRestore}>
                  ↺ Restore Ticket
                </button>
              </div>
            ) : (
              <span className="story__ticket-hint">
                <span className="story__ticket-hint-icon">👆</span> Click &amp; drag the right-hand stub to tear off
              </span>
            )}

            <div className="story__quick-actions">
              <button
                className={`pill pill--sm ${currentLead === 'jason' ? 'pill--accent' : 'pill--ghost'}`}
                style={currentLead === 'jason' ? { background: '#19d3c5', color: '#000' } : {}}
                onClick={() => switchLead('jason')}
              >
                Play as Jason
              </button>
              <button
                className={`pill pill--sm ${currentLead === 'lucia' ? 'pill--accent' : 'pill--ghost'}`}
                style={currentLead === 'lucia' ? { background: '#ff4fa3', color: '#000' } : {}}
                onClick={() => switchLead('lucia')}
              >
                Play as Lucia
              </button>
            </div>
          </div>

          {/* Cinematic Quote Bar */}
          <div className="story__quote-compact">
            <blockquote className="story__quote-line">{ticket.quote}</blockquote>
            <cite className="story__quote-author">— Grand Theft Auto VI</cite>
          </div>
        </div>
      </div>
    </section>
  )
}
