import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { artUrl, clipUrl, shotsByTag, LOGO } from '../content/media'
import { Art } from '../ui/media'
import { set, useGame } from '../game/store'
import { sfx } from '../audio/engine'

const PANELS: { x: number; y: number; w: number; h: number; tag: string; label: string; from: [number, number] }[] = [
  { x: 1.7, y: 3, w: 17.6, h: 39.8, tag: 'vice-city', label: 'Vice City from the air', from: [-1, -1] },
  { x: 20.3, y: 3, w: 29.4, h: 52.9, tag: 'jason-and-lucia', label: 'Jason and Lucia', from: [0, -1] },
  { x: 50.5, y: 3, w: 27.6, h: 36.4, tag: 'leonida-keys', label: 'Leonida Keys', from: [0, -1] },
  { x: 79.2, y: 3, w: 19.1, h: 49, tag: 'raul-bautista', label: 'Raul Bautista', from: [1, -1] },
  { x: 1.7, y: 44.4, w: 17.7, h: 52.4, tag: 'vice-city', label: 'Vice Beach', from: [-1, 1] },
  { x: 20.3, y: 57.6, w: 20.9, h: 39.3, tag: 'vice-city', label: 'Ocean drive', from: [-1, 1] },
  { x: 42.2, y: 71, w: 18.4, h: 25.8, tag: 'grassrivers', label: 'Grassrivers', from: [0, 1] },
  { x: 61.6, y: 41, w: 16.6, h: 55.8, tag: 'boobie-ike', label: 'Boobie Ike', from: [1, 1] },
  { x: 79.2, y: 53.3, w: 19.1, h: 43.6, tag: 'vice-city', label: 'Street life', from: [1, 1] },
]
const LOGO_RECT = { x: 31, y: 31, w: 33.4, h: 46.7 }

export function Cover() {
  const wall = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [built, setBuilt] = useState(false)
  const [film, setFilm] = useState(false)
  const reduced = useGame((s) => s.reduced)
  const [phone, setPhone] = useState(false)
  const [near, setNear] = useState(false)
  const img = artUrl('official-cover-art', 'landscape', 1920)
  const bg = near ? `url(${img})` : undefined

  useEffect(() => {
    const mq = matchMedia('(max-width: 760px)')
    const on = () => setPhone(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const el = wall.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '120% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [phone])

  useEffect(() => {
    if (phone || !wall.current) return
    const el = wall.current
    if (reduced) {
      setBuilt(true)
      return
    }
    const ctx = gsap.context(() => {
      gsap.set('.cover__panel', { opacity: 0 })
      gsap.set('.cover__logo', { opacity: 0, scale: 1.5 })
    }, el)
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const tl = gsap.timeline({ onComplete: () => setBuilt(true) })
        const panels = el.querySelectorAll<HTMLElement>('.cover__panel')
        panels.forEach((p, i) => {
          const [fx, fy] = PANELS[i].from
          tl.fromTo(p, { opacity: 0, xPercent: fx * 60, yPercent: fy * 60, rotate: fx * 6 - fy * 3, scale: 1.1 }, { opacity: 1, xPercent: 0, yPercent: 0, rotate: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, i * 0.11)
          tl.add(() => sfx.blip(), i * 0.11)
        })
        tl.to(el.querySelector('.cover__logo'), { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.8)' }, '-=0.3')
        tl.add(() => sfx.select(), '<')
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      ctx.revert()
    }
  }, [phone, reduced])

  const openTag = (tag: string) => {
    const ids = shotsByTag(tag).map((s) => s.id)
    if (ids.length) set({ lightbox: { ids, index: 0 } })
  }

  const playFilm = () => {
    setFilm(true)
    sfx.select()
    requestAnimationFrame(() => {
      const v = video.current
      if (!v) return
      v.currentTime = 6.2
      v.play().catch(() => {})
    })
  }

  return (
    <section id="cover" className="chapter cover" aria-label="The cover">
      <div className="cover__head wrap">
        <span className="t-label t-accent" data-reveal>
          10 · The cover
        </span>
        <h2 className="d-section" data-reveal>
          The Cover
        </h2>
        <p className="t-body-l t-muted" data-reveal>
          {phone ? 'Rockstar’s official cover, plus the reveal animation. Tap the cover for 138 official screenshots.' : 'Nine panels, one logo. Every panel is a door into Rockstar’s official screenshots. Click the logo to play the cover reveal.'}
        </p>
      </div>
      {phone ? (
        <div className="cover__phonewrap">
          <button className="cover__phone" onClick={() => set({ menu: 'gallery' })} data-reveal>
            <Art k="official-cover-art" variant="portrait" alt="Grand Theft Auto VI official cover art" sizes="100vw" maxW={1620} />
          </button>
          {film ? (
            <div className="cover__phonefilm">
              <video src={clipUrl('cover-animation', 720)} muted playsInline autoPlay onLoadedMetadata={(e) => (e.currentTarget.currentTime = 6.2)} onEnded={() => setFilm(false)} />
            </div>
          ) : (
            <button className="pill pill--ghost cover__phoneplay" onClick={() => setFilm(true)}>
              ▶ Play the cover reveal
            </button>
          )}
        </div>
      ) : (
        <div className={`cover__wall ${built ? 'is-built' : ''} ${film ? 'is-film' : ''}`} ref={wall}>
          <div className="cover__full" style={{ backgroundImage: bg }} aria-hidden="true" />
          {PANELS.map((p, i) => (
            <button
              key={i}
              className="cover__panel"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.w}%`,
                height: `${p.h}%`,
                backgroundImage: bg,
                backgroundSize: `${(100 / p.w) * 100}% ${(100 / p.h) * 100}%`,
                backgroundPosition: `${(p.x / (100 - p.w)) * 100}% ${(p.y / (100 - p.h)) * 100}%`,
              }}
              onClick={() => openTag(p.tag)}
              onMouseEnter={() => sfx.blip()}
              aria-label={`Open screenshots: ${p.label}`}
              data-cursor="OPEN"
            >
              <span className="cover__tag t-label">{p.label}</span>
            </button>
          ))}
          <button
            className="cover__logo"
            style={{ left: `${LOGO_RECT.x}%`, top: `${LOGO_RECT.y}%`, width: `${LOGO_RECT.w}%`, height: `${LOGO_RECT.h}%` }}
            onClick={playFilm}
            aria-label="Play the official cover art reveal"
            data-cursor="PLAY"
          >
            <img src={LOGO} alt="" />
            <span className="cover__hint t-label">▶ Cover reveal</span>
          </button>
          {film && (
            <div className="cover__film">
              <video ref={video} src={clipUrl('cover-animation', 1080)} muted playsInline onEnded={() => setFilm(false)} />
              <button className="pill pill--ghost pill--sm" onClick={() => setFilm(false)}>
                Back to the wall
              </button>
            </div>
          )}
        </div>
      )}
      <div className="cover__actions wrap" data-reveal>
        <button className="pill pill--primary" onClick={() => set({ share: 'cover' })} data-cursor="MAKE">
          Make your own cover
        </button>
        <button className="pill pill--ghost" onClick={() => set({ menu: 'gallery' })}>
          Open the gallery · 138 screenshots
        </button>
      </div>
    </section>
  )
}
