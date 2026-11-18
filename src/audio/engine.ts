type Bed = { gain: GainNode; stop: () => void }

let ctx: AudioContext | null = null
let master: GainNode
let sfxBus: GainNode
let bedBus: GainNode
let noise: AudioBuffer
let beds: Record<'surf' | 'city' | 'night', Bed> | null = null
let enabled = false
let duckLevel = 1
let lastBlip = 0

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 3
  master.connect(comp).connect(ctx.destination)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.55
  sfxBus.connect(master)
  bedBus = ctx.createGain()
  bedBus.gain.value = 0.32
  bedBus.connect(master)
  noise = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
  const d = noise.getChannelData(0)
  let b = 0
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1
    b = (b + 0.02 * w) / 1.02
    d[i] = w * 0.6 + b * 3
  }
  return ctx
}

function noiseSrc() {
  const s = ctx!.createBufferSource()
  s.buffer = noise
  s.loop = true
  s.loopStart = Math.random()
  return s
}

function makeBeds() {
  const c = ctx!
  const out = {} as Record<'surf' | 'city' | 'night', Bed>

  {
    const g = c.createGain()
    g.gain.value = 0
    const src = noiseSrc()
    const bp = c.createBiquadFilter()
    bp.type = 'lowpass'
    bp.frequency.value = 700
    const swell = c.createGain()
    swell.gain.value = 0.35
    const lfo = c.createOscillator()
    lfo.frequency.value = 0.09
    const lfoG = c.createGain()
    lfoG.gain.value = 0.3
    lfo.connect(lfoG).connect(swell.gain)
    src.connect(bp).connect(swell).connect(g).connect(bedBus)
    src.start()
    lfo.start()
    out.surf = { gain: g, stop: () => { src.stop(); lfo.stop() } }
  }

  {
    const g = c.createGain()
    g.gain.value = 0
    const src = noiseSrc()
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 260
    const hum = c.createGain()
    hum.gain.value = 0.5
    src.connect(lp).connect(hum).connect(g)
    const pad = c.createGain()
    pad.gain.value = 0.045
    const padF = c.createBiquadFilter()
    padF.type = 'lowpass'
    padF.frequency.value = 900
    const notes = [110, 138.59, 164.81, 207.65]
    const oscs = notes.flatMap((f) =>
      [-6, 6].map((det) => {
        const o = c.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        o.detune.value = det
        o.connect(padF)
        o.start()
        return o
      }),
    )
    padF.connect(pad).connect(g)
    g.connect(bedBus)
    src.start()
    out.city = { gain: g, stop: () => { src.stop(); oscs.forEach((o) => o.stop()) } }
  }

  {
    const g = c.createGain()
    g.gain.value = 0
    const carrier = c.createOscillator()
    carrier.frequency.value = 4300
    const am = c.createGain()
    am.gain.value = 0
    const trem = c.createOscillator()
    trem.type = 'square'
    trem.frequency.value = 23
    const tremG = c.createGain()
    tremG.gain.value = 0.02
    trem.connect(tremG).connect(am.gain)
    const gate = c.createOscillator()
    gate.frequency.value = 0.6
    const gateG = c.createGain()
    gateG.gain.value = 0.015
    gate.connect(gateG).connect(am.gain)
    carrier.connect(am).connect(g)
    const pad = c.createGain()
    pad.gain.value = 0.04
    const padF = c.createBiquadFilter()
    padF.type = 'lowpass'
    padF.frequency.value = 600
    const oscs = [98, 123.47, 146.83, 185].map((f) => {
      const o = c.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.connect(padF)
      o.start()
      return o
    })
    padF.connect(pad).connect(g)
    g.connect(bedBus)
    carrier.start()
    trem.start()
    gate.start()
    out.night = { gain: g, stop: () => { carrier.stop(); trem.stop(); gate.stop(); oscs.forEach((o) => o.stop()) } }
  }
  return out
}

export function enableSound(on: boolean) {
  const c = ensure()
  if (!c) return
  enabled = on
  if (on) {
    c.resume()
    if (!beds) beds = makeBeds()
  }
  const now = c.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setTargetAtTime(on ? 0.9 * duckLevel : 0, now, 0.25)
}

export const soundOn = () => enabled

export function duck(on: boolean) {
  duckLevel = on ? 0.08 : 1
  if (!ctx || !enabled) return
  master.gain.setTargetAtTime(0.9 * duckLevel, ctx.currentTime, 0.4)
}

export function setClock(c01: number) {
  if (!ctx || !beds) return
  const t = ctx.currentTime
  const surf = Math.max(0, 1 - Math.abs(c01 - 0.08) * 3.2) + Math.max(0, 1 - Math.abs(c01 - 0.97) * 6)
  const city = Math.max(0, 1 - Math.abs(c01 - 0.42) * 3)
  const night = Math.max(0, 1 - Math.abs(c01 - 0.72) * 3.2)
  beds.surf.gain.gain.setTargetAtTime(Math.min(1, surf), t, 1.2)
  beds.city.gain.gain.setTargetAtTime(Math.min(1, city), t, 1.2)
  beds.night.gain.gain.setTargetAtTime(Math.min(1, night), t, 1.2)
}

function env(g: GainNode, t: number, a: number, peak: number, r: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + r)
}

function tone(freq: number, type: OscillatorType, t: number, a: number, peak: number, r: number, dest: AudioNode = sfxBus, glide?: number) {
  const o = ctx!.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + a + r)
  const g = ctx!.createGain()
  env(g, t, a, peak, r)
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + a + r + 0.05)
}

export const sfx = {
  blip() {
    if (!ctx || !enabled) return
    const now = performance.now()
    if (now - lastBlip < 70) return
    lastBlip = now
    tone(1760, 'sine', ctx.currentTime, 0.004, 0.05, 0.06)
  },
  select() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    tone(660, 'triangle', t, 0.005, 0.18, 0.12)
    tone(990, 'triangle', t + 0.05, 0.005, 0.14, 0.16)
  },
  back() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    tone(740, 'triangle', t, 0.005, 0.14, 0.1)
    tone(494, 'triangle', t + 0.05, 0.005, 0.12, 0.14)
  },
  whoosh(len = 1.2) {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    const s = noiseSrc()
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 1.4
    f.frequency.setValueAtTime(300, t)
    f.frequency.exponentialRampToValueAtTime(3200, t + len * 0.5)
    f.frequency.exponentialRampToValueAtTime(240, t + len)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.6, t + len * 0.45)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    s.connect(f).connect(g).connect(sfxBus)
    s.start(t)
    s.stop(t + len + 0.1)
    tone(80, 'sine', t + len * 0.42, 0.02, 0.5, 0.5, sfxBus, 40)
  },
  star() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    ;[1318.5, 1760, 2637].forEach((f, i) => tone(f, 'sine', t + i * 0.07, 0.004, 0.16, 0.5))
  },
  sting() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    const seq = [261.63, 329.63, 392, 493.88, 587.33, 783.99]
    seq.forEach((f, i) => {
      tone(f, 'sawtooth', t + i * 0.09, 0.01, 0.07, 0.9)
      tone(f * 2, 'sine', t + i * 0.09, 0.005, 0.06, 0.6)
    })
    tone(130.81, 'triangle', t, 0.02, 0.35, 2.2)
    tone(1567.98, 'sine', t + 0.62, 0.004, 0.12, 1.6)
  },
  boot() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    tone(55, 'sawtooth', t, 0.3, 0.12, 1.6, sfxBus, 110)
    tone(220, 'sine', t + 0.2, 0.2, 0.1, 1.4, sfxBus, 440)
  },
  siren() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    for (let i = 0; i < 4; i++) {
      tone(880, 'square', t + i * 0.5, 0.01, 0.04, 0.22, sfxBus)
      tone(660, 'square', t + i * 0.5 + 0.25, 0.01, 0.04, 0.22, sfxBus)
    }
  },
  rev() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(42, t)
    o.frequency.exponentialRampToValueAtTime(130, t + 0.45)
    o.frequency.exponentialRampToValueAtTime(70, t + 1.2)
    const o2 = ctx.createOscillator()
    o2.type = 'square'
    o2.frequency.setValueAtTime(21, t)
    o2.frequency.exponentialRampToValueAtTime(65, t + 0.45)
    o2.frequency.exponentialRampToValueAtTime(35, t + 1.2)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(300, t)
    f.frequency.exponentialRampToValueAtTime(1400, t + 0.45)
    f.frequency.exponentialRampToValueAtTime(400, t + 1.2)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.08)
    g.gain.setValueAtTime(0.32, t + 0.5)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35)
    o.connect(f)
    o2.connect(f)
    f.connect(g).connect(sfxBus)
    o.start(t)
    o2.start(t)
    o.stop(t + 1.4)
    o2.stop(t + 1.4)
  },
  cock() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    ;[0, 0.11].forEach((d, i) => {
      const s = noiseSrc()
      const f = ctx!.createBiquadFilter()
      f.type = 'highpass'
      f.frequency.value = i ? 2400 : 1500
      const g = ctx!.createGain()
      g.gain.setValueAtTime(0.0001, t + d)
      g.gain.exponentialRampToValueAtTime(0.5, t + d + 0.004)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06)
      s.connect(f).connect(g).connect(sfxBus)
      s.start(t + d)
      s.stop(t + d + 0.08)
    })
    tone(180, 'square', t + 0.02, 0.002, 0.08, 0.05)
  },
  swish() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    const s = noiseSrc()
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 0.8
    f.frequency.setValueAtTime(900, t)
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.25)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
    s.connect(f).connect(g).connect(sfxBus)
    s.start(t)
    s.stop(t + 0.35)
  },
  spray() {
    if (!ctx || !enabled) return
    const t = ctx.currentTime
    const s = noiseSrc()
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 3500
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.03)
    g.gain.setValueAtTime(0.2, t + 0.35)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    s.connect(f).connect(g).connect(sfxBus)
    s.start(t)
    s.stop(t + 0.55)
  },
  key() {
    if (!ctx || !enabled) return
    tone(2400 + Math.random() * 400, 'square', ctx.currentTime, 0.001, 0.02, 0.025)
  },
}
