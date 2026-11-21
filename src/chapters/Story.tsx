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
  stamp: string
  tornStamp: string
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
    bg: '#160e1d',
    image: '/media/c/lucia-caminos.webp',
    rotate: -1.2,
    stamp: 'PAROLE GRANTED · 2026',
    tornStamp: 'PAROLE VIOLATED · 10-99',
    stubTitle: 'PAROLE PASS',
    stubSub: 'Valid 24h from gate',
    stubCode: 'LC-0925',
    tornTitle: 'PAROLE VIOLATED!',
    tornMsg: 'Lucia cut her ankle monitor. Heading straight into Vice City.',
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
    bg: '#0c1622',
    image: '/media/c/jason-duval.webp',
    rotate: 1.2,
    stamp: 'EXPRESS RUNNER · CLEARED',
    tornStamp: 'ROGUE CARRIER · CODE 99',
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
    bg: '#1a130e',
    image: '/media/c/jason-and-lucia-lock-and-load.webp',
    rotate: -0.6,
    stamp: 'WANTED: 5-STAR HEAT',
    tornStamp: 'HEIST LIVE · ALL UNITS',
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
    sfx.swish()
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
            background: `radial-gradient(circle, ${ticket.accent}30 0%, transparent 70%)`,
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
              LEONIDA DOSSIER
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
            {ticket.summary} Grab the perforated stub on the right and <b>drag to tear</b>.
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

        {/* The Surveillance Terminal Frame */}
        <div className="story__terminal" data-reveal="scale">
          {/* Terminal Top Bar */}
          <div className="story__terminal-bar">
            <div className="story__terminal-telemetry">
              <span className="story__rec-dot" />
              <span>LIVE LINK // 25°46'05"N 80°11'34"W</span>
            </div>
            <div className="story__terminal-id">
              <span>LEONIDA DOC // CASE FILE #{ticket.serial}</span>
            </div>
            <div className="story__terminal-tag">CLASSIFIED</div>
          </div>

          {/* Corner Reticles */}
          <span className="story__corner story__corner--tl" aria-hidden="true" />
          <span className="story__corner story__corner--tr" aria-hidden="true" />
          <span className="story__corner story__corner--bl" aria-hidden="true" />
          <span className="story__corner story__corner--br" aria-hidden="true" />

          {/* The TearTicket Centerpiece */}
          <div className="story__ticket-container">
            <TearTicket
              key={ticket.id}
              image={ticket.image}
              imageAlt={ticket.title}
              width={560}
              height={270}
              stubSize={165}
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
                  <div className="story-stub__header">
                    <span className="story-stub__tag" style={{ color: ticket.accent }}>
                      {ticket.stubTitle}
                    </span>
                    <span className="story-stub__sub">{ticket.stubSub}</span>
                  </div>

                  {/* Interactive Perforation Cue */}
                  <div className="story-stub__cut-hint">
                    <span className="story-stub__cut-icon">✂</span>
                    <span className="story-stub__cut-text">DRAG ➔ TEAR</span>
                  </div>

                  {/* Barcode Block */}
                  <div className="story-stub__barcode-wrap">
                    <svg className="story-stub__barcode-svg" viewBox="0 0 110 32" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y="0" width="2" height="32" fill="currentColor" />
                      <rect x="4" y="0" width="1" height="32" fill="currentColor" />
                      <rect x="7" y="0" width="3" height="32" fill="currentColor" />
                      <rect x="12" y="0" width="1.5" height="32" fill="currentColor" />
                      <rect x="15" y="0" width="4" height="32" fill="currentColor" />
                      <rect x="21" y="0" width="1" height="32" fill="currentColor" />
                      <rect x="24" y="0" width="2.5" height="32" fill="currentColor" />
                      <rect x="29" y="0" width="3" height="32" fill="currentColor" />
                      <rect x="34" y="0" width="1" height="32" fill="currentColor" />
                      <rect x="37" y="0" width="2" height="32" fill="currentColor" />
                      <rect x="41" y="0" width="4" height="32" fill="currentColor" />
                      <rect x="47" y="0" width="1.5" height="32" fill="currentColor" />
                      <rect x="51" y="0" width="2" height="32" fill="currentColor" />
                      <rect x="55" y="0" width="3.5" height="32" fill="currentColor" />
                      <rect x="61" y="0" width="1" height="32" fill="currentColor" />
                      <rect x="64" y="0" width="3" height="32" fill="currentColor" />
                      <rect x="69" y="0" width="1.5" height="32" fill="currentColor" />
                      <rect x="73" y="0" width="4" height="32" fill="currentColor" />
                      <rect x="79" y="0" width="2" height="32" fill="currentColor" />
                      <rect x="83" y="0" width="1" height="32" fill="currentColor" />
                      <rect x="86" y="0" width="3" height="32" fill="currentColor" />
                      <rect x="91" y="0" width="1.5" height="32" fill="currentColor" />
                      <rect x="95" y="0" width="2" height="32" fill="currentColor" />
                      <rect x="99" y="0" width="3" height="32" fill="currentColor" />
                      <rect x="104" y="0" width="1" height="32" fill="currentColor" />
                      <rect x="107" y="0" width="2.5" height="32" fill="currentColor" />
                    </svg>
                    <span className="story-stub__code">{ticket.stubCode}</span>
                  </div>
                </div>
              }
            >
              <div className="story-body">
                {/* Official State Crest Watermark */}
                <svg className="story-body__watermark" viewBox="0 0 200 200" fill="none" aria-hidden="true">
                  <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
                  <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="1" />
                  <path d="M70 145 C75 115 95 90 100 85 C105 90 125 115 130 145 Z" fill="currentColor" fillOpacity="0.2" />
                  <path d="M100 85 Q70 65 50 75 Q70 85 90 95" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M100 85 Q130 65 150 75 Q130 85 110 95" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M100 85 Q80 50 70 40 Q85 60 95 80" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M100 85 Q120 50 130 40 Q115 60 105 80" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <text x="100" y="38" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" letterSpacing="3">
                    STATE OF LEONIDA
                  </text>
                  <text x="100" y="172" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="2">
                    OFFICIAL SEAL · 1845
                  </text>
                </svg>

                {/* Holographic Security Ribbon */}
                <div className="story-foil" aria-hidden="true" />

                {/* Distressed Rubber Stamp */}
                <div className={`story-stamp ${isTorn ? 'is-torn' : ''}`} style={{ ['--stamp-c' as string]: isTorn ? '#ff3b30' : ticket.accent }}>
                  <div className="story-stamp__inner">
                    <span className="story-stamp__sub">{isTorn ? 'OFFICIAL ALERT' : 'LEONIDA DOC'}</span>
                    <span className="story-stamp__text">{isTorn ? ticket.tornStamp : ticket.stamp}</span>
                  </div>
                </div>

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
                  <span className="story-body__lead-badge" style={{ borderColor: `${ticket.accent}88`, color: ticket.accent }}>
                    {ticket.lead}
                  </span>
                  <span className="story-body__loc">{ticket.loc}</span>
                </div>
              </div>
            </TearTicket>
          </div>

          {/* Interactive Ticket Controls & Status Bar */}
          <div className="story__ticket-bar">
            {isTorn ? (
              <div className="story__torn-status">
                <span className="story__torn-tag">★ STUB DETACHED · LOGGED</span>
                <button className="pill pill--ghost pill--sm" onClick={handleRestore}>
                  ↺ Restore Ticket
                </button>
              </div>
            ) : (
              <span className="story__ticket-hint">
                <span className="story__ticket-hint-icon">👆</span> Drag the perforated right stub to tear
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
