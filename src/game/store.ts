import { create } from 'zustand'
import { LAUNCH, SECRETS, type ChapterId } from '../content/world'

export type Lead = 'jason' | 'lucia' | null
export type Quality = 'high' | 'mid' | 'low'
export type MenuTab = 'map' | 'brief' | 'stats' | 'gallery' | 'settings'
export type Toast = { id: number; title: string; sub?: string; tone?: 'gold' | 'pink' | 'plain' }

const KEY = 'leonida.v1'
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()

function load(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(KEY)
    const o = raw ? JSON.parse(raw) : {}
    if (!o || typeof o !== 'object') return {}
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : undefined)
    const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
    const one = <T extends string>(v: unknown, ok: readonly T[]) => (ok.includes(v as T) ? (v as T) : undefined)
    return {
      lead: one(o.lead, ['jason', 'lucia'] as const) ?? null,
      soundPref: typeof o.soundPref === 'boolean' ? o.soundPref : undefined,
      qualityMode: one(o.qualityMode, ['auto', 'high', 'mid', 'low'] as const),
      motionPref: one(o.motionPref, ['auto', 'full', 'reduced'] as const),
      secrets: arr(o.secrets),
      visited: arr(o.visited) as ChapterId[] | undefined,
      firstGame: str(o.firstGame) ?? null,
      gotLine: str(o.gotLine),
      cheatsUsed: arr(o.cheatsUsed),
      timeSpent: typeof o.timeSpent === 'number' && isFinite(o.timeSpent) ? o.timeSpent : undefined,
      launchPref: one(o.launchPref, ['auto', 'pre', 'post'] as const),
      name: str(o.name),
      loadout: o.loadout && typeof o.loadout === 'object' ? o.loadout : undefined,
    }
  } catch {
    return {}
  }
}

type Persisted = {
  lead: Lead
  soundPref: boolean
  qualityMode: 'auto' | Quality
  motionPref: 'auto' | 'full' | 'reduced'
  secrets: string[]
  visited: ChapterId[]
  firstGame: string | null
  gotLine: string
  cheatsUsed: string[]
  timeSpent: number
  launchPref: 'auto' | 'pre' | 'post'
  name: string
  loadout: Loadout
}

export type Loadout = { outfit: string; outfitShot: number; weapon: string; weaponShot: number; car: string; carShot: number; paint: string | null; paintName: string | null }
export const DEFAULT_LOADOUT: Loadout = { outfit: 'vice-city-style', outfitShot: 0, weapon: 'hawk-little-morgan', weaponShot: 0, car: 'vapid-stanier', carShot: 0, paint: null, paintName: null }

export type State = Persisted & {
  entered: boolean
  sound: boolean
  quality: Quality
  autoQuality: Quality
  reduced: boolean
  chapter: ChapterId
  menu: MenuTab | null
  lightbox: { ids: string[]; index: number } | null
  share: 'card' | 'cover' | null
  dossier: string | null
  toasts: Toast[]
  playing: boolean
  pendingVideo: string | null
  grade: 'neon' | 'sunrise' | null
  wanted: boolean
  slowmo: boolean
  complete: boolean
  hudHidden: boolean
  launchOverride: 'pre' | 'post' | null
  heroTime: string | null
  glLost: boolean
}

const saved = load()
const prefersReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const urlState = params.get('state')
const urlLead = params.get('lead')
const urlQuality = params.get('quality')
const motionPref0 = saved.motionPref || 'auto'

export const useGame = create<State>(() => ({
  lead: urlLead === 'jason' || urlLead === 'lucia' ? urlLead : saved.lead || null,
  soundPref: saved.soundPref ?? false,
  qualityMode: urlQuality === 'high' || urlQuality === 'mid' || urlQuality === 'low' ? urlQuality : saved.qualityMode || 'auto',
  motionPref: motionPref0,
  secrets: saved.secrets || [],
  visited: saved.visited || [],
  firstGame: saved.firstGame ?? null,
  gotLine: saved.gotLine || '',
  cheatsUsed: saved.cheatsUsed || [],
  timeSpent: saved.timeSpent || 0,
  launchPref: saved.launchPref || 'auto',
  launchOverride: urlState === 'pre' || urlState === 'post' ? urlState : null,
  heroTime: null,
  glLost: false,
  name: saved.name || '',
  loadout: { ...DEFAULT_LOADOUT, ...(saved.loadout || {}) },
  entered: false,
  sound: false,
  quality: 'high',
  autoQuality: 'high',
  reduced: params.get('motion') === 'reduced' || motionPref0 === 'reduced' || (motionPref0 === 'auto' && prefersReduced),
  chapter: 'hero',
  menu: null,
  lightbox: null,
  share: null,
  dossier: null,
  toasts: [],
  playing: false,
  pendingVideo: null,
  grade: null,
  wanted: false,
  slowmo: false,
  complete: (saved.secrets || []).length >= SECRETS.length,
  hudHidden: false,
}))

const persistKeys: (keyof Persisted)[] = ['lead', 'soundPref', 'qualityMode', 'motionPref', 'secrets', 'visited', 'firstGame', 'gotLine', 'cheatsUsed', 'timeSpent', 'launchPref', 'name', 'loadout']
let saveTimer = 0
useGame.subscribe((s) => {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      const o: Record<string, unknown> = {}
      for (const k of persistKeys) o[k] = s[k]
      localStorage.setItem(KEY, JSON.stringify(o))
    } catch {}
  }, 300)
})

export const get = () => useGame.getState()
export const set = (p: Partial<State> | ((s: State) => Partial<State>)) => useGame.setState(p as Partial<State>)

export function launchState(s: Pick<State, 'launchPref' | 'launchOverride'> = get()): 'pre' | 'post' {
  if (s.launchOverride) return s.launchOverride
  if (s.launchPref === 'pre' || s.launchPref === 'post') return s.launchPref
  return Date.now() >= LAUNCH.getTime() ? 'post' : 'pre'
}
export const useLaunch = () => useGame((s) => launchState(s))

let toastId = 0
export function toast(title: string, sub?: string, tone: Toast['tone'] = 'plain', ms = 3800) {
  const id = ++toastId
  set((s) => ({ toasts: [...s.toasts.slice(-3), { id, title, sub, tone }] }))
  window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ms)
}

type Listener = (id: string, total: number) => void
const secretListeners = new Set<Listener>()
export const onSecret = (fn: Listener) => {
  secretListeners.add(fn)
  return () => secretListeners.delete(fn)
}

export function addSecret(id: string) {
  const s = get()
  if (s.secrets.includes(id)) return false
  const secrets = [...s.secrets, id]
  const meta = SECRETS.find((x) => x.id === id)
  set({ secrets, complete: secrets.length >= SECRETS.length })
  toast(`★ ${meta?.name ?? 'Secret'} found`, `${secrets.length} of ${SECRETS.length} secrets`, 'gold')
  secretListeners.forEach((fn) => fn(id, secrets.length))
  return true
}

export function setLead(lead: Lead) {
  set({ lead })
  document.documentElement.dataset.lead = lead ?? ''
}

export function visit(id: ChapterId) {
  const s = get()
  if (s.chapter !== id) set({ chapter: id })
  if (!s.visited.includes(id)) set({ visited: [...s.visited, id] })
}

export function openMenu(tab: MenuTab = 'map') {
  set({ menu: tab })
}
export function closeOverlays() {
  const s = get()
  if (s.lightbox) return set({ lightbox: null })
  if (s.share) return set({ share: null })
  if (s.dossier) return set({ dossier: null })
  if (s.menu) return set({ menu: null })
}
export const anyOverlay = () => {
  const s = get()
  return !!(s.menu || s.lightbox || s.share || s.dossier)
}
