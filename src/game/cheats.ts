import { gsap } from 'gsap'
import { addSecret, get, set, toast } from './store'
import { sfx } from '../audio/engine'

const timers: Record<string, number> = {}
function later(key: string, ms: number, fn: () => void) {
  window.clearTimeout(timers[key])
  timers[key] = window.setTimeout(fn, ms)
}

export function setGrade(g: 'neon' | 'sunrise' | null) {
  const h = document.documentElement
  h.classList.remove('grade-neon', 'grade-sunrise')
  if (g) h.classList.add(`grade-${g}`)
  set({ grade: g })
}

export function flock() {
  const layer = document.createElement('div')
  layer.className = 'flock'
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('div')
    b.className = 'flock__bird'
    b.innerHTML = FLAMINGO_SVG
    b.style.setProperty('--y', `${10 + Math.random() * 60}vh`)
    b.style.setProperty('--d', `${i * 0.18 + Math.random() * 0.3}s`)
    b.style.setProperty('--s', `${0.6 + Math.random() * 0.9}`)
    b.style.setProperty('--t', `${5 + Math.random() * 2.5}s`)
    layer.appendChild(b)
  }
  document.body.appendChild(layer)
  window.setTimeout(() => layer.remove(), 11000)
}

export function wanted(ms = 6500) {
  document.documentElement.classList.add('wanted')
  set({ wanted: true })
  sfx.siren()
  later('wanted', ms, () => {
    document.documentElement.classList.remove('wanted')
    set({ wanted: false })
  })
}

export function slowmo() {
  set({ slowmo: true })
  gsap.globalTimeline.timeScale(0.5)
  document.documentElement.classList.add('slowmo')
  document.getAnimations?.().forEach((a) => (a.playbackRate = 0.5))
  later('slowmo', 10000, () => {
    gsap.globalTimeline.timeScale(1)
    document.getAnimations?.().forEach((a) => (a.playbackRate = 1))
    document.documentElement.classList.remove('slowmo')
    set({ slowmo: false })
  })
}

const CODES: Record<string, { name: string; run: () => void }> = {
  NEON: { name: 'Neon night', run: () => { setGrade('neon'); later('grade', 30000, () => setGrade(null)) } },
  SUNRISE: { name: 'Sunrise', run: () => { setGrade('sunrise'); later('grade', 30000, () => setGrade(null)) } },
  FLAMINGO: { name: 'Flock', run: flock },
  SLOWMO: { name: 'Slow motion', run: slowmo },
  WANTED: { name: 'Six stars', run: () => wanted() },
}
const CLASSIC = ['HESOYAM', 'ASPIRINE', 'PANZER', 'LEAVEMEALONE', 'BIGBANG', 'THUGSTOOLS', 'AEZAKMI', 'ROCKETMAN', 'PRECIOUSPROTECTION', 'BAGUVIX']

export function tryCheat(raw: string): boolean {
  const code = raw.toUpperCase().replace(/[^A-Z]/g, '')
  if (CODES[code]) {
    fire(code, CODES[code].name)
    CODES[code].run()
    return true
  }
  if (CLASSIC.includes(code)) {
    fire(code, 'Old habits. Respect +')
    wanted(2600)
    return true
  }
  return false
}

function fire(code: string, label: string) {
  sfx.select()
  toast('Cheat activated', `${code} · ${label}`, 'pink')
  const s = get()
  if (!s.cheatsUsed.includes(code)) set({ cheatsUsed: [...s.cheatsUsed, code] })
  addSecret('cheat')
}

let buf = ''
const ALL = [...Object.keys(CODES), ...CLASSIC]
export function wouldBeCheatPrefix(key: string) {
  const c = (buf + key.toUpperCase()).slice(-24)
  for (let n = 2; n <= c.length; n++) {
    const tail = c.slice(-n)
    if (ALL.some((code) => code.startsWith(tail))) return true
  }
  return false
}
export function startCheatListener() {
  const all = ALL
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return
    const t = e.target as HTMLElement
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    buf = (buf + e.key.toUpperCase()).slice(-24)
    for (const c of all) {
      if (buf.endsWith(c)) {
        buf = ''
        tryCheat(c)
        break
      }
    }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

export const FLAMINGO_SVG = `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="#ff7fb8"><path d="M58 40c10-12 30-14 44-6-8 0-14 3-18 8 10 1 20 6 26 14-16-6-34-5-48 2-6 3-12 2-16-2z"/><path class="w" d="M60 40C48 22 28 12 6 14c14 6 26 16 32 28 8 2 16 1 22-2z" opacity=".92"/><path d="M98 34c4-6 9-9 15-8-2 2-3 4-3 6l-7 1c-1 3-3 4-5 4z" fill="#ff9bd2"/><path d="M108 27l9-2-6 6z" fill="#1a0b1c"/></g><path d="M44 46c-10 6-22 18-30 34M50 48c-6 8-12 22-16 38" stroke="#ff7fb8" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`
