import { useEffect, useRef, useState } from 'react'
import { videos, ytThumb, ytWatch, type Video } from '../content/world'
import { addSecret, set, useGame } from '../game/store'
import { scrollTo } from '../game/scroll'
import { duck, sfx } from '../audio/engine'

type YTPlayer = { loadVideoById: (o: { videoId: string; startSeconds?: number }) => void; seekTo: (s: number, a: boolean) => void; playVideo: () => void; pauseVideo: () => void; destroy: () => void }
type YTNS = { Player: new (el: HTMLElement, o: unknown) => YTPlayer; PlayerState: Record<string, number> }

let ytReady: Promise<YTNS> | null = null
function loadYT(): Promise<YTNS> {
  const w = window as unknown as { YT?: YTNS & { loaded?: number }; onYouTubeIframeAPIReady?: () => void }
  if (w.YT?.Player) return Promise.resolve(w.YT)
  if (!ytReady) {
    ytReady = new Promise((res) => {
      w.onYouTubeIframeAPIReady = () => res(w.YT as YTNS)
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      document.head.appendChild(s)
    })
  }
  return ytReady
}

export function DriveIn() {
  const section = useRef<HTMLElement>(null)
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [current, setCurrent] = useState<Video>(videos[0])
  const [loaded, setLoaded] = useState(false)
  const playing = useGame((s) => s.playing)
  const pending = useGame((s) => s.pendingVideo)

  const ready = useRef(false)
  const creating = useRef(false)
  const queued = useRef<{ id: string; at: number } | null>(null)
  const [failed, setFailed] = useState(false)

  async function start(v: Video, at = 0) {
    if (!v.embed) {
      window.open(ytWatch(v.id), '_blank', 'noopener')
      return
    }
    setCurrent(v)
    sfx.select()
    if (player.current && ready.current) {
      player.current.loadVideoById({ videoId: v.id, startSeconds: at })
      return
    }
    queued.current = { id: v.id, at }
    if (creating.current) return
    creating.current = true
    setLoaded(true)
    const timeout = window.setTimeout(() => {
      if (!ready.current) setFailed(true)
    }, 9000)
    let YT: YTNS
    try {
      YT = await loadYT()
    } catch {
      setFailed(true)
      return
    }
    if (!mount.current) return
    const holder = document.createElement('div')
    mount.current.innerHTML = ''
    mount.current.appendChild(holder)
    const first = queued.current ?? { id: v.id, at }
    player.current = new YT.Player(holder, {
      host: 'https://www.youtube-nocookie.com',
      videoId: first.id,
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, rel: 0, playsinline: 1, start: first.at, modestbranding: 1, mute: 0 },
      events: {
        onReady: () => {
          ready.current = true
          window.clearTimeout(timeout)
          setFailed(false)
          const q = queued.current
          queued.current = null
          if (q && q.id !== first.id) player.current?.loadVideoById({ videoId: q.id, startSeconds: q.at })
        },
        onStateChange: (e: { data: number }) => {
          const on = e.data === 1 || e.data === 3
          set({ playing: on })
          duck(on)
          if (e.data === 0) {
            set({ playing: false })
            duck(false)
            addSecret('trailer')
          }
        },
      },
    })
  }

  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        const open = !!(s.menu || s.lightbox || s.share || s.dossier)
        const was = !!(prev.menu || prev.lightbox || prev.share || prev.dossier)
        if (open && !was && ready.current && s.playing) {
          player.current?.pauseVideo()
          set({ playing: false })
          duck(false)
        }
      }),
    [],
  )

  useEffect(() => {
    if (!pending) return
    const v = videos.find((x) => x.id === pending) ?? videos[0]
    set({ pendingVideo: null })
    if (section.current) scrollTo(section.current, { duration: 1.6 })
    start(v)
  }, [pending])

  useEffect(() => {
    if (!section.current) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting && player.current && ready.current) {
        player.current.pauseVideo()
        set({ playing: false })
        duck(false)
      }
    })
    io.observe(section.current)
    return () => io.disconnect()
  }, [])

  return (
    <section id="drivein" className={`chapter drivein ${playing ? 'is-playing' : ''}`} ref={section} aria-label="The Drive-In: official trailers">
      <div className="drivein__bar drivein__bar--top" />
      <div className="drivein__inner wrap">
        <div className="drivein__head">
          <span className="t-label t-accent" data-reveal>
            09 · Videos
          </span>
          <h2 className="d-section" data-reveal>
            The Drive-In
          </h2>
        </div>
        <div className="drivein__grid">
          <div className="drivein__screen" data-reveal="scale">
            <div className="drivein__player" ref={mount} />
            {failed && (
              <a className="drivein__fallback" href={ytWatch(current.id)} target="_blank" rel="noreferrer">
                <span className="d-sub">The player didn’t load</span>
                <span className="pill pill--primary">Watch {current.title} on YouTube ↗</span>
              </a>
            )}
            {!loaded && (
              <button className="drivein__facade" onClick={() => start(current)} data-cursor="PLAY" aria-label={`Play ${current.title}`}>
                <img src={ytThumb(current.id)} alt="" loading="lazy" />
                <span className="drivein__play" aria-hidden="true">
                  ▶
                </span>
                <span className="drivein__now d-sub">{current.title}</span>
              </button>
            )}
          </div>
          <ol className="drivein__list" aria-label="Official videos">
            {videos.map((v) => (
              <li key={v.id}>
                <button className={`drivein__row ${v.id === current.id ? 'is-on' : ''}`} onClick={() => start(v)} onMouseEnter={() => sfx.blip()} data-cursor={v.embed ? 'PLAY' : 'YOUTUBE'}>
                  <img src={ytThumb(v.id, false)} alt="" loading="lazy" />
                  <span className="t-label">{v.title}</span>
                  <em className="t-label t-muted">
                    {v.length}
                    {!v.embed && ' ↗'}
                  </em>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="drivein__chips">
          {current.chips ? (
            <>
              <span className="t-label t-muted">Scene select</span>
              {current.chips.map((c, i) => (
                <button
                  key={c.t}
                  className="chip"
                  onClick={() => {
                    if (player.current && ready.current) {
                      player.current.seekTo(c.t, true)
                      player.current.playVideo()
                    } else start(current, c.t)
                  }}
                >
                  <b>{String(i + 1).padStart(2, '0')}</b> {c.label} <i>{Math.floor(c.t / 60)}:{String(c.t % 60).padStart(2, '0')}</i>
                </button>
              ))}
            </>
          ) : (
            <span className="t-label t-muted">Official video from Rockstar Games on YouTube.</span>
          )}
        </div>
      </div>
      <div className="drivein__bar drivein__bar--bottom" />
    </section>
  )
}
