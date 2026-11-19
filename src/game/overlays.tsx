import { useEffect, useMemo, useRef, useState } from 'react'
import { chapters, saga, SECRETS, OFFICIAL } from '../content/world'
import { shots, shotById, artUrl, shotUrl, art } from '../content/media'
import { castById, type CastId } from '../content/cast'
import { Art, Clip, ShotImg } from '../ui/media'
import { addSecret, closeOverlays, get, set, setLead, toast, useGame, type MenuTab } from './store'
import { fastTravel, satellite } from './switch'
import { tryCheat, wouldBeCheatPrefix } from './cheats'
import { drawCard, drawCover, exportCanvas, COVER_SLOTS, type CardFormat } from './share'
import { enableSound, sfx } from '../audio/engine'
import { lockScroll } from './scroll'
import { refreshPixelRatio } from '../gl/quality'

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'map', label: 'Map' },
  { id: 'brief', label: 'Brief' },
  { id: 'stats', label: 'Stats' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'settings', label: 'Settings' },
]

function useTrap(active: boolean, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return
    const prev = document.activeElement as HTMLElement | null
    lockScroll(true)
    const t = window.setTimeout(() => ref.current?.querySelector<HTMLElement>('button, [href], input')?.focus({ preventScroll: true }), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !ref.current) return
      const list = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null)
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      const cur = document.activeElement as HTMLElement
      if (!ref.current.contains(cur)) {
        e.preventDefault()
        first.focus({ preventScroll: true })
      } else if (e.shiftKey && cur === first) {
        e.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault()
        first.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      if (!get().menu && !get().lightbox && !get().share && !get().dossier) lockScroll(false)
      prev?.focus?.({ preventScroll: true })
    }
  }, [active, ref])
}

export function PauseMenu() {
  const tab = useGame((s) => s.menu)
  const ref = useRef<HTMLDivElement>(null)
  useTrap(!!tab, ref)
  if (!tab) return null
  return (
    <div className="menu" role="dialog" aria-modal="true" aria-label="Pause menu" ref={ref} data-lenis-prevent>
      <div className="menu__bg" />
      <div className="menu__head">
        <div className="menu__title">
          <span className="t-label t-muted">Paused · fan-made, not affiliated with Rockstar Games</span>
          <h2 className="d-sub">Leonida</h2>
        </div>
        <div className="menu__tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`t-label ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => {
                sfx.blip()
                set({ menu: t.id })
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button className="pill pill--ghost pill--sm" onClick={() => { sfx.back(); set({ menu: null }) }}>
          Resume <kbd>Esc</kbd>
        </button>
      </div>
      <div className="menu__body" key={tab} data-lenis-prevent>
        {tab === 'map' && <MapTab />}
        {tab === 'brief' && <BriefTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'gallery' && <GalleryGrid />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function MapTab() {
  const visited = useGame((s) => s.visited)
  const chapter = useGame((s) => s.chapter)
  return (
    <div className="map-grid">
      {chapters.map((c, i) => (
        <button
          key={c.id}
          className={`map-tile ${chapter === c.id ? 'is-here' : ''}`}
          style={{ ['--d' as string]: `${i * 0.03}s` }}
          onMouseEnter={() => sfx.blip()}
          onClick={() => {
            set({ menu: null })
            lockScroll(false)
            fastTravel(c.id, c.name)
          }}
        >
          <Art k={c.art} alt="" sizes="320px" className="map-tile__img" maxW={640} />
          <span className="map-tile__n d-sub">{c.n}</span>
          <span className="map-tile__name t-label">{c.name}</span>
          {visited.includes(c.id) && <span className="map-tile__seen t-label">Visited</span>}
          {chapter === c.id && <span className="map-tile__here t-label">You are here</span>}
        </button>
      ))}
    </div>
  )
}

function BriefTab() {
  return (
    <div className="brief">
      <div>
        <h3 className="d-sub">The brief</h3>
        <p className="t-body-l">
          A fan-made launch experience for Grand Theft Auto VI, built to play like the first ten minutes of a game: choose a lead, take a road trip across Leonida, find six secrets, leave with a card that is yours.
        </p>
        <p className="t-body t-muted">
          Fan-made. Not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. All Grand Theft Auto VI artwork, screenshots, clips and trailers are © Rockstar Games and come from Rockstar's official media kit and official YouTube channel. Nothing is sold here and nothing is collected.
        </p>
        <a className="pill pill--primary" href={OFFICIAL} target="_blank" rel="noreferrer">
          Official site ↗
        </a>
      </div>
      <div>
        <h3 className="t-label t-muted">Controls</h3>
        <ul className="controls">
          {[
            ['Scroll · W S', 'Move through Leonida'],
            ['Mouse · tilt phone', 'Look around'],
            ['Esc · Start', 'Pause menu'],
            ['◀ ▶ · D-pad', 'Browse covers and cast'],
            ['↑ ↓ · drag', 'Loadout: pick gear, turn the car'],
            ['Enter · A', 'Select'],
            ['E · Q', 'Next / previous road-trip stop'],
            ['M', 'Map'],
            ['Type', 'Cheat codes, anywhere'],
          ].map(([k, v]) => (
            <li key={k}>
              <span className="t-label">{k}</span>
              <span className="t-body t-muted">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatsTab() {
  const s = useGame()
  const first = saga.find((x) => x.id === s.firstGame)
  const mins = Math.floor(s.timeSpent / 60)
  const secs = s.timeSpent % 60
  return (
    <div className="stats">
      <ul className="stats__list">
        {[
          ['Time in Leonida', `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`],
          ['Chapters visited', `${s.visited.length} / ${chapters.length}`],
          ['Secrets found', `${s.secrets.length} / ${SECRETS.length}`],
          ['First GTA', first ? `${first.short} · ${first.year}` : 'Not picked yet'],
          ['Lead', s.lead ? s.lead[0].toUpperCase() + s.lead.slice(1) : 'Not chosen'],
          ['Cheats used', s.cheatsUsed.length ? s.cheatsUsed.join(', ') : 'None (yet)'],
        ].map(([k, v]) => (
          <li key={k}>
            <span className="t-label t-muted">{k}</span>
            <b>{v}</b>
          </li>
        ))}
      </ul>
      <div className="stats__secrets">
        <h3 className="t-label t-muted">Secrets</h3>
        {SECRETS.map((x) => {
          const found = s.secrets.includes(x.id)
          return (
            <div key={x.id} className={`secret ${found ? 'is-found' : ''}`}>
              <span className="secret__star">{found ? '★' : '☆'}</span>
              <div>
                <b>{found ? x.name : 'Unknown'}</b>
                <span className="t-body t-muted">{x.hint}</span>
              </div>
            </div>
          )
        })}
        <button className="pill pill--primary" onClick={() => set({ menu: null, share: 'card' })}>
          Make my card
        </button>
      </div>
    </div>
  )
}

const FILTERS = (() => {
  const tags = new Map<string, { label: string; group: string }>()
  shots.forEach((s) => tags.set(s.tag, { label: s.label.replace(' National Park', ''), group: s.group }))
  return [...tags.entries()].map(([tag, v]) => ({ tag, ...v }))
})()

export function GalleryGrid({ onPick }: { onPick?: (id: string) => void } = {}) {
  const [filter, setFilter] = useState<string>('all')
  const list = useMemo(() => (filter === 'all' ? shots : shots.filter((s) => s.tag === filter)), [filter])
  return (
    <div className="gallery">
      <div className="gallery__filters">
        <button className={`chip ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>
          All · {shots.length}
        </button>
        {['people', 'place'].map((g) => (
          <span key={g} className="gallery__group">
            <span className="t-label t-muted">{g === 'people' ? 'People' : 'Places'}</span>
            {FILTERS.filter((f) => f.group === g).map((f) => (
              <button key={f.tag} className={`chip ${filter === f.tag ? 'is-active' : ''}`} onClick={() => setFilter(f.tag)}>
                {f.label}
              </button>
            ))}
          </span>
        ))}
      </div>
      <div className="gallery__grid">
        {list.map((s, i) => (
          <button
            key={s.id}
            className="gallery__item"
            data-cursor={onPick ? 'PICK' : 'VIEW'}
            onClick={() => (onPick ? onPick(s.id) : set({ lightbox: { ids: list.map((x) => x.id), index: i } }))}
          >
            <ShotImg id={s.id} alt={`${s.label} screenshot ${s.n}`} sizes="(max-width: 760px) 50vw, 240px" maxW={640} />
            <span className="t-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      <span className="t-label t-muted">{label}</span>
      <div>
        {options.map(([v, l]) => (
          <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'is-active' : ''} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function SettingsTab() {
  const s = useGame()
  const [code, setCode] = useState('')
  return (
    <div className="settings">
      <Seg
        label="Sound"
        value={s.sound ? 'on' : 'off'}
        options={[['on', 'On'], ['off', 'Off']]}
        onChange={(v) => {
          enableSound(v === 'on')
          set({ sound: v === 'on', soundPref: v === 'on' })
        }}
      />
      <Seg
        label="Motion"
        value={s.motionPref}
        options={[['auto', 'Auto'], ['full', 'Full'], ['reduced', 'Reduced']]}
        onChange={(v) => {
          const reduced = v === 'reduced' || (v === 'auto' && matchMedia('(prefers-reduced-motion: reduce)').matches)
          set({ motionPref: v, reduced })
          document.documentElement.classList.toggle('reduced', reduced)
        }}
      />
      <Seg
        label="Graphics"
        value={s.qualityMode}
        options={[['auto', 'Auto'], ['high', 'High'], ['mid', 'Medium'], ['low', 'Low']]}
        onChange={(v) => {
          set({ qualityMode: v, quality: v === 'auto' ? s.autoQuality : v })
          refreshPixelRatio()
        }}
      />
      <Seg
        label="Lead"
        value={(s.lead ?? 'none') as 'jason' | 'lucia' | 'none'}
        options={[['jason', 'Jason'], ['lucia', 'Lucia'], ['none', 'None']]}
        onChange={(v) => {
          const next = v === 'none' ? null : v
          if (next) satellite({ title: `Switching to ${next === 'jason' ? 'Jason' : 'Lucia'}`, accent: next === 'jason' ? '#19d3c5' : '#ff4fa3', portrait: next, mid: () => setLead(next) })
          else setLead(null)
        }}
      />
      <Seg
        label="Launch"
        value={s.launchOverride ?? s.launchPref}
        options={[['auto', 'Auto'], ['pre', 'Countdown'], ['post', 'Out now']]}
        onChange={(v) => set({ launchPref: v, launchOverride: null })}
      />
      <form
        className="cheat-input"
        onSubmit={(e) => {
          e.preventDefault()
          if (!tryCheat(code)) {
            sfx.back()
            toast('Nothing happened', 'Try another code', 'plain')
          }
          setCode('')
        }}
      >
        <label className="t-label t-muted" htmlFor="cheat">
          Enter a cheat
        </label>
        <div>
          <input id="cheat" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Type a code" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          <button className="pill pill--primary pill--sm" type="submit">
            Enter
          </button>
        </div>
      </form>
      <button
        className="pill pill--dark pill--sm"
        onClick={() => {
          set({ secrets: [], visited: [], firstGame: null, gotLine: '', cheatsUsed: [], timeSpent: 0, complete: false, name: '' })
          setLead(null)
          toast('Progress reset', 'Fresh start in Leonida')
        }}
      >
        Reset progress
      </button>
    </div>
  )
}

export function Lightbox() {
  const lb = useGame((s) => s.lightbox)
  const ref = useRef<HTMLDivElement>(null)
  useTrap(!!lb, ref)
  const touch = useRef<number | null>(null)
  useEffect(() => {
    if (!lb) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lb])
  if (!lb) return null
  const id = lb.ids[lb.index]
  const isArt = id.startsWith('art:')
  const key = id.replace('art:', '')
  const s = shotById.get(id)
  function step(d: number) {
    const cur = get().lightbox
    if (!cur) return
    sfx.blip()
    set({ lightbox: { ...cur, index: (cur.index + d + cur.ids.length) % cur.ids.length } })
  }
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      ref={ref}
      data-lenis-prevent
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="lightbox__img" key={id}>
        {isArt ? <Art k={key} alt="" sizes="100vw" fit="contain" eager /> : <ShotImg id={id} alt={s ? `${s.label} ${s.n}` : ''} sizes="100vw" fit="contain" eager />}
      </div>
      <div className="lightbox__bar">
        <span className="t-label">{isArt ? key.replace('postcard-', 'Postcard · ').replace(/-/g, ' ') : `${s?.label} · ${s?.n}`}</span>
        <span className="t-label t-muted">
          {lb.index + 1} / {lb.ids.length} · © Rockstar Games
        </span>
        <div>
          {lb.ids.length > 1 && (
            <>
              <button className="pill pill--ghost pill--sm" onClick={() => step(-1)} aria-label="Previous">
                ←
              </button>
              <button className="pill pill--ghost pill--sm" onClick={() => step(1)} aria-label="Next">
                →
              </button>
            </>
          )}
          <button className="pill pill--primary pill--sm" onClick={() => set({ lightbox: null })}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShareModal() {
  const kind = useGame((s) => s.share)
  const ref = useRef<HTMLDivElement>(null)
  useTrap(!!kind, ref)
  if (!kind) return null
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={kind === 'card' ? 'Your card' : 'Make your cover'} ref={ref} data-lenis-prevent>
      <div className="modal__bg" onClick={() => set({ share: null })} />
      {kind === 'card' ? <CardMaker /> : <CoverMaker />}
    </div>
  )
}

function CardMaker() {
  const [fmt, setFmt] = useState<CardFormat>('4x5')
  const [url, setUrl] = useState<string | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const gotLine = useGame((s) => s.gotLine)
  const lead = useGame((s) => s.lead)
  const firstGame = useGame((s) => s.firstGame)
  const secrets = useGame((s) => s.secrets)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    const t = window.setTimeout(() => {
      drawCard(fmt)
        .then((c) => {
          if (!alive) return
          canvas.current = c
          setFailed(false)
          setUrl(c.toDataURL('image/jpeg', 0.86))
        })
        .catch(() => alive && setFailed(true))
    }, url ? 280 : 0)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [fmt, gotLine, lead, firstGame, secrets.length])
  return (
    <div className="maker">
      <div className={`maker__preview maker__preview--${fmt}`}>{failed ? <span className="t-label">Couldn’t print the card. Check your connection and try again.</span> : url ? <img src={url} alt="Preview of your card" /> : <span className="t-label">Printing…</span>}</div>
      <div className="maker__side">
        <span className="t-label t-accent">Your card</span>
        <h3 className="d-sub">Proof you were here</h3>
        <label className="t-label t-muted" htmlFor="got">
          I got ___ before GTA VI
        </label>
        <input id="got" className="field" maxLength={48} value={gotLine} onChange={(e) => set({ gotLine: e.target.value })} placeholder="a degree, a job and two kids" />
        <Seg label="Format" value={fmt} options={[['4x5', 'Post 4:5'], ['9x16', 'Story 9:16']]} onChange={setFmt} />
        <div className="maker__row">
          <button className="pill pill--primary" onClick={async () => { if (!canvas.current) return; if (await exportCanvas(canvas.current, `leonida-card-${fmt}.png`)) { sfx.star(); addSecret('card') } }}>
            Download card
          </button>
          <button className="pill pill--ghost" onClick={() => set({ share: null })}>
            Close
          </button>
        </div>
        <p className="t-body t-muted">Made on your device. Nothing is uploaded.</p>
      </div>
    </div>
  )
}

const DEFAULT_COVER = ['vice-city-03', 'jason-and-lucia-02', 'leonida-keys-02', 'lucia-caminos-03', 'jason-duval-04', 'grassrivers-02', 'vice-city-12', 'raul-bautista-01']

function CoverMaker() {
  const lead = useGame((s) => s.lead)
  const name = useGame((s) => s.name)
  const [ids, setIds] = useState<string[]>(() => DEFAULT_COVER.map((id, i) => (shotById.has(id) ? id : shots[(i * 13) % shots.length].id)))
  const [slot, setSlot] = useState<number | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    let alive = true
    const t = window.setTimeout(() => {
      drawCover(ids, name)
        .then((c) => {
          if (!alive) return
          canvas.current = c
          setUrl(c.toDataURL('image/jpeg', 0.86))
        })
        .catch(() => {})
    }, url ? 280 : 0)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [ids, name])
  return (
    <div className="maker maker--cover">
      <div className="maker__preview maker__preview--4x5 cover-preview">
        {url ? <img src={url} alt="Preview of your cover" /> : <span className="t-label">Printing…</span>}
        {COVER_SLOTS.map((r, i) => (
          <button
            key={i}
            className={`cover-slot ${slot === i ? 'is-active' : ''}`}
            style={{ left: `${(r.x / 1080) * 100}%`, top: `${(r.y / 1350) * 100}%`, width: `${(r.w / 1080) * 100}%`, height: `${(r.h / 1350) * 100}%` }}
            onClick={() => setSlot(i)}
            aria-label={`Change panel ${i + 1}`}
            data-cursor="SWAP"
          />
        ))}
      </div>
      <div className="maker__side">
        <span className="t-label t-accent">Make your cover</span>
        <h3 className="d-sub">{slot == null ? 'Pick a panel' : `Panel ${slot + 1}`}</h3>
        <label className="t-label t-muted" htmlFor="nm">
          Starring
        </label>
        <input id="nm" className="field" maxLength={22} value={name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name" />
        {slot != null ? (
          <div className="cover-picker">
            <GalleryGrid
              onPick={(id) => {
                const next = [...ids]
                next[slot] = id
                setIds(next)
                setSlot(slot < 7 ? slot + 1 : null)
                sfx.select()
              }}
            />
          </div>
        ) : (
          <p className="t-body t-muted">Click any panel on the cover to swap its screenshot. {lead ? `Team ${lead[0].toUpperCase() + lead.slice(1)} noted.` : ''}</p>
        )}
        <div className="maker__row">
          <button className="pill pill--primary" onClick={async () => { if (!canvas.current) return; if (await exportCanvas(canvas.current, 'leonida-cover.png')) { sfx.star(); addSecret('card') } }}>
            Download cover
          </button>
          <button className="pill pill--ghost" onClick={() => set({ share: null })}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function Dossier() {
  const id = useGame((s) => s.dossier) as CastId | null
  const ref = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  useTrap(!!id, ref)

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation()
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [id])

  if (!id) return null
  const c = castById[id]
  const ids = shots.filter((s) => s.tag === c.shots).map((s) => s.id)
  return (
    <div className="dossier" role="dialog" aria-modal="true" aria-label={`${c.first} ${c.last}`} ref={ref} data-lenis-prevent data-lenis-prevent-wheel data-lenis-prevent-touch>
      <div className="modal__bg" onClick={() => set({ dossier: null })} />
      <aside
        className="dossier__sheet"
        ref={sheetRef}
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        onWheel={(e) => {
          e.stopPropagation()
          e.nativeEvent?.stopImmediatePropagation?.()
        }}
        style={{ ['--c' as string]: c.color }}
      >
        <button className="dossier__close" onClick={() => set({ dossier: null })} aria-label="Close dossier" data-cursor="CLOSE">
          ✕
        </button>
        <div className="dossier__clip">
          <Clip k={c.clip} active always need={1080} />
        </div>
        <div className="dossier__body">
          <span className="t-label" style={{ color: c.color }}>
            Dossier
          </span>
          <h3 className="d-section">
            {c.first}
            <br />
            {c.last}
          </h3>
          <p className="t-body-l">{c.role}</p>
          <div className="chips">
            {c.traits.map((t) => (
              <span key={t} className="chip is-static">
                {t}
              </span>
            ))}
          </div>
          {c.bio.map((b) => (
            <p key={b} className="t-body t-muted">
              {b}
            </p>
          ))}
          <div className="dossier__shots">
            {ids.map((sid, i) => (
              <button key={sid} onClick={() => set({ lightbox: { ids, index: i } })} data-cursor="VIEW">
                <ShotImg id={sid} alt="" sizes="160px" maxW={640} />
              </button>
            ))}
          </div>
          <div className="maker__row">
            {c.lead && (
              <button
                className="pill pill--accent"
                onClick={() => {
                  set({ dossier: null })
                  satellite({ title: `Switching to ${c.first}`, accent: c.color, portrait: c.lead, mid: () => setLead(c.lead!) })
                }}
              >
                Play as {c.first}
              </button>
            )}
            <button className="pill pill--ghost" onClick={() => set({ dossier: null })}>
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
      if (e.key === 'Escape') {
        const s = get()
        if (!s.entered) return
        if (s.menu || s.lightbox || s.share || s.dossier) {
          sfx.back()
          closeOverlays()
        } else {
          sfx.select()
          set({ menu: 'map' })
        }
        return
      }
      if (typing) return
      if ((e.key === 'm' || e.key === 'M') && get().entered && !get().menu && !e.metaKey && !e.ctrlKey && !wouldBeCheatPrefix(e.key)) {
        set({ menu: 'map' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export { artUrl, shotUrl, art }
