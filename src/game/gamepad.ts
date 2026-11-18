import { onTick, scrollTo, scrollY } from './scroll'
import { closeOverlays, get, set, toast } from './store'
import { sfx } from '../audio/engine'

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

function moveFocus(dir: 1 | -1) {
  const root = document.querySelector('.menu, .lightbox, .modal, .dossier') ?? document
  const list = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  })
  if (!list.length) return
  const i = list.indexOf(document.activeElement as HTMLElement)
  const next = list[(i + dir + list.length) % list.length]
  next.focus()
  next.scrollIntoView?.({ block: 'nearest' })
  sfx.blip()
}

export function startGamepad() {
  let prev: boolean[] = []
  let connected = false
  const onConnect = () => {
    if (!connected) toast('Controller connected', 'Left stick scrolls · D-pad moves · A selects · Start pauses')
    connected = true
  }
  window.addEventListener('gamepadconnected', onConnect)
  const off = onTick(() => {
    if (!connected) return
    const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean)
    if (!pad) return
    const b = pad.buttons.map((x) => x.pressed)
    const down = (i: number) => b[i] && !prev[i]
    const y = pad.axes[1] ?? 0
    if (Math.abs(y) > 0.18 && !get().menu) scrollTo(scrollY() + y * 38, { immediate: true })
    if (down(12) || down(14)) moveFocus(-1)
    if (down(13) || down(15)) moveFocus(1)
    if (down(0)) (document.activeElement as HTMLElement | null)?.click?.()
    if (down(1)) {
      sfx.back()
      closeOverlays()
    }
    if (down(9)) {
      if (get().menu) set({ menu: null })
      else set({ menu: 'map' })
    }
    prev = b
  })
  return () => {
    off()
    window.removeEventListener('gamepadconnected', onConnect)
  }
}
