import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Art } from '../ui/media'
import { chapters, saga, SECRETS, OFFICIAL, LAUNCH_WAIT_DAYS, daysSinceV } from '../content/world'
import { LOGO } from '../content/media'
import { set, useGame, useLaunch } from '../game/store'
import { Countdown } from './Hero'
import { useTilt } from '../ui/fx'
import { satellite } from '../game/switch'
import { scrollTo } from '../game/scroll'
import { sfx } from '../audio/engine'

export function Launch() {
  const launch = useLaunch()
  const card = useTilt<HTMLDivElement>(14, { base: 'rotate(-5deg)', scale: 1.04 })
  return (
    <section id="launch" className="chapter launch" aria-label="Launch">
      <div className="launch__sky" aria-hidden="true" />
      <div className="launch__sun" aria-hidden="true" />
      <div className="launch__grid wrap">
        <div className="launch__card-wrap" data-reveal="scale">
          <div className="launch__card" ref={card} style={{ transform: 'rotate(-5deg)' }}>
            <Art k="official-cover-art" variant="portrait" alt="Grand Theft Auto VI official cover art" sizes="(max-width: 760px) 70vw, 380px" maxW={1080} />
            <span className="launch__foil" aria-hidden="true" />
          </div>
        </div>
        <div className="launch__copy">
          <span className="t-label" data-reveal>
            11 · November 19, 2026
          </span>
          <h2 className="d-marquee launch__title" data-reveal style={{ ['--d' as string]: '.05s' }}>
            {launch === 'post' ? (
              <>
                Out
                <br />
                now
              </>
            ) : (
              <>
                Almost
                <br />
                here
              </>
            )}
          </h2>
          {launch === 'pre' && (
            <div data-reveal style={{ ['--d' as string]: '.1s' }}>
              <Countdown />
            </div>
          )}
          <p className="t-body-l" data-reveal style={{ ['--d' as string]: '.12s' }}>
            {launch === 'post' ? 'Leonida is open. Editions and everything official live on Rockstar’s own site.' : 'Pre-load is live on Rockstar’s site. Everything official, editions included, lives there.'}
          </p>
          <div className="launch__actions" data-reveal style={{ ['--d' as string]: '.16s' }}>
            <a className="pill launch__btn" href={OFFICIAL} target="_blank" rel="noreferrer">
              {launch === 'post' ? 'Get it on rockstargames.com ↗' : 'Pre-order on rockstargames.com ↗'}
            </a>
          </div>
          <div className="launch__meta t-label" data-reveal style={{ ['--d' as string]: '.2s' }}>
            <span>PlayStation 5</span>
            <span>Xbox Series X|S</span>
            <span>ESRB · Mature 17+</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Passed() {
  const s = useGame()
  const launch = useLaunch()
  const root = useRef<HTMLElement>(null)
  const [played, setPlayed] = useState(false)
  const first = saga.find((g) => g.id === s.firstGame)
  const mins = Math.floor(s.timeSpent / 60)
  const secs = s.timeSpent % 60
  const explored = Math.round((s.visited.length / chapters.length) * 100)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || played) return
        setPlayed(true)
        sfx.sting()
        if (useGame.getState().reduced) return
        const tl = gsap.timeline()
        tl.from('.passed__w span', { yPercent: 120, rotate: 8, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.04 })
        tl.from('.passed__respect', { scale: 1.6, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.4')
        tl.from('.passed__stat', { x: -30, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'expo.out' }, '-=0.3')
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [played])

  const word = 'Mission passed'
  return (
    <section id="passed" className={`chapter passed ${s.complete ? 'is-gold' : ''}`} ref={root} aria-label="Mission passed">
      <div className="passed__bg" aria-hidden="true">
        <Art k="jason-and-lucia-01" alt="" sizes="100vw" maxW={1920} />
      </div>
      <div className="passed__inner wrap">
        <h2 className="passed__word d-marquee" aria-label={word}>
          {word.split(' ').map((w, wi) => (
            <span key={wi} className="passed__w" aria-hidden="true">
              {w.split('').map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </span>
          ))}
        </h2>
        <p className="passed__respect d-sub">{s.complete ? '100% · Leonida complete' : 'Respect +'}</p>
        <ul className="passed__stats">
          {[
            ['Leonida explored', `${explored}%`],
            ['Secrets found', `${'★'.repeat(s.secrets.length)}${'☆'.repeat(SECRETS.length - s.secrets.length)}`],
            ['Time in Leonida', `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`],
            ['First GTA', first ? `${first.short} · ${first.year}` : 'Not picked'],
            ['Lead', s.lead ? s.lead[0].toUpperCase() + s.lead.slice(1) : 'Undecided'],
            [launch === 'post' ? 'Days waited' : 'Days and counting', (launch === 'post' ? LAUNCH_WAIT_DAYS : daysSinceV()).toLocaleString('en-US')],
          ].map(([k, v]) => (
            <li key={k} className="passed__stat">
              <span className="t-label t-muted">{k}</span>
              <b>{v}</b>
            </li>
          ))}
        </ul>
        <div className="passed__actions">
          <button className="pill pill--primary" onClick={() => set({ share: 'card' })} data-cursor="MAKE">
            Share my card
          </button>
          <button
            className="pill pill--ghost"
            onClick={() =>
              satellite({ title: 'Back to Vice City', sub: 'Replay', mid: () => scrollTo(0, { immediate: true }) })
            }
          >
            Play again
          </button>
          {SECRETS.length > s.secrets.length && (
            <button className="pill pill--ghost" onClick={() => set({ menu: 'stats' })}>
              {SECRETS.length - s.secrets.length} secrets left · hints
            </button>
          )}
        </div>
      </div>
      <footer className="footer wrap">
        <img src={LOGO} alt="" width={600} height={467} className="footer__logo" />
        <div className="footer__text">
          <p className="t-body">
            <b>Fan-made. Not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive.</b> Grand Theft Auto, Grand Theft Auto VI and all related artwork, screenshots, clips, logos and trailers are trademarks and © of Rockstar Games and Take-Two Interactive, used here from Rockstar's official media kit and official YouTube channel. Nothing on this page is sold and no personal data is collected.
          </p>
          <div className="footer__links t-label">
            <a href={OFFICIAL} target="_blank" rel="noreferrer">
              Official site ↗
            </a>
            <a href="https://www.rockstargames.com/VI/media" target="_blank" rel="noreferrer">
              Official media kit ↗
            </a>
            <a href="https://www.youtube.com/@RockstarGames" target="_blank" rel="noreferrer">
              Rockstar on YouTube ↗
            </a>
            <button onClick={() => set({ menu: 'brief' })}>About this page</button>
          </div>
        </div>
      </footer>
    </section>
  )
}
