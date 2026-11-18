import { artUrl, LOGO, shotUrl } from '../content/media'
import { daysSinceV, LAUNCH_WAIT_DAYS, saga, SECRETS } from '../content/world'
import { get, launchState } from './store'
import { gearById } from '../content/loadout'

const cache = new Map<string, Promise<HTMLImageElement>>()
export function img(src: string) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((res, rej) => {
        const i = new Image()
        i.decoding = 'async'
        i.onload = () => res(i)
        i.onerror = (e) => {
          cache.delete(src)
          rej(e)
        }
        i.src = src
      }),
    )
  }
  return cache.get(src)!
}

async function fonts() {
  try {
    await Promise.all([document.fonts.load('400 120px Anton'), document.fonts.load('600 40px "Inter Tight"'), document.fonts.load('400 40px "Inter Tight"')])
  } catch {}
}

function cover(g: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / im.width, h / im.height)
  const sw = w / s
  const sh = h / s
  g.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, x, y, w, h)
}

function badge(g: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string) {
  g.font = '700 26px "Inter Tight", Arial'
  const w = g.measureText(text).width + 32
  g.fillStyle = bg
  g.fillRect(x - w, y, w, 44)
  g.fillStyle = fg
  g.textBaseline = 'middle'
  g.fillText(text, x - w + 16, y + 23)
  g.textBaseline = 'alphabetic'
}

function fitText(g: CanvasRenderingContext2D, text: string, max: number, size: number, font = 'Anton') {
  let s = size
  do {
    g.font = `400 ${s}px ${font}, Impact, sans-serif`
    s -= 4
  } while (g.measureText(text).width > max && s > 20)
}

export type CardFormat = '4x5' | '9x16'

export async function drawCard(format: CardFormat): Promise<HTMLCanvasElement> {
  await fonts()
  const s = get()
  const W = 1080
  const H = format === '4x5' ? 1350 : 1920
  const lo = s.loadout
  const car = gearById[lo.car]
  const look = gearById[lo.outfit]
  const piece = gearById[lo.weapon]
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const gold = s.complete
  const lead = s.lead
  const bgKey = lead === 'jason' ? 'jason-and-lucia-lock-and-load' : lead === 'lucia' ? 'jason-and-lucia-beach' : 'jason-and-lucia-01'
  const bg = await img(artUrl(bgKey, 'portrait', 1080))
  cover(g, bg, 0, 0, W, H, 0.5, 0.25)
  const grad = g.createLinearGradient(0, H * 0.35, 0, H)
  grad.addColorStop(0, 'rgba(8,6,13,0)')
  grad.addColorStop(0.55, 'rgba(8,6,13,0.86)')
  grad.addColorStop(1, 'rgba(8,6,13,0.98)')
  g.fillStyle = grad
  g.fillRect(0, 0, W, H)
  if (gold) {
    const gg = g.createLinearGradient(0, 0, W, H)
    gg.addColorStop(0, 'rgba(255,200,87,0.28)')
    gg.addColorStop(1, 'rgba(255,122,60,0.1)')
    g.fillStyle = gg
    g.fillRect(0, 0, W, H)
    g.strokeStyle = '#ffc857'
    g.lineWidth = 14
    g.strokeRect(7, 7, W - 14, H - 14)
  }
  const logo = await img(LOGO)
  const lw = 230
  g.drawImage(logo, 56, 56, lw, (lw * logo.height) / logo.width)
  badge(g, 'FAN MADE', W - 56, 64, '#ffc857', '#1a0b1c')

  let inset: { src: CanvasImageSource; painted: boolean } | null = null
  if (car) {
    try {
      const { paintInto, gearUrl } = await import('./respray')
      const shotIx = Math.min(lo.carShot, car.shots.length - 1)
      const sh = car.shots[Math.max(0, shotIx)]
      if (lo.paint && sh.paint) inset = { src: await paintInto(document.createElement('canvas'), sh.id, lo.paint, 1280), painted: true }
      else inset = { src: await img(gearUrl(sh.id, 1280)), painted: false }
    } catch {
      inset = null
    }
  }
  const pad = 64
  let y = H - 120
  g.fillStyle = 'rgba(255,246,236,0.7)'
  g.font = '600 26px "Inter Tight", Arial'
  g.fillText('VI · WELCOME TO LEONIDA · FAN-MADE, NOT AFFILIATED WITH ROCKSTAR GAMES', pad, H - 56)

  const lines: { t: string; c: string; size: number; font?: string }[] = []
  const first = saga.find((x) => x.id === s.firstGame)
  if (first) lines.push({ t: first.id === 'gta6' ? 'DAY ONE · FIRST GTA IS VI' : `IN SINCE ${first.short.toUpperCase()} · ${first.year}`, c: '#ff9bd2', size: 40, font: '"Inter Tight"' })
  const days = launchState() === 'post' ? LAUNCH_WAIT_DAYS : daysSinceV()
  const head = launchState() === 'post' ? `WAITED ${days.toLocaleString('en-US')} DAYS` : `${days.toLocaleString('en-US')} DAYS AND COUNTING`
  const big: string[] = [head]
  if (s.gotLine.trim()) lines.push({ t: `I GOT ${s.gotLine.trim().toUpperCase()} BEFORE GTA VI`, c: '#fff6ec', size: 38, font: '"Inter Tight"' })
  if (lead) lines.push({ t: `TEAM ${lead.toUpperCase()}`, c: lead === 'jason' ? '#19d3c5' : '#ff4fa3', size: 44, font: '"Inter Tight"' })
  if (car) lines.push({ t: `RIDE · ${car.name.toUpperCase()}${lo.paint ? ' · ' + (lo.paintName || 'CUSTOM').toUpperCase() : ''}`, c: '#fff6ec', size: 30, font: '"Inter Tight"' })
  if (look && piece) lines.push({ t: `LOOK · ${look.name.toUpperCase()} · ${piece.name.toUpperCase()}`, c: 'rgba(255,246,236,0.75)', size: 26, font: '"Inter Tight"' })
  lines.push({ t: `${'★'.repeat(s.secrets.length)}${'☆'.repeat(SECRETS.length - s.secrets.length)}  ${s.secrets.length}/${SECRETS.length} SECRETS`, c: '#ffc857', size: 34, font: '"Inter Tight"' })

  y = H - 150
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i]
    g.fillStyle = l.c
    g.font = `700 ${l.size}px ${l.font ?? 'Anton'}, Arial`
    const wrapped = wrap(g, l.t, W - pad * 2)
    for (let k = wrapped.length - 1; k >= 0; k--) {
      g.fillText(wrapped[k], pad, y)
      y -= l.size * 1.3
    }
    y -= 6
  }
  y -= 18
  g.fillStyle = gold ? '#ffc857' : '#fff6ec'
  for (const t of big) {
    fitText(g, t, W - pad * 2, format === '4x5' ? 150 : 170)
    g.fillText(t, pad, y)
    y -= 150
  }
  if (gold) {
    g.fillStyle = '#ffc857'
    g.font = '400 64px Anton, Impact'
    g.fillText('100% · LEONIDA COMPLETE', pad, y + 20)
    y -= 60
  }
  if (inset) {
    const iw = format === '4x5' ? 420 : 560
    const ih = Math.round((iw * 9) / 16)
    const bottom = Math.max(140 + ih, y - 10)
    const cx = W - 64 - iw / 2
    const cy = bottom - ih / 2
    g.save()
    g.translate(cx, cy)
    g.rotate((-3.5 * Math.PI) / 180)
    g.shadowColor = 'rgba(0,0,0,0.45)'
    g.shadowBlur = 30
    g.fillStyle = '#fff'
    g.fillRect(-iw / 2 - 8, -ih / 2 - 8, iw + 16, ih + 16)
    g.shadowBlur = 0
    g.drawImage(inset.src, -iw / 2, -ih / 2, iw, ih)
    if (inset.painted) {
      g.font = '700 18px "Inter Tight", Arial'
      const t = 'RESPRAY · FAN PREVIEW'
      const tw = g.measureText(t).width + 18
      g.fillStyle = 'rgba(8,6,13,0.82)'
      g.fillRect(-iw / 2, ih / 2 - 30, tw, 30)
      g.fillStyle = '#fff6ec'
      g.textBaseline = 'middle'
      g.fillText(t, -iw / 2 + 9, ih / 2 - 15)
      g.textBaseline = 'alphabetic'
    }
    g.restore()
  }
  return c
}

function wrap(g: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(' ')
  const out: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (g.measureText(t).width > max && line) {
      out.push(line)
      line = w
    } else line = t
  }
  if (line) out.push(line)
  return out
}

export const COVER_SLOTS = [
  { x: 40, y: 40, w: 330, h: 300 },
  { x: 386, y: 40, w: 330, h: 420 },
  { x: 732, y: 40, w: 308, h: 300 },
  { x: 40, y: 356, w: 330, h: 470 },
  { x: 732, y: 356, w: 308, h: 470 },
  { x: 40, y: 842, w: 330, h: 380 },
  { x: 386, y: 842, w: 330, h: 380 },
  { x: 732, y: 842, w: 308, h: 380 },
]
export const COVER_CENTER = { x: 386, y: 476, w: 330, h: 350 }

export async function drawCover(ids: string[], name: string): Promise<HTMLCanvasElement> {
  await fonts()
  const W = 1080
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = '#1b0b33'
  g.fillRect(0, 0, W, H)
  const ims = await Promise.all(ids.map((id) => img(shotUrl(id, 1280))))
  COVER_SLOTS.forEach((r, i) => {
    const im = ims[i]
    if (!im) return
    cover(g, im, r.x, r.y, r.w, r.h)
  })
  const cr = COVER_CENTER
  const cg = g.createLinearGradient(cr.x, cr.y, cr.x, cr.y + cr.h)
  cg.addColorStop(0, '#4b1d8f')
  cg.addColorStop(0.5, '#e93a9a')
  cg.addColorStop(1, '#ffc857')
  g.fillStyle = cg
  g.fillRect(cr.x, cr.y, cr.w, cr.h)
  const logo = await img(LOGO)
  const lw = cr.w - 30
  const lh = (lw * logo.height) / logo.width
  g.drawImage(logo, cr.x + 15, cr.y + (cr.h - lh) / 2, lw, lh)
  g.fillStyle = '#fff6ec'
  const nm = (name || 'YOU').toUpperCase()
  fitText(g, `STARRING ${nm}`, W - 300, 64)
  g.fillText(`STARRING ${nm}`, 40, H - 52)
  badge(g, 'FAN MADE', W - 40, H - 96, '#ffc857', '#1a0b1c')
  return c
}

export async function exportCanvas(c: HTMLCanvasElement, filename: string) {
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/png'))
  if (!blob) return false
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
  if (nav.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ files: [file], title: 'VI · Welcome to Leonida' })
      return true
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return false
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  return true
}
