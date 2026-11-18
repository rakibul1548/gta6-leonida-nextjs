import { useEffect, useRef, useState } from 'react'
import { Boot } from './chapters/Boot'
import { Hero } from './chapters/Hero'
import { Wait } from './chapters/Wait'
import { Saga } from './chapters/Saga'
import { Story } from './chapters/Story'
import { Lead } from './chapters/Lead'
import { Loadout } from './chapters/Loadout'
import { Leonida } from './chapters/Leonida'
import { Gameplay } from './chapters/Gameplay'
import { DriveIn } from './chapters/DriveIn'
import { Cover } from './chapters/Cover'
import { Launch, Passed } from './chapters/Finale'
import { HUD, Reticle, Toasts, useChapterTracking } from './game/hud'
import { Dossier, Lightbox, PauseMenu, ShareModal, useGlobalKeys } from './game/overlays'
import { SatelliteSwitch } from './game/switch'
import { get, onSecret, set, setLead, toast, useGame } from './game/store'
import { initScroll, lockScroll, scrollTo, startTicker } from './game/scroll'
import { startReveals } from './ui/fx'
import { startCheatListener, wanted } from './game/cheats'
import { startGamepad } from './game/gamepad'
import { detectQuality, refreshPixelRatio } from './gl/quality'
import { sfx } from './audio/engine'
import { SECRETS } from './content/world'

const params = new URLSearchParams(location.search)
const skipBoot = params.get('boot') === '0'

export function App() {
  const [booted, setBooted] = useState(skipBoot)
  const reduced = useGame((s) => s.reduced)
  useGlobalKeys()
  useChapterTracking()

  useEffect(() => {
    const auto = detectQuality()
    const mode = get().qualityMode
    set({ autoQuality: auto, quality: mode === 'auto' ? auto : mode })
    refreshPixelRatio()
    setLead(get().lead)
    document.documentElement.classList.toggle('reduced', get().reduced)
    initScroll(!get().reduced)
    startTicker()
    const offs = [startReveals(), startCheatListener(), startGamepad()]
    const offSecret = onSecret((_, total) => {
      sfx.star()
      if (total >= SECRETS.length) {
        window.setTimeout(() => {
          wanted(4200)
          toast('100% · Leonida complete', 'Gold card unlocked in Mission Passed', 'gold', 6000)
        }, 900)
      }
    })
    const tick = window.setInterval(() => {
      const s = get()
      if (s.entered && document.visibilityState === 'visible') set({ timeSpent: s.timeSpent + 1 })
    }, 1000)
    if (skipBoot) enter(false)
    else {
      document.documentElement.classList.add('is-booting')
      lockScroll(true)
    }
    return () => {
      offs.forEach((f) => f())
      offSecret()
      window.clearInterval(tick)
    }
  }, [])

  const firstReduced = useRef(true)
  useEffect(() => {
    document.documentElement.classList.toggle('reduced', reduced)
    if (firstReduced.current) {
      firstReduced.current = false
      return
    }
    initScroll(!reduced)
  }, [reduced])

  function enter(sound: boolean) {
    document.documentElement.classList.remove('is-booting')
    lockScroll(false)
    set({ entered: true, sound })
    setBooted(true)
    const at = params.get('at')
    if (at) window.setTimeout(() => scrollTo(`#${at}`, { immediate: true }), 120)
    else window.scrollTo(0, 0)
  }

  return (
    <>
      <div id="page">
        <main>
          <Hero />
          <Wait />
          <Saga />
          <Story />
          <Lead />
          <Loadout />
          <Leonida />
          <Gameplay />
          <DriveIn />
          <Cover />
          <Launch />
          <Passed />
        </main>
      </div>
      <HUD />
      <Toasts />
      <SatelliteSwitch />
      <PauseMenu />
      <Dossier />
      <ShareModal />
      <Lightbox />
      <div className="grade-layer" aria-hidden="true" />
      <div className="wanted-layer" aria-hidden="true" />
      {!booted && <Boot onEnter={enter} />}
      <Reticle />
    </>
  )
}
