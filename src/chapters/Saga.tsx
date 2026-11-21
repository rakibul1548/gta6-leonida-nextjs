import { useEffect, useMemo, useState } from 'react'
import { saga } from '../content/world'
import { set, useGame } from '../game/store'
import { sfx } from '../audio/engine'
import { clamp } from '../ui/fx'
import BounceCards from '../ui/BounceCards'

const NOW_YEAR = Math.max(2026, new Date().getFullYear())

function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 800 })
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

export function Saga() {
  const firstGame = useGame((s) => s.firstGame)
  const start = Math.max(0, saga.findIndex((g) => g.id === (firstGame ?? 'sa')))
  const [shown, setShown] = useState(start)
  const size = useWindowSize()

  const isMobile = size.width < 640
  const isTablet = size.width >= 640 && size.width < 1024

  const containerWidth = isMobile ? Math.min(370, size.width - 24) : isTablet ? Math.min(680, size.width - 40) : 840
  const containerHeight = isMobile ? 260 : isTablet ? 320 : 360
  const cardSize = isMobile ? 110 : isTablet ? 150 : 190
  const spread = isMobile ? 32 : isTablet ? 54 : 76
  const pushDistance = isMobile ? 65 : isTablet ? 110 : 150
  const rotation = isMobile ? 8 : 12
  const arc = isMobile ? -8 : -16

  const cards = useMemo(
    () =>
      saga.map((g) => ({
        src: `/media/saga/${g.id}.webp`,
        alt: `${g.title} (${g.year})`,
      })),
    [],
  )

  const selectedIndex = saga.findIndex((g) => g.id === firstGame)

  const pick = (id: string) => {
    set({ firstGame: id })
    sfx.select()
  }

  const go = (i: number) => {
    const n = clamp(Math.round(i), 0, saga.length - 1)
    if (n !== shown) sfx.blip()
    setShown(n)
  }

  const cur = saga[shown]
  const years = NOW_YEAR - cur.year
  const picked = saga.find((g) => g.id === firstGame)

  return (
    <section
      id="saga"
      className="chapter saga"
      aria-label="The road to VI"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(shown + 1)
        if (e.key === 'ArrowLeft') go(shown - 1)
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          pick(cur.id)
        }
      }}
    >
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

      <div className="saga__interactive wrap" data-cursor="LOOK">
        <BounceCards
          images={cards}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          cardSize={cardSize}
          spread={spread}
          rotation={rotation}
          arc={arc}
          pushDistance={pushDistance}
          hoverScale={1.08}
          bounciness={0.65}
          animationDelay={0.3}
          animationStagger={0.06}
          borderWidth={isMobile ? 3 : 4}
          borderColor="#ffffff"
          radius={isMobile ? 14 : 20}
          shadow
          enableHover
          selectedIndex={selectedIndex}
          onCardClick={(index) => {
            setShown(index)
            pick(saga[index].id)
          }}
          onCardHover={(index) => {
            setShown(index)
            sfx.blip()
          }}
        />
      </div>

      <div className="saga__foot wrap">
        <div className="saga__info">
          <span className="saga__title">{cur.title}</span>
          <div className="saga__meta" aria-live="polite">
            <span className="t-label t-muted">{cur.place}</span>
            <b className="d-sub">
              {cur.year} <i>·</i> {years === 0 ? 'this year' : `${years} years ago`}
            </b>
          </div>
          <span className="saga__hint">Hover to explore · Click card or button to select</span>
        </div>

        <div className="saga__actions">
          <button className="pill pill--ghost pill--sm" onClick={() => go(shown - 1)} aria-label="Previous game">
            ←
          </button>
          <button className="pill pill--primary" onClick={() => pick(cur.id)} data-cursor="PICK">
            {cur.id === 'gta6' ? 'This is my first' : 'This was my first'}
          </button>
          <button className="pill pill--ghost pill--sm" onClick={() => go(shown + 1)} aria-label="Next game">
            →
          </button>
        </div>

        <p className="saga__answer" aria-live="polite">
          {picked ? (
            picked.id === 'gta6' ? (
              <>
                Day one. <span className="t-accent">Welcome to Leonida.</span>
              </>
            ) : (
              <>
                In since {picked.year}. <span className="t-accent">{NOW_YEAR - picked.year} years.</span>
              </>
            )
          ) : (
            <span className="t-muted">Your answer goes on your card.</span>
          )}
        </p>
      </div>
    </section>
  )
}
