import { useEffect, useMemo, useRef, useState } from 'react'
import { TABS, PAINTS, gearById, type GearItem, type GearShot, type TabId } from '../content/loadout'
import { clipPoster } from '../content/media'
import { gearUrl, paintInto } from '../game/respray'
import { satellite } from '../game/switch'
import { set, setLead, toast, useGame, type Loadout as LO } from '../game/store'
import { sfx } from '../audio/engine'

const KEYS: Record<TabId, ['outfit' | 'weapon' | 'car', 'outfitShot' | 'weaponShot' | 'carShot']> = {
  wardrobe: ['outfit', 'outfitShot'],
  weapons: ['weapon', 'weaponShot'],
  garage: ['car', 'carShot'],
}

function shotsFor(item: GearItem, tab: TabId, lead: 'jason' | 'lucia' | null): GearShot[] {
  if (tab !== 'wardrobe' || !lead) return item.shots
  const mine = item.shots.filter((s) => s.who === lead || s.who === 'both' || !s.who)
  return mine.length ? mine : item.shots
}

function GearPic({ id, className, sizes = '100vw', eager }: { id: string; className?: string; sizes?: string; eager?: boolean }) {
  const ws = [640, 1280, 1920, 2560]
  return (
    <picture className={className}>
      <img src={gearUrl(id, 1280)} srcSet={ws.map((w) => `${gearUrl(id, w)} ${w}w`).join(', ')} sizes={sizes} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />
    </picture>
  )
}

export function Loadout() {
  const lead = useGame((s) => s.lead)
  const lo = useGame((s) => s.loadout)
  const [tab, setTab] = useState<TabId>('garage')
  const [painted, setPainted] = useState<string | null>(null)
  const [spraying, setSpraying] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 1440, h: 900, desk: true })
  const [custom, setCustom] = useState<string | null>(null)
  const drag = useRef<{ x: number; fired: boolean } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [selKey, shotKey] = KEYS[tab]
  const list = TABS.find((t) => t.id === tab)!.list
  const item = gearById[lo[selKey]] ?? list[0]
  const shots = useMemo(() => shotsFor(item, tab, lead), [item, tab, lead])
  const shotIx = Math.min(lo[shotKey], shots.length - 1)
  const shot = shots[Math.max(0, shotIx)]
  const paintable = tab === 'garage' && !!shot.paint
  const paintKey = paintable && lo.paint ? `${shot.id}|${lo.paint}` : null

  const update = (p: Partial<LO>) => set((s) => ({ loadout: { ...s.loadout, ...p } }))

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight, desk: window.innerWidth > 900 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!paintKey) {
      setPainted(null)
      return
    }
    let alive = true
    const w = box.w * Math.min(devicePixelRatio, 2) > 1700 ? 1920 : 1280
    paintInto(document.createElement('canvas'), shot.id, lo.paint, w)
      .then((off) => {
        const c = canvas.current
        if (!alive || !c) return
        c.width = off.width
        c.height = off.height
        c.getContext('2d')!.drawImage(off, 0, 0)
        setPainted(paintKey)
      })
      .catch(() => alive && setPainted(null))
    return () => {
      alive = false
    }
  }, [paintKey])

  useEffect(() => {
    if (!custom) return
    const t = window.setTimeout(() => paint(custom, 'Custom', true), 160)
    return () => window.clearTimeout(t)
  }, [custom])

  const frame = useMemo(() => {
    const [fx, fy, sc] = shot.focus ?? [0.5, 0.5, 1.08]
    const ar = 16 / 9
    const cw = Math.max(box.w, box.h * ar) * sc
    const ch = cw / ar
    const tx = box.desk ? 0.56 * box.w : 0.5 * box.w
    const ty = box.desk ? 0.56 * box.h : 0.5 * box.h
    const left = Math.min(0, Math.max(box.w - cw, tx - fx * cw))
    const top = Math.min(0, Math.max(box.h - ch, ty - fy * ch))
    return { left, top, width: cw, height: ch }
  }, [shot, box])

  const choose = (g: GearItem) => {
    if (g.id === item.id) return
    update({ [selKey]: g.id, [shotKey]: 0 } as Partial<LO>)
    if (tab === 'garage') sfx.rev()
    else if (tab === 'weapons') sfx.cock()
    else sfx.swish()
  }

  const turn = (d: number) => {
    const n = (shotIx + d + shots.length) % shots.length
    update({ [shotKey]: n } as Partial<LO>)
    sfx.blip()
  }

  const paint = (hex: string | null, name: string | null, quiet = false) => {
    if (!quiet) {
      sfx.spray()
      setSpraying(true)
      window.setTimeout(() => setSpraying(false), 900)
    }
    const patch: Partial<LO> = { paint: hex, paintName: name }
    if (hex && !shot.paint) {
      const ix = shots.findIndex((s) => s.paint)
      if (ix >= 0) patch.carShot = ix
    }
    update(patch)
    if (hex && !quiet) toast('Fresh paint', `${name} on the ${item.name.replace(/’\d\d /, '')}`, 'pink', 2400)
  }

  const randomise = () => {
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
    const o = pick(TABS[0].list)
    const w = pick(TABS[1].list)
    const c = pick(TABS[2].list.filter((x) => x.shots.some((s) => s.paint)))
    const p = pick(PAINTS)
    update({ outfit: o.id, outfitShot: 0, weapon: w.id, weaponShot: 0, car: c.id, carShot: Math.max(0, c.shots.findIndex((s) => s.paint)), paint: p.hex, paintName: p.name })
    setTab('garage')
    sfx.rev()
  }

  const outfit = gearById[lo.outfit]
  const weapon = gearById[lo.weapon]
  const car = gearById[lo.car]

  return (
    <section id="loadout" className={`chapter loadout loadout--${tab}`} aria-label="Loadout: wardrobe, weapons and garage">
      <div
        className="loadout__stage"
        ref={stageRef}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button, input, a')) return
          drag.current = { x: e.clientX, fired: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d || d.fired) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 70) {
            d.fired = true
            turn(dx < 0 ? 1 : -1)
          }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        data-cursor={shots.length > 1 ? 'DRAG' : undefined}
      >
        <div className="loadout__shot" key={shot.id} style={frame}>
          <GearPic id={shot.id} eager />
        </div>
        <canvas ref={canvas} style={frame} className={`loadout__paint ${painted === paintKey && paintKey ? 'is-on' : ''} ${spraying ? 'is-spraying' : ''}`} aria-hidden="true" />
        {spraying && <div className="loadout__mist" style={{ ['--paint' as string]: lo.paint ?? '#fff' }} />}
        <div className="loadout__shade" />
      </div>

      <div className="loadout__top wrap">
        <div className="loadout__title">
          <span className="t-label t-accent">06 · Loadout</span>
          <h2 className="d-section">Gear up</h2>
        </div>
        <div className="loadout__leads" role="radiogroup" aria-label="Choose your lead">
          {(['jason', 'lucia'] as const).map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={lead === l}
              className={`lead-pick lead-pick--${l} ${lead === l ? 'is-on' : ''}`}
              onClick={() => {
                if (lead === l) return
                sfx.select()
                satellite({ title: `Switching to ${l === 'jason' ? 'Jason' : 'Lucia'}`, accent: l === 'jason' ? '#19d3c5' : '#ff4fa3', portrait: l, mid: () => { setLead(l); update({ outfitShot: 0 }) } })
              }}
              data-cursor="PICK"
            >
              <span className="lead-pick__face" style={{ backgroundImage: `url(${clipPoster(l === 'jason' ? 'jason-duval' : 'lucia-caminos')})` }} />
              <span>
                <b className="t-label">{l === 'jason' ? 'Jason' : 'Lucia'}</b>
                <i className="t-label t-muted">{lead === l ? 'Selected' : 'Play as'}</i>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="shop" role="group" aria-label="Loadout menu">
        <div className="shop__banner">
          <span className="d-sub">{TABS.find((t) => t.id === tab)!.label}</span>
          <span className="t-label">{list.indexOf(item) + 1} / {list.length}</span>
        </div>
        <div className="shop__tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`t-label ${tab === t.id ? 'is-on' : ''}`}
              onClick={() => {
                setTab(t.id)
                sfx.select()
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          className="shop__list"
          ref={listRef}
          role="listbox"
          aria-label={`${tab} options`}
          onKeyDown={(e) => {
            const i = list.indexOf(item)
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              const n = list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]
              choose(n)
              window.setTimeout(() => listRef.current?.querySelector<HTMLElement>(`[data-id="${n.id}"]`)?.focus(), 0)
            }
            if (e.key === 'ArrowRight') turn(1)
            if (e.key === 'ArrowLeft') turn(-1)
          }}
        >
          {list.map((g) => (
            <button
              key={g.id}
              data-id={g.id}
              role="option"
              aria-selected={g.id === item.id}
              tabIndex={g.id === item.id ? 0 : -1}
              className={`shop__row ${g.id === item.id ? 'is-on' : ''}`}
              onMouseEnter={() => sfx.blip()}
              onClick={() => choose(g)}
            >
              <span className="shop__thumb">
                <img src={gearUrl(shotsFor(g, tab, lead)[0].id, 640)} alt="" loading="lazy" />
              </span>
              <span className="shop__name">
                <b>{g.name}</b>
                <i>{g.sub}</i>
              </span>
              {g.id === item.id && <span className="shop__tick" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
        <p className="shop__note t-body">{item.note}</p>
        <p className="shop__pack t-label t-muted">
          {shot.label} · official {item.pack} screenshot · © Rockstar Games{paintable && lo.paint ? ' · respray is a fan-made preview' : ''}
        </p>
      </div>

      <div className="angles" role="group" aria-label="Angles">
        <button className="angles__arrow" onClick={() => turn(-1)} aria-label="Previous angle">
          ←
        </button>
        <div className="angles__dots">
          {shots.map((s, i) => (
            <button key={s.id} className={`angles__dot ${i === shotIx ? 'is-on' : ''} ${tab === 'garage' && s.paint ? 'is-paint' : ''}`} onClick={() => update({ [shotKey]: i } as Partial<LO>)} aria-label={s.label}>
              <i />
              <span className="t-label">{s.label}</span>
            </button>
          ))}
        </div>
        <button className="angles__arrow" onClick={() => turn(1)} aria-label="Next angle">
          →
        </button>
      </div>

      {tab === 'garage' && (
        <div className={`respray ${paintable ? '' : 'is-off'}`} role="group" aria-label="Respray">
          <span className="t-label">{paintable ? 'Respray' : 'Respray works on angles marked ●'}</span>
          <div className="respray__swatches">
            <button className={`swatch swatch--factory ${!lo.paint ? 'is-on' : ''}`} onClick={() => paint(null, null)} aria-label="Factory paint" title="Factory">
              <i />
            </button>
            {PAINTS.map((p) => (
              <button key={p.id} className={`swatch ${lo.paint === p.hex ? 'is-on' : ''}`} style={{ ['--sw' as string]: p.hex }} onClick={() => paint(p.hex, p.name)} aria-label={p.name} title={p.name} data-cursor={p.name.toUpperCase()}>
                <i />
              </button>
            ))}
            <label className="swatch swatch--custom" title="Custom colour" data-cursor="CUSTOM">
              <input type="color" value={custom ?? lo.paint ?? '#ff4fa3'} onChange={(e) => setCustom(e.target.value)} onClick={() => sfx.spray()} aria-label="Custom paint colour" />
              <i />
            </label>
          </div>
        </div>
      )}

      <aside className="kit" aria-label="Your loadout">
        <span className="t-label t-accent">Your loadout</span>
        <ul>
          <li>
            <span className="t-label t-muted">Lead</span>
            <b>{lead ? (lead === 'jason' ? 'Jason Duval' : 'Lucia Caminos') : 'Pick one above'}</b>
          </li>
          <li>
            <span className="t-label t-muted">Look</span>
            <b>{outfit?.name}</b>
          </li>
          <li>
            <span className="t-label t-muted">Piece</span>
            <b>{weapon?.name}</b>
          </li>
          <li>
            <span className="t-label t-muted">Ride</span>
            <b>
              {car?.name}
              {lo.paint && <i className="kit__paint" style={{ background: lo.paint }} title={lo.paintName ?? ''} />}
            </b>
          </li>
        </ul>
        <div className="kit__actions">
          <button className="pill pill--primary pill--sm" onClick={() => set({ share: 'card' })} data-cursor="MAKE">
            Put it on my card
          </button>
          <button className="pill pill--ghost pill--sm" onClick={randomise} data-cursor="ROLL">
            Surprise me
          </button>
        </div>
      </aside>
    </section>
  )
}
