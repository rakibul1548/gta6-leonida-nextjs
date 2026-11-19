import { useEffect, useRef, useState } from 'react'
import { ShotImg } from '../ui/media'
import { daysSinceV, GTAV_RELEASE, LAUNCH_WAIT_DAYS, LAUNCH } from '../content/world'
import { onTick, getVelocity } from '../game/scroll'
import { set, useGame, useLaunch } from '../game/store'
import { fmt, useMagnet } from '../ui/fx'
import { playVideo } from './Hero'
import { sfx } from '../audio/engine'

function Row({ text, dir, outline, speed }: { text: string; dir: 1 | -1; outline?: boolean; speed: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useGame((s) => s.reduced)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '250px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || !inView) return
    const el = ref.current
    if (!el) return
    let x = 0
    let skew = 0
    let half = el.scrollWidth / 2 || 1000
    const onResize = () => {
      if (el) half = el.scrollWidth / 2 || 1000
    }
    window.addEventListener('resize', onResize, { passive: true })
    const off = onTick((_, dt) => {
      const v = getVelocity()
      x += dir * (speed + Math.min(40, Math.abs(v)) * 14) * dt
      if (x < -half) x += half
      if (x > 0) x -= half
      skew += (Math.max(-12, Math.min(12, v * 0.35)) - skew) * 0.12
      el.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${(-skew * dir).toFixed(2)}deg)`
    })
    return () => {
      off()
      window.removeEventListener('resize', onResize)
    }
  }, [dir, speed, reduced, inView])
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className={`marquee__item ${outline ? 'is-outline' : ''}`}>
      {text}
      <i aria-hidden="true">·</i>
    </span>
  ))
  return (
    <div className="marquee__row" aria-hidden="true">
      <div className="marquee__track" ref={ref}>
        {items}
        {items}
      </div>
    </div>
  )
}

function useTicker() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return now
}

export function Wait() {
  const launch = useLaunch()
  const now = useTicker()
  const btn = useMagnet<HTMLButtonElement>(0.4, 220)
  const gotLine = useGame((s) => s.gotLine)
  const [draft, setDraft] = useState(gotLine)
  useEffect(() => setDraft(gotLine), [gotLine])
  const pre = launch === 'pre'
  const days = pre ? daysSinceV(now) : LAUNCH_WAIT_DAYS
  const secs = Math.floor(((pre ? now : LAUNCH.getTime()) - GTAV_RELEASE.getTime()) / 1000)
  const line1 = pre ? 'We waited' : 'The wait is over'
  const line2 = pre ? `${fmt(days)} days and counting` : `${fmt(days)} days`

  return (
    <section id="wait" className="chapter wait" aria-label="The wait">
      <div className="wait__bg" aria-hidden="true">
        <ShotImg id="vice-city-27" alt="" sizes="100vw" maxW={1920} />
      </div>
      <div className="wait__vignette" />
      <h2 className="sr-only">
        {line1}. {line2}.
      </h2>
      <div className="marquee">
        <Row text={line1} dir={-1} speed={70} />
        <Row text={line2} dir={1} outline speed={55} />
      </div>
      <button ref={btn} className="wait__btn" onClick={() => playVideo('rz1B4B2yBZY')} data-cursor="PLAY" onMouseEnter={() => sfx.blip()}>
        <span className="d-card">
          Watch
          <br />
          trailer
        </span>
      </button>
      <div className="wait__foot wrap">
        <p className="wait__counter" data-reveal>
          <span className="t-label t-muted">{pre ? 'Since GTA V · 17 Sep 2013' : 'GTA V to GTA VI'}</span>
          <b className="wait__secs">{fmt(secs)}</b>
          <span className="t-label t-muted">seconds{pre ? ' and counting' : ''}</span>
        </p>
        <form
          className="gotline"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault()
            set({ gotLine: draft.trim(), share: 'card' })
            sfx.select()
          }}
        >
          <label htmlFor="gotline" className="gotline__label">
            I got
          </label>
          <input id="gotline" className="gotline__input" maxLength={48} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="a degree, a job and two kids" />
          <span className="gotline__label">before GTA VI</span>
          <button className="pill pill--primary" type="submit" data-cursor="MAKE">
            Make my card →
          </button>
        </form>
      </div>
    </section>
  )
}
