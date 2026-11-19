import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { art, artBase, artVar, clipPoster, clipUrl, shotBase, shotById, type Variant } from '../content/media'
import { useGame } from '../game/store'

type PicProps = {
  base: string
  v: Variant
  sizes?: string
  alt: string
  className?: string
  style?: CSSProperties
  imgStyle?: CSSProperties
  eager?: boolean
  priority?: boolean
  fit?: 'cover' | 'contain'
  position?: string
  maxW?: number
  onLoad?: () => void
}

function Picture({ base, v, sizes = '100vw', alt, className, style, imgStyle, eager, priority, fit = 'cover', position = 'center', maxW, onLoad }: PicProps) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  const maxAllowed = maxW ?? 2560
  const widths = v.widths.filter((w) => w <= maxAllowed)
  const ws = widths.length ? widths : [v.widths[0]]
  const set = (ext: string) => ws.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ')
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true)
  }, [])
  return (
    <picture
      className={className}
      style={{ display: 'block', overflow: 'hidden', backgroundColor: v.color, backgroundImage: `url(${v.ph})`, backgroundSize: fit, backgroundPosition: position, ...style }}
    >
      <img
        ref={ref}
        src={`${base}-${ws[Math.min(1, ws.length - 1)]}.webp`}
        srcSet={set('webp')}
        sizes={sizes}
        alt={alt}
        width={v.w}
        height={v.h}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        fetchPriority={priority ? 'high' : undefined}
        onLoad={() => {
          setLoaded(true)
          onLoad?.()
        }}
        onError={(e) => {
          const target = e.currentTarget
          if (target.src !== v.ph) {
            target.srcset = ''
            target.src = v.ph
          }
          setLoaded(true)
          onLoad?.()
        }}
        style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: position, opacity: loaded ? 1 : 0, transition: 'opacity .7s var(--ease)', ...imgStyle }}
      />
    </picture>
  )
}

export function Art(props: Omit<PicProps, 'base' | 'v'> & { k: string; variant?: string }) {
  const { k, variant = 'landscape', ...rest } = props
  const v = artVar(k, variant)
  const real = useRealVariant(k, variant)
  return <Picture base={artBase(k, real)} v={v} {...rest} />
}

function useRealVariant(k: string, variant: string) {
  return art[k]?.[variant] ? variant : 'landscape'
}

export function ShotImg(props: Omit<PicProps, 'base' | 'v'> & { id: string }) {
  const { id, ...rest } = props
  const s = shotById.get(id)
  if (!s) return null
  return <Picture base={shotBase(id)} v={s} {...rest} />
}

export function Clip({ k, active, className, style, need = 720, fit = 'cover', position = 'center', rate = 1, always = false }: { k: string; active: boolean; className?: string; style?: CSSProperties; need?: number; fit?: 'cover' | 'contain'; position?: string; rate?: number; always?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const reduced = useGame((s) => s.reduced)
  const slowmo = useGame((s) => s.slowmo)
  const [visible, setVisible] = useState(() => !!active || !!always)

  useEffect(() => {
    if (active || always) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [active, always])

  const shouldPlay = (active || always || visible) && !reduced

  useEffect(() => {
    if (shouldPlay && !src) setSrc(clipUrl(k, need))
  }, [shouldPlay, src, k, need])

  useEffect(() => {
    const el = ref.current
    if (!el || !src) return
    el.playbackRate = rate * (slowmo ? 0.5 : 1)
    if (shouldPlay) {
      const p = el.play()
      if (p) p.catch(() => {})
    } else el.pause()
  }, [shouldPlay, src, rate, slowmo])

  return (
    <video
      ref={ref}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: position, display: 'block', ...style }}
      poster={clipPoster(k)}
      src={src ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      disablePictureInPicture
    />
  )
}
