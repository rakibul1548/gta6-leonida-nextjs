import manifest from './manifest.json'

export type Variant = { w: number; h: number; widths: number[]; ph: string; color: string }
export type Shot = Variant & { id: string; group: 'people' | 'place'; tag: string; label: string; n: number }
export type ClipInfo = { w: number; h: number; square: boolean; dur: number; sizes: number[] }

export const art = manifest.art as unknown as Record<string, Record<string, Variant>>
export const shots = manifest.shots as unknown as Shot[]
export const clips = manifest.clips as unknown as Record<string, ClipInfo>
export const shotById = new Map(shots.map((s) => [s.id, s]))

export const LOGO = '/media/vi-logo.webp'

export const artBase = (key: string, variant = 'landscape') => `/media/a/${key}-${variant}`
export const shotBase = (id: string) => `/media/s/${id}`

export function artVar(key: string, variant = 'landscape'): Variant {
  const a = art[key]
  if (!a) throw new Error('missing art ' + key)
  return a[variant] || a.landscape
}

export function pickWidth(widths: number[], need: number) {
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  const target = need * dpr
  return widths.find((w) => w >= target) ?? widths[widths.length - 1]
}

export function artUrl(key: string, variant = 'landscape', need = 1920, ext: 'webp' | 'avif' = 'webp') {
  const v = artVar(key, variant)
  return `${artBase(key, variant)}-${pickWidth(v.widths, need)}.${ext}`
}

export function shotUrl(id: string, need = 1280, ext: 'webp' | 'avif' = 'webp') {
  const s = shotById.get(id)
  const widths = s?.widths ?? [640, 1280, 1920, 2560]
  return `${shotBase(id)}-${pickWidth(widths, need)}.${ext}`
}

export function clipUrl(key: string, need = 720) {
  const c = clips[key]
  const size = c ? (c.sizes.find((s) => s >= need) ?? c.sizes[c.sizes.length - 1]) : 720
  return `/media/c/${key}-${size}.mp4`
}

export const clipPoster = (key: string) => `/media/c/${key}.webp`

export const shotsByTag = (tag: string) => shots.filter((s) => s.tag === tag)

export const isPhone = () => typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 0.8
