import { useEffect, useRef, useState } from 'react'
import { Clip, Art } from '../ui/media'
import { clamp, useTilt } from '../ui/fx'
import { useGame } from '../game/store'
import { sfx } from '../audio/engine'

export function Story() {
  const stage = useRef<HTMLDivElement>(null)
  const [split, setSplit] = useState(0.5)
  const [hover, setHover] = useState<'jason' | 'lucia' | null>(null)
  const dragging = useRef(false)
  const lead = useGame((s) => s.lead)
  const jRef = useTilt<HTMLDivElement>(7, { base: 'rotate(-4deg)' })
  const lRef = useTilt<HTMLDivElement>(7, { base: 'rotate(3.5deg)' })

  useEffect(() => {
    if (lead === 'jason') setSplit(0.62)
    if (lead === 'lucia') setSplit(0.38)
  }, [lead])

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !stage.current) return
      const r = stage.current.getBoundingClientRect()
      setSplit(clamp((e.clientX - r.left) / r.width, 0.24, 0.76))
    }
    const up = () => (dragging.current = false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const jActive = hover === 'jason' || split > 0.58
  const lActive = hover === 'lucia' || split < 0.42

  return (
    <section id="story" className="chapter story" aria-label="The story">
      <div className="story__bg" aria-hidden="true">
        <Art k="jason-and-lucia-motel" alt="" sizes="100vw" maxW={1920} />
      </div>
      <div className="story__grid wrap">
        <div className="story__copy">
          <span className="t-label t-accent" data-reveal>
            04 · The story
          </span>
          <h2 className="d-section" data-reveal style={{ ['--d' as string]: '.05s' }}>
            Vice City,
            <br />
            USA.
          </h2>
          <p className="t-body-l" data-reveal style={{ ['--d' as string]: '.1s' }}>
            Jason and Lucia are each out of second chances. One easy job goes wrong, and the whole state closes in: crooks, cops, and everyone holding a phone.
          </p>
          <p className="t-body t-muted" data-reveal style={{ ['--d' as string]: '.15s' }}>
            All they really have is each other. Drag the line to choose whose side of the story fills the screen.
          </p>
          <div className="story__tags" data-reveal style={{ ['--d' as string]: '.2s' }}>
            <span className="tag">Action</span>
            <span className="tag">Crime</span>
            <span className="tag">Thriller</span>
          </div>
        </div>

        <div className="story__stage" ref={stage} style={{ ['--split' as string]: split }} data-reveal="scale">
          <div className="story__slot story__slot--j" style={{ flexGrow: split }} onMouseEnter={() => { setHover('jason'); sfx.blip() }} onMouseLeave={() => setHover(null)}>
            <div className="story__card story__card--j" ref={jRef} style={{ transform: 'rotate(-4deg)' }}>
              <Clip k="jason-duval" active={jActive} need={720} position="42% 50%" rate={0.8} />
              {jActive && <span className="live-badge">● Live</span>}
              <span className="story__name">Jason Duval</span>
            </div>
          </div>
          <div className="story__slot story__slot--l" style={{ flexGrow: 1 - split }} onMouseEnter={() => { setHover('lucia'); sfx.blip() }} onMouseLeave={() => setHover(null)}>
            <div className="story__card story__card--l" ref={lRef} style={{ transform: 'rotate(3.5deg)' }}>
              <Clip k="lucia-caminos" active={lActive} need={720} position="58% 50%" rate={0.8} />
              {lActive && <span className="live-badge">● Live</span>}
              <span className="story__name">Lucia Caminos</span>
            </div>
          </div>
          <button
            className="story__handle"
            style={{ left: `${split * 100}%` }}
            aria-label="Drag to give either lead the screen"
            role="slider"
            aria-valuemin={24}
            aria-valuemax={76}
            aria-valuenow={Math.round(split * 100)}
            onPointerDown={(e) => {
              dragging.current = true
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setSplit((s) => clamp(s - 0.05, 0.24, 0.76))
              if (e.key === 'ArrowRight') setSplit((s) => clamp(s + 0.05, 0.24, 0.76))
            }}
            data-cursor="DRAG"
          >
            <span aria-hidden="true">◀▶</span>
          </button>
        </div>
      </div>
    </section>
  )
}
