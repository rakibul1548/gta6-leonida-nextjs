import { img } from './share'

type Src = { w: number; h: number; px: Uint8ClampedArray; mask: Uint8Array }
const cache = new Map<string, Promise<Src>>()
const MAX = 4

export const gearUrl = (id: string, w = 1280, ext: 'webp' | 'avif' = 'webp') => `/media/g/${id}-${w}.${ext}`
export const maskUrl = (id: string) => `/media/m/${id}.webp`

function load(id: string, w: number): Promise<Src> {
  const key = `${id}@${w}`
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const p = Promise.all([img(gearUrl(id, w)), img(maskUrl(id))]).then(([im, mk]) => {
    const W = im.naturalWidth
    const H = im.naturalHeight
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(im, 0, 0)
    const px = g.getImageData(0, 0, W, H).data
    g.clearRect(0, 0, W, H)
    g.drawImage(mk, 0, 0, W, H)
    const md = g.getImageData(0, 0, W, H).data
    const mask = new Uint8Array(W * H)
    for (let i = 0, j = 0; j < mask.length; i += 4, j++) mask[j] = md[i]
    return { w: W, h: H, px, mask }
  })
  p.catch(() => cache.delete(key))
  cache.set(key, p)
  while (cache.size > MAX) cache.delete(cache.keys().next().value as string)
  return p
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export async function paintInto(canvas: HTMLCanvasElement, id: string, hex: string | null, w = 1280) {
  const s = await load(id, w)
  canvas.width = s.w
  canvas.height = s.h
  const g = canvas.getContext('2d')!
  const out = g.createImageData(s.w, s.h)
  const o = out.data
  const p = s.px
  const m = s.mask
  if (!hex) {
    o.set(p)
    g.putImageData(out, 0, 0)
    return canvas
  }
  const [cr, cg, cb] = hexToRgb(hex)
  const lumP = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb
  const lift = lumP < 0.12 ? 0.55 : 1
  for (let i = 0, j = 0; i < p.length; i += 4, j++) {
    const mk = m[j] / 255
    if (mk < 0.02) {
      o[i] = p[i]
      o[i + 1] = p[i + 1]
      o[i + 2] = p[i + 2]
      o[i + 3] = 255
      continue
    }
    const r = p[i] / 255
    const gg = p[i + 1] / 255
    const b = p[i + 2] / 255
    const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b
    const k = mk * ss(0.07, 0.2, l)
    const diffuse = Math.min(1.15, Math.pow(l, 1.12) * 1.12 + 0.05) * lift
    let pr = cr * diffuse
    let pg = cg * diffuse
    let pb = cb * diffuse
    const spec = ss(0.8, 1.0, l)
    pr += (1 - pr) * spec * 0.85
    pg += (1 - pg) * spec * 0.85
    pb += (1 - pb) * spec * 0.85
    o[i] = (r * (1 - k) + pr * k) * 255
    o[i + 1] = (gg * (1 - k) + pg * k) * 255
    o[i + 2] = (b * (1 - k) + pb * k) * 255
    o[i + 3] = 255
  }
  g.putImageData(out, 0, 0)
  return canvas
}
