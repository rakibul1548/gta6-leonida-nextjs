import { useEffect, useRef, type RefObject } from 'react'
import { get } from '../game/store'

export function startReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          ;(e.target as HTMLElement).dataset.in = '1'
          io.unobserve(e.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
  )
  const scan = (root: ParentNode) => root.querySelectorAll('[data-reveal]:not([data-in])').forEach((el) => io.observe(el))
  scan(document)
  const t = window.setTimeout(() => scan(document), 600)
  return () => {
    window.clearTimeout(t)
    io.disconnect()
  }
}

export function useTilt<T extends HTMLElement>(max = 8, opts: { scale?: number; base?: string; glare?: boolean } = {}): RefObject<T> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    const base = opts.base ?? ''
    const onMove = (e: PointerEvent) => {
      if (get().reduced) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `${base} perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(${opts.scale ?? 1.02})`
        el.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
        el.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(raf)
      el.style.transform = base
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [max, opts.scale, opts.base])
  return ref as RefObject<T>
}

export function useMagnet<T extends HTMLElement>(strength = 0.35, radius = 180): RefObject<T> {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(pointer: coarse)').matches) return
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0
    const loop = () => {
      x += (tx - x) * 0.14
      y += (ty - y) * 0.14
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(loop)
      else raf = 0
    }
    const onMove = (e: PointerEvent) => {
      if (get().reduced) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const d = Math.hypot(dx, dy)
      const reach = radius + r.width / 2
      if (d < reach) {
        tx = dx * strength
        ty = dy * strength
      } else {
        tx = 0
        ty = 0
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [strength, radius])
  return ref as RefObject<T>
}

export function useInView<T extends HTMLElement>(cb: (v: boolean) => void, rootMargin = '0px') {
  const ref = useRef<T>(null)
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => cbRef.current(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return ref
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const fmt = (n: number) => n.toLocaleString('en-US')
export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0')

type OrientationCtor = { requestPermission?: () => Promise<'granted' | 'denied'> }
export const canAskTilt = () => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches && typeof (window.DeviceOrientationEvent as unknown as OrientationCtor | undefined)?.requestPermission === 'function'
export async function requestTilt() {
  try {
    const r = await (window.DeviceOrientationEvent as unknown as OrientationCtor).requestPermission?.()
    return r === 'granted'
  } catch {
    return false
  }
}
