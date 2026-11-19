import * as THREE from 'three'
import { onTick } from '../game/scroll'
import { get, set } from '../game/store'
import { setResizeHook } from './quality'

export type View = {
  el: HTMLElement
  render: (r: THREE.WebGLRenderer, t: number, dt: number, w: number, h: number) => void
  dispose?: () => void
  enabled?: () => boolean
  visible?: boolean
}

let renderer: THREE.WebGLRenderer | null = null
let canvas: HTMLCanvasElement | null = null
const views = new Set<View>()
let off: (() => void) | null = null
let frames = 0
let acc = 0
let probing = true
let cleared = true

export function getRenderer() {
  if (renderer) return renderer
  canvas = document.createElement('canvas')
  canvas.className = 'gl-stage'
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', left: '0', top: '0', zIndex: '0', pointerEvents: 'none', transform: 'translateZ(0)', willChange: 'transform' })
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    set({ glLost: true })
  })
  document.body.prepend(canvas)
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.autoClear = false
  resize()
  window.addEventListener('resize', resize)
  window.visualViewport?.addEventListener('resize', resize)
  setResizeHook(resize)
  off = onTick(loop)
  return renderer
}

function dprFor() {
  const q = get().quality
  return Math.min(window.devicePixelRatio || 1, q === 'high' ? 1.5 : 1)
}

function resize() {
  if (!renderer) return
  renderer.setPixelRatio(dprFor())
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  if (canvas) {
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
  }
}


function loop(t: number, dt: number) {
  if (!renderer || views.size === 0) return
  const s = get()
  if (s.menu || s.lightbox || s.share) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  let any = false
  for (const v of views) {
    if (v.visible === false) continue
    if (v.enabled && !v.enabled()) continue
    const r = v.el.getBoundingClientRect()
    if (r.bottom <= 0 || r.top >= vh || r.width === 0) continue
    if (!any) {
      renderer.setScissorTest(false)
      renderer.clear()
      renderer.setScissorTest(true)
      any = true
    }
    const x = Math.max(0, r.left)
    const y = Math.max(0, r.top)
    const w = Math.min(vw, r.right) - x
    const h = Math.min(vh, r.bottom) - y
    const by = vh - (r.top + r.height)
    renderer.setViewport(r.left, by, r.width, r.height)
    renderer.setScissor(x, vh - (y + h), w, h)
    v.render(renderer, t, dt, r.width, r.height)
  }
  if (any) cleared = false
  else if (!cleared) {
    renderer.setScissorTest(false)
    renderer.clear()
    cleared = true
  }
  if (any && probing) {
    frames++
    acc += dt
    if (frames === 150) {
      probing = false
      const avg = (acc / frames) * 1000
      const q = get().quality
      if (get().qualityMode === 'auto') {
        if (q === 'high' && avg > 26) set({ quality: 'mid', autoQuality: 'mid' })
        else if (q === 'mid' && avg > 34) set({ quality: 'low', autoQuality: 'low' })
        resize()
      }
      ;(window as unknown as { __fps?: number }).__fps = Math.round(1000 / avg)
    }
  }
}

export function addView(v: View) {
  getRenderer()
  v.visible = true
  const io = new IntersectionObserver(
    ([entry]) => {
      v.visible = entry.isIntersecting
    },
    { rootMargin: '80px 0px' },
  )
  io.observe(v.el)
  views.add(v)
  return () => {
    io.disconnect()
    views.delete(v)
    v.dispose?.()
  }
}

export function disposeStage() {
  off?.()
  renderer?.dispose()
  canvas?.remove()
  renderer = null
}

export const loader = new THREE.TextureLoader()
export function loadTex(url: string, aniso = 4): Promise<THREE.Texture> {
  return new Promise((res, rej) => {
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = aniso
        t.generateMipmaps = true
        t.minFilter = THREE.LinearMipmapLinearFilter
        res(t)
      },
      undefined,
      rej,
    )
  })
}
export function loadData(url: string): Promise<THREE.Texture> {
  return new Promise((res, rej) => {
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.NoColorSpace
        t.minFilter = THREE.LinearFilter
        t.generateMipmaps = false
        res(t)
      },
      undefined,
      rej,
    )
  })
}
