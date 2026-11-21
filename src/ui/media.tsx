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
  const [loaded, setLoaded] = useState(() => !!eager || !!priority)
  const ref = useRef<HTMLImageElement>(null)
  const maxAllowed = maxW ?? 2560
  const widths = v.widths.filter((w) => w <= maxAllowed)
  const ws = widths.length ? widths : [v.widths[0]]
  const set = (ext: string) => ws.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ')
  const fallbackIx = maxAllowed <= 640 ? 0 : Math.min(1, ws.length - 1)
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
        src={`${base}-${ws[fallbackIx]}.webp`}
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
        style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: position, opacity: loaded ? 1 : 0.85, transition: 'opacity .3s var(--ease)', ...imgStyle }}
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

export function Clip({
  k,
  active,
  className,
  style,
  need = 720,
  fit = 'cover',
  position = 'center',
  rate = 1,
  always = false,
}: {
  k: string
  active: boolean
  className?: string
  style?: CSSProperties
  need?: number
  fit?: 'cover' | 'contain'
  position?: string
  rate?: number
  always?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const reduced = useGame((s) => s.reduced)
  const slowmo = useGame((s) => s.slowmo)
  const [intersecting, setIntersecting] = useState(() => !!always)

  useEffect(() => {
    if (always) {
      setIntersecting(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setIntersecting(e.isIntersecting), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [always])

  const shouldPlay = (always || (active && intersecting)) && !reduced

  useEffect(() => {
    if (shouldPlay) {
      setSrc(clipUrl(k, need))
    } else {
      setVideoReady(false)
    }
  }, [shouldPlay, k, need])

  useEffect(() => {
    const el = ref.current
    if (!el || !src) return
    el.playbackRate = rate * (slowmo ? 0.5 : 1)
    if (shouldPlay) {
      const p = el.play()
      if (p) {
        p.catch(() => {
          const retry = () => {
            el.play().catch(() => {})
            window.removeEventListener('click', retry)
            window.removeEventListener('touchstart', retry)
          }
          window.addEventListener('click', retry, { once: true })
          window.addEventListener('touchstart', retry, { once: true })
        })
      }
    } else el.pause()
  }, [shouldPlay, src, rate, slowmo])

  const poster = clipPoster(k)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0c0815',
        ...style,
      }}
    >
      <img
        src={poster}
        alt=""
        loading="eager"
        decoding="async"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: fit,
          objectPosition: position,
          opacity: 1,
          pointerEvents: 'none',
        }}
      />
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload={shouldPlay ? 'auto' : 'none'}
        poster={poster}
        src={src ?? undefined}
        onTimeUpdate={(e) => {
          const v = e.currentTarget
          if (!v.paused && v.currentTime > 0.08) setVideoReady(true)
        }}
        onPlaying={(e) => {
          if (e.currentTarget.currentTime > 0.08) setVideoReady(true)
        }}
        aria-hidden="true"
        disablePictureInPicture
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: fit,
          objectPosition: position,
          opacity: videoReady ? 1 : 0,
          transition: 'opacity .4s ease',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
