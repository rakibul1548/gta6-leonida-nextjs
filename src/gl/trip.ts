import * as THREE from 'three'
import { addView, loadTex } from './stage'
import { artUrl, shotUrl, shotsByTag } from '../content/media'
import type { Region } from '../content/world'
import { get } from '../game/store'

export const GAP = 70
const START = 16
const PTYPES: Record<Region['particle'], number> = { bokeh: 0, spray: 1, fireflies: 2, fog: 3, embers: 4, dust: 5 }

const skyVert = `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const skyFrag = `
uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cHor; uniform vec3 sunDir; uniform float uTime;
varying vec3 vP;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  float h = vP.y;
  vec3 c = mix(cHor, cMid, smoothstep(-0.02, 0.18, h));
  c = mix(c, cTop, smoothstep(0.16, 0.65, h));
  float s = max(0.0, dot(vP, normalize(sunDir)));
  c += cHor * pow(s, 18.0) * 0.9 + vec3(1.0,0.85,0.7) * pow(s, 420.0) * 1.6;
  vec2 g = vP.xz / max(0.08, vP.y) * 6.0;
  float star = step(0.9975, hash(floor(g * 9.0))) * smoothstep(0.25, 0.6, h);
  c += vec3(star) * (0.5 + 0.5 * sin(uTime * 2.0 + g.x * 3.0)) * 0.6 * (1.0 - smoothstep(0.0, 0.6, length(cTop)));
  gl_FragColor = vec4(c, 1.0);
}`

const groundVert = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`
const groundFrag = `
uniform vec3 cGround; uniform vec3 cLine; uniform vec3 cFog; uniform vec3 camPos; uniform float density; uniform float uTime; uniform float uWater;
varying vec3 vW;
void main(){
  vec2 g = abs(fract(vW.xz / 6.0 - 0.5) - 0.5) / fwidth(vW.xz / 6.0);
  float line = 1.0 - min(min(g.x, g.y), 1.0);
  float roadMask = smoothstep(4.0, 9.0, abs(vW.x));
  vec3 c = cGround + cLine * line * 0.55 * roadMask * (1.0 - uWater * 0.85);
  float wv = sin(vW.x * 0.33 + uTime * 1.1 + sin(vW.z * 0.07) * 3.0) * sin(vW.z * 0.21 - uTime * 0.8);
  float glint = smoothstep(0.86, 1.0, wv) * smoothstep(0.0, 1.0, uWater);
  vec3 water = mix(vec3(0.03, 0.2, 0.3), vec3(0.06, 0.42, 0.52), 0.5 + 0.5 * sin(vW.z * 0.05 + uTime * 0.3));
  c = mix(c, water + vec3(0.7, 0.9, 1.0) * glint * 0.55, uWater * roadMask);
  float d = distance(camPos, vW);
  float f = 1.0 - exp(-density * density * d * d);
  gl_FragColor = vec4(mix(c, cFog, f), 1.0);
}`

const ptVert = `
uniform float uTime; uniform float uType; uniform float uSize; uniform float uPx;
attribute float seed;
varying float vA; varying float vSeed;
void main(){
  vec3 p = position;
  float t = uTime;
  if (uType < 0.5) { p.x += sin(t * 0.2 + seed * 6.0) * 1.5; p.y += cos(t * 0.15 + seed * 4.0) * 0.8; vA = 0.22 + 0.18 * sin(t + seed * 9.0); }
  else if (uType < 1.5) { p.x += mod(t * 3.0 + seed * 40.0, 40.0) - 20.0; p.y = mod(position.y + t * 1.2 + seed * 5.0, 6.0); vA = 0.5; }
  else if (uType < 2.5) { p += vec3(sin(t * 0.7 + seed * 11.0), sin(t * 0.9 + seed * 7.0) * 0.6, cos(t * 0.6 + seed * 5.0)) * 1.4; vA = pow(0.5 + 0.5 * sin(t * 2.4 + seed * 30.0), 3.0); }
  else if (uType < 3.5) { p.x += sin(t * 0.05 + seed * 3.0) * 6.0; p.y = 0.6 + mod(position.y, 3.0); vA = 0.07; }
  else if (uType < 4.5) { p.y = mod(position.y + t * (1.0 + seed * 1.5), 18.0); p.x += sin(t + seed * 20.0) * 0.6; vA = (1.0 - p.y / 18.0) * (0.6 + 0.4 * sin(t * 9.0 + seed * 50.0)); }
  else { p.y = mod(position.y - t * 0.3 * (0.5 + seed), 14.0); p.x += sin(t * 0.3 + seed * 8.0) * 0.8; vA = 0.35 + 0.35 * sin(t * 3.0 + seed * 40.0); }
  vSeed = seed;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float size = uSize * (0.6 + seed * 0.8);
  gl_PointSize = size * uPx / max(0.5, -mv.z);
  gl_Position = projectionMatrix * mv;
}`
const ptFrag = `
uniform vec3 cA; uniform vec3 cB; uniform float uType; uniform float uFade;
varying float vA; varying float vSeed;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = uType < 0.5 || uType > 2.5 && uType < 3.5 ? smoothstep(0.5, 0.15, d) : smoothstep(0.5, 0.0, d);
  if (uType < 0.5) a *= 0.6 + 0.4 * smoothstep(0.32, 0.45, d) * (1.0 - smoothstep(0.45, 0.5, d)) + 0.4;
  vec3 col = mix(cA, cB, step(0.5, vSeed));
  gl_FragColor = vec4(col, a * vA * uFade);
}`

function roadTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#16131c'
  g.fillRect(0, 0, 256, 512)
  for (let i = 0; i < 2600; i++) {
    const v = 20 + Math.random() * 26
    g.fillStyle = `rgba(${v},${v - 2},${v + 6},0.55)`
    g.fillRect(Math.random() * 256, Math.random() * 512, 1.5, 1.5)
  }
  g.fillStyle = '#e8e2d6'
  g.fillRect(10, 0, 5, 512)
  g.fillRect(241, 0, 5, 512)
  g.fillStyle = '#ffc857'
  g.fillRect(120, 0, 6, 200)
  g.fillRect(130, 0, 6, 200)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function treeTexture(kind: 'palm' | 'pine' | 'cypress' | 'pole') {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.strokeStyle = '#fff'
  if (kind === 'palm') {
    g.lineWidth = 10
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(128, 512)
    g.bezierCurveTo(120, 380, 150, 260, 136, 150)
    g.stroke()
    const fronds = 9
    for (let i = 0; i < fronds; i++) {
      const a = -Math.PI * 0.95 + (i / (fronds - 1)) * Math.PI * 0.9 + (i % 2 ? 0.08 : -0.05)
      const len = 95 + (i % 3) * 18
      const ex = 136 + Math.cos(a) * len
      const ey = 150 + Math.sin(a) * len * 0.55 + len * 0.42
      g.beginPath()
      g.moveTo(136, 150)
      const cx = 136 + Math.cos(a) * len * 0.5
      const cy = 150 + Math.sin(a) * len * 0.6 - 20
      g.quadraticCurveTo(cx, cy, ex, ey)
      g.lineWidth = 7
      g.stroke()
      for (let k = 1; k < 9; k++) {
        const t = k / 9
        const px = (1 - t) * (1 - t) * 136 + 2 * (1 - t) * t * cx + t * t * ex
        const py = (1 - t) * (1 - t) * 150 + 2 * (1 - t) * t * cy + t * t * ey
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(px, py)
        g.lineTo(px + Math.cos(a + 1.2) * 20 * (1 - t * 0.6), py + 22 * (1 - t * 0.5))
        g.moveTo(px, py)
        g.lineTo(px + Math.cos(a - 1.2) * 20 * (1 - t * 0.6), py + 22 * (1 - t * 0.5))
        g.stroke()
      }
    }
  } else if (kind === 'cypress') {
    g.fillRect(122, 260, 12, 252)
    for (let i = 0; i < 26; i++) {
      const y = 40 + i * 9
      const w = 18 + Math.sin(i * 0.9) * 10 + i * 1.6
      g.beginPath()
      g.ellipse(128 + Math.sin(i * 1.7) * 8, y, w, 12, 0, 0, Math.PI * 2)
      g.fill()
    }
    for (let i = 0; i < 9; i++) {
      g.fillRect(128 + (i % 2 ? 6 : -10) + Math.sin(i) * 20, 70 + i * 22, 2, 30 + (i % 3) * 14)
    }
  } else if (kind === 'pole') {
    g.fillRect(124, 40, 8, 472)
    g.fillRect(64, 70, 128, 7)
    g.fillRect(84, 110, 88, 6)
    ;[70, 120, 182].forEach((x) => g.fillRect(x - 3, 58, 6, 14))
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(0, 90)
    g.quadraticCurveTo(64, 120, 70, 72)
    g.moveTo(186, 72)
    g.quadraticCurveTo(200, 120, 256, 92)
    g.stroke()
  } else {
    g.fillRect(122, 380, 12, 132)
    for (let i = 0; i < 7; i++) {
      const y = 60 + i * 48
      const w = 40 + i * 16
      g.beginPath()
      g.moveTo(128, y - 40)
      g.lineTo(128 - w, y + 50)
      g.lineTo(128 + w, y + 50)
      g.closePath()
      g.fill()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

type Skyline = 'city' | 'keys' | 'marsh' | 'harbor' | 'refinery' | 'mountains'
const SKYLINE: Record<string, Skyline> = { 'vice-city': 'city', 'leonida-keys': 'keys', grassrivers: 'marsh', 'port-gellhorn': 'harbor', ambrosia: 'refinery', 'mount-kalaga-national-park': 'mountains' }
const TREES: Record<string, ('palm' | 'pine' | 'cypress' | 'pole')[]> = { 'vice-city': ['palm'], 'leonida-keys': ['palm'], grassrivers: ['cypress', 'cypress', 'palm'], 'port-gellhorn': ['palm', 'pole'], ambrosia: ['pole', 'pole', 'pine'], 'mount-kalaga-national-park': ['pine'] }

function rng(seed: number) {
  let x = seed
  return () => {
    x = (x * 16807) % 2147483647
    return (x - 1) / 2147483646
  }
}

function skylineTexture(kind: Skyline, accent: string) {
  const W = 2048
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const r = rng(kind.length * 977 + 13)
  const base = H - 40
  const sil = '#100a1c'
  const lights = (x: number, y: number, w: number, h: number, colors: string[], density: number) => {
    for (let yy = y + 8; yy < base - 6; yy += 10) {
      for (let xx = x + 5; xx < x + w - 5; xx += 9) {
        if (r() < density) {
          g.fillStyle = colors[Math.floor(r() * colors.length)]
          g.globalAlpha = 0.55 + r() * 0.45
          g.fillRect(xx, yy, 4, 5)
        }
      }
    }
    g.globalAlpha = 1
  }
  g.fillStyle = sil
  if (kind === 'city') {
    let x = 0
    while (x < W) {
      const w = 40 + r() * 90
      const h = 60 + Math.pow(r(), 1.6) * 330
      g.fillStyle = sil
      g.fillRect(x, base - h, w, h + 40)
      if (r() < 0.25) g.fillRect(x + w / 2 - 2, base - h - 40, 4, 40)
      lights(x, base - h, w, h, ['#ffd38a', '#ff9bd2', '#9fe3ff', accent], 0.32)
      if (r() < 0.3) {
        g.fillStyle = accent
        g.globalAlpha = 0.85
        g.fillRect(x + 4, base - h + 6, w - 8, 3)
        g.globalAlpha = 1
      }
      x += w + r() * 10
    }
  } else if (kind === 'keys') {
    for (let i = 0; i < 7; i++) {
      const cx = r() * W
      const rw = 90 + r() * 200
      const rh = 14 + r() * 26
      g.beginPath()
      g.ellipse(cx, base, rw, rh, 0, Math.PI, 0)
      g.fill()
      for (let k = 0; k < 4; k++) {
        const px = cx - rw * 0.6 + r() * rw * 1.2
        g.fillRect(px, base - rh - 30, 3, 34)
        g.beginPath()
        g.ellipse(px + 1, base - rh - 30, 14, 6, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
    g.fillRect(0, base - 22, W, 5)
    for (let x = 30; x < W; x += 120) g.fillRect(x, base - 22, 6, 22)
    lights(0, base - 30, W, 10, ['#ffd38a'], 0.08)
  } else if (kind === 'marsh') {
    let x = 0
    while (x < W) {
      const h = 30 + r() * 70
      const w = 20 + r() * 50
      g.beginPath()
      g.moveTo(x, base)
      g.quadraticCurveTo(x + w / 2, base - h * 2, x + w, base)
      g.fill()
      if (r() < 0.2) {
        g.fillRect(x + w / 2, base - h - 80, 4, 80)
        g.beginPath()
        g.ellipse(x + w / 2, base - h - 80, 22, 12, 0, 0, Math.PI * 2)
        g.fill()
      }
      x += w * 0.6
    }
  } else if (kind === 'harbor') {
    g.fillRect(0, base - 18, W, 18)
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 330 + r() * 80
      const h = 160 + r() * 90
      g.fillRect(x, base - h, 10, h)
      g.fillRect(x - 80, base - h, 170, 9)
      g.fillRect(x + 70, base - h, 4, 70)
      g.fillStyle = '#ff5a5a'
      g.fillRect(x + 2, base - h - 8, 6, 6)
      g.fillStyle = sil
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * W
      const w = 50 + r() * 120
      const h = 20 + r() * 60
      g.fillRect(x, base - h, w, h)
      lights(x, base - h, w, h, ['#ffd38a', '#9fb4e8'], 0.18)
    }
  } else if (kind === 'refinery') {
    for (let i = 0; i < 9; i++) {
      const x = r() * W
      const h = 90 + r() * 220
      const w = 14 + r() * 18
      g.fillRect(x, base - h, w, h)
      g.fillRect(x - 4, base - h, w + 8, 6)
      if (r() < 0.4) {
        const fg = g.createRadialGradient(x + w / 2, base - h - 14, 1, x + w / 2, base - h - 14, 26)
        fg.addColorStop(0, 'rgba(255,220,140,1)')
        fg.addColorStop(1, 'rgba(255,120,40,0)')
        g.fillStyle = fg
        g.fillRect(x + w / 2 - 26, base - h - 40, 52, 52)
        g.fillStyle = sil
      }
    }
    for (let i = 0; i < 8; i++) {
      const x = r() * W
      const rw = 40 + r() * 50
      g.fillRect(x, base - rw * 0.9, rw * 1.6, rw * 0.9)
      g.beginPath()
      g.ellipse(x + rw * 0.8, base - rw * 0.9, rw * 0.8, 10, 0, Math.PI, 0)
      g.fill()
    }
    for (let x = 0; x < W; x += 60) g.fillRect(x, base - 50, 60, 3)
    lights(0, base - 120, W, 120, ['#ffb35a'], 0.04)
  } else {
    ;[
      [0.55, '#2a2f3a', 0.012, 230],
      [0.75, '#1a1d26', 0.02, 170],
      [1, sil, 0.03, 110],
    ].forEach(([a, colr, f, amp]) => {
      g.globalAlpha = a as number
      g.fillStyle = colr as string
      g.beginPath()
      g.moveTo(0, base)
      for (let x = 0; x <= W; x += 16) {
        const y = base - (amp as number) * (0.55 + 0.45 * Math.sin(x * (f as number) + r() * 0.4) * Math.cos(x * (f as number) * 0.37))
        g.lineTo(x, y)
      }
      g.lineTo(W, H)
      g.lineTo(0, H)
      g.fill()
    })
    g.globalAlpha = 1
  }
  g.fillStyle = sil
  g.fillRect(0, base, W, H - base)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function skyText() {
  const c = document.createElement('canvas')
  c.width = 2048
  c.height = 512
  const g = c.getContext('2d')!
  g.textAlign = 'center'
  g.fillStyle = '#fff'
  g.shadowColor = '#ff9bd2'
  g.shadowBlur = 40
  g.font = '400 210px Anton, Impact, sans-serif'
  g.fillText('SEE YOU IN LEONIDA', 1024, 260)
  g.shadowBlur = 20
  g.font = '600 64px "Inter Tight", Arial, sans-serif'
  g.fillText('11 · 19 · 2026', 1024, 400)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export type TripOpts = {
  route: Region[]
  onStop: (i: number) => void
  onPick: (kind: 'shot' | 'postcard', id: string) => void
  onLookUp: () => void
}

export type Trip = {
  setProgress: (p: number) => void
  setMode: (m: 'walk' | 'cruise') => void
  setRoute: (r: Region[]) => void
  getStop: () => number
  dispose: () => void
}

const col = (h: string) => new THREE.Color(h)

export function createTrip(el: HTMLElement, opts: TripOpts): Trip {
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(62, 1, 0.1, 1200)
  const fog = new THREE.FogExp2(0x000000, 0.011)
  scene.fog = fog
  const q = get().quality
  const shotW = q === 'high' ? 1280 : 640

  const skyU = { cTop: { value: col('#000') }, cMid: { value: col('#000') }, cHor: { value: col('#000') }, sunDir: { value: new THREE.Vector3(0, 0.12, -1) }, uTime: { value: 0 } }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false }))
  scene.add(sky)

  const gU = { cGround: { value: col('#000') }, cLine: { value: col('#e93a9a') }, cFog: { value: col('#000') }, camPos: { value: new THREE.Vector3() }, density: { value: 0.011 }, uTime: { value: 0 }, uWater: { value: 0 } }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 1000), new THREE.ShaderMaterial({ vertexShader: groundVert, fragmentShader: groundFrag, uniforms: gU, extensions: { derivatives: true } as unknown as THREE.ShaderMaterial['extensions'] }))
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, -0.02, -200)
  scene.add(ground)

  const roadTex = roadTexture()
  roadTex.repeat.set(1, 1000 / 10)
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1000), new THREE.MeshBasicMaterial({ map: roadTex }))
  road.rotation.x = -Math.PI / 2
  road.position.set(0, 0, -200)
  scene.add(road)

  const reflectorGeo = new THREE.PlaneGeometry(0.16, 0.16)
  const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xffd38a, transparent: true, opacity: 0.95, fog: true })
  const reflectors = new THREE.InstancedMesh(reflectorGeo, reflectorMat, 160)
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < 160; i++) {
    const side = i % 2 ? 1 : -1
    m4.makeRotationX(-Math.PI / 2)
    m4.setPosition(side * 3.9, 0.02, START + 4 - Math.floor(i / 2) * 6)
    reflectors.setMatrixAt(i, m4)
  }
  scene.add(reflectors)

  const treeTex = { palm: treeTexture('palm'), pine: treeTexture('pine'), cypress: treeTexture('cypress'), pole: treeTexture('pole') }
  const skylines: THREE.Mesh[] = []
  let gen = 0
  const trees: THREE.Sprite[] = []

  const content = new THREE.Group()
  scene.add(content)
  const pickables: THREE.Mesh[] = []
  const textures: THREE.Texture[] = []
  const points: THREE.Points[] = []
  let route = opts.route
  let disposed = false

  const skyMsg = new THREE.Sprite(new THREE.SpriteMaterial({ map: skyText(), transparent: true, opacity: 0, fog: false, depthWrite: false }))
  skyMsg.scale.set(48, 12, 1)
  scene.add(skyMsg)

  function build() {
    gen++
    const myGen = gen
    content.traverse((o) => {
      const m = o as THREE.Mesh
      if (m === (content as unknown)) return
      m.geometry?.dispose?.()
      const mat = m.material as THREE.Material | undefined
      mat?.dispose?.()
    })
    skylines.forEach((m) => {
      scene.remove(m)
      m.geometry.dispose()
      const mat = m.material as THREE.MeshBasicMaterial
      mat.map?.dispose()
      mat.dispose()
    })
    skylines.length = 0
    content.clear()
    pickables.length = 0
    points.length = 0
    trees.forEach((t) => {
      scene.remove(t)
      t.material.dispose()
    })
    trees.length = 0
    textures.forEach((t) => t.dispose())
    textures.length = 0

    route.forEach((reg, i) => {
      const zc = -i * GAP
      const side = i % 2 ? 1 : -1
      const pcW = 15
      const pcH = pcW * (9 / 16)
      const bill = new THREE.Group()
      const pcMat = new THREE.MeshBasicMaterial({ color: 0x222222 })
      const pc = new THREE.Mesh(new THREE.PlaneGeometry(pcW, pcH), pcMat)
      pc.userData = { kind: 'postcard', id: reg.postcard }
      pickables.push(pc)
      const back = new THREE.Mesh(new THREE.PlaneGeometry(pcW + 0.5, pcH + 0.5), new THREE.MeshBasicMaterial({ color: 0x0b0812 }))
      back.position.z = -0.05
      bill.add(back, pc)
      const postMat = new THREE.MeshBasicMaterial({ color: 0x0b0812 })
      ;[-pcW * 0.3, pcW * 0.3].forEach((x) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.4 - pcH / 2 + 0.2, 0.35), postMat)
        post.position.set(x, -pcH / 2 - (5.4 - pcH / 2) / 2, -0.1)
        bill.add(post)
      })
      bill.position.set(side * 12.5, 5.4, zc - 12)
      bill.rotation.y = -side * 0.5
      content.add(bill)
      loadTex(artUrl(reg.postcard, 'landscape', q === 'high' ? 1920 : 1280)).then((t) => {
        if (disposed || myGen !== gen) return t.dispose()
        textures.push(t)
        pcMat.map = t
        pcMat.color.set(0xffffff)
        pcMat.needsUpdate = true
      })

      const ids = shotsByTag(reg.shots).map((s) => s.id)
      const pickN = [0, 1, 2, 3].map((k) => ids[(k * 2 + i) % ids.length])
      const spots = [
        { x: -side * 13, y: 4.6, z: zc + 6, w: 7.5, ry: side * 0.5 },
        { x: side * 18, y: 9.5, z: zc - 22, w: 8.5, ry: -side * 0.38 },
        { x: -side * 8.5, y: 11.5, z: zc - 30, w: 6.5, ry: side * 0.22 },
        { x: side * 9.5, y: 2.9, z: zc + 20, w: 5.2, ry: -side * 0.6 },
      ]
      spots.forEach((sp, k) => {
        const id = pickN[k]
        if (!id) return
        const h = sp.w * (9 / 16)
        const g = new THREE.Group()
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(sp.w + 0.3, h + 0.3), new THREE.MeshBasicMaterial({ color: 0xf6efe4 }))
        frame.position.z = -0.03
        const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
        const img = new THREE.Mesh(new THREE.PlaneGeometry(sp.w, h), mat)
        img.userData = { kind: 'shot', id }
        pickables.push(img)
        g.add(frame, img)
        g.position.set(sp.x, sp.y, sp.z)
        g.rotation.y = sp.ry
        g.userData.bob = { y: sp.y, s: Math.random() * 6 }
        content.add(g)
        loadTex(shotUrl(id, shotW)).then((t) => {
          if (disposed || myGen !== gen) return t.dispose()
          textures.push(t)
          mat.map = t
          mat.color.set(0xffffff)
          mat.needsUpdate = true
        })
      })

      const N = q === 'high' ? 420 : 200
      const pos = new Float32Array(N * 3)
      const seed = new Float32Array(N)
      for (let k = 0; k < N; k++) {
        pos[k * 3] = (Math.random() * 2 - 1) * 34
        pos[k * 3 + 1] = Math.random() * 18
        pos[k * 3 + 2] = zc + (Math.random() * 2 - 1) * 38
        seed[k] = Math.random()
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
      const type = PTYPES[reg.particle]
      const size = [70, 7, 9, 260, 6, 5][type]
      const pm = new THREE.ShaderMaterial({
        vertexShader: ptVert,
        fragmentShader: ptFrag,
        transparent: true,
        depthWrite: false,
        blending: type === 3 ? THREE.NormalBlending : THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uType: { value: type }, uSize: { value: size }, uPx: { value: 1 }, cA: { value: col(reg.tint[0]) }, cB: { value: col(reg.tint[1]) }, uFade: { value: 1 } },
      })
      const pts = new THREE.Points(geo, pm)
      pts.frustumCulled = false
      pts.userData.zc = zc
      points.push(pts)
      content.add(pts)

      const kinds = TREES[reg.id] ?? ['palm']
      const sk = new THREE.Mesh(
        new THREE.PlaneGeometry(760, 190),
        new THREE.MeshBasicMaterial({ map: skylineTexture(SKYLINE[reg.id] ?? 'city', reg.tint[0]), transparent: true, fog: false, depthWrite: false, opacity: 0 }),
      )
      sk.position.set(0, 95 - 22, zc - 230)
      sk.userData.i = i
      scene.add(sk)
      skylines.push(sk)
      for (let k = 0; k < 14; k++) {
        const kind = treeTex[kinds[k % kinds.length]]
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: kind, color: 0x0c0614, transparent: true, fog: true, depthWrite: false }))
        const s = 9 + Math.random() * 9
        sp.scale.set(s * 0.5, s, 1)
        const sx = (k % 2 ? 1 : -1) * (14 + Math.random() * 46)
        sp.position.set(sx, s / 2 - 0.2, zc - (Math.random() * 2 - 1) * 34)
        if (Math.abs(sx) < 26 && Math.abs(sp.position.z - (zc - 8)) < 10) sp.position.x += Math.sign(sx) * 18
        scene.add(sp)
        trees.push(sp)
      }
    })
    const last = -(route.length - 1) * GAP
    skyMsg.position.set(0, 50, last - 32)
  }
  build()

  let progress = 0
  let zNow = START
  let mode: 'walk' | 'cruise' = 'walk'
  let stop = -1
  let lookUpFired = false
  const look = new THREE.Vector2()
  const lookT = new THREE.Vector2()
  let gyro = false

  const onMove = (e: PointerEvent) => {
    if (gyro) return
    lookT.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
  }
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return
    gyro = true
    lookT.set(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 60) / 30)))
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('deviceorientation', onOrient)

  const ray = new THREE.Raycaster()
  const onClick = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    if (e.clientY < r.top || e.clientY > r.bottom) return
    const t = e.target as HTMLElement
    if (t.closest('button, a, input, [data-ui]')) return
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    ray.setFromCamera(ndc, cam)
    const hit = ray.intersectObjects(pickables, false)[0]
    if (hit) opts.onPick(hit.object.userData.kind, hit.object.userData.id)
  }
  window.addEventListener('click', onClick)
  const onHover = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    if (e.clientY < r.top || e.clientY > r.bottom || r.top > 1 || r.bottom < window.innerHeight - 1) return
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    ray.setFromCamera(ndc, cam)
    const hit = ray.intersectObjects(pickables, false)[0]
    el.dataset.cursor = hit ? 'OPEN' : ''
  }
  window.addEventListener('pointermove', onHover, { passive: true })

  const cA = new THREE.Color(), cB = new THREE.Color(), tmp = new THREE.Color()
  function mixRegion(f: number, k: 0 | 1 | 2, out: THREE.Color) {
    const i = Math.max(0, Math.min(route.length - 1, Math.floor(f)))
    const j = Math.min(route.length - 1, i + 1)
    const t = Math.max(0, Math.min(1, f - i))
    cA.set(route[i].sky[k])
    cB.set(route[j].sky[k])
    return out.copy(cA).lerp(cB, t)
  }

  function zFor(p: number) {
    const n = route.length - 1
    const u = Math.max(0, Math.min(n, p * n))
    const i = Math.min(n - 1, Math.floor(u))
    const f = u - i
    const x = Math.max(0, Math.min(1, (f - 0.2) / 0.6))
    const e = x * x * x * (x * (x * 6 - 15) + 10)
    return START - (i + (u >= n ? 1 : e)) * GAP
  }

  const remove = addView({
    el,
    enabled: () => !get().reduced && get().quality !== 'low',
    render(r, t, dt, w, h) {
      cam.aspect = w / h
      const fovT = mode === 'cruise' ? 74 : 60
      cam.fov += (fovT - cam.fov) * Math.min(1, dt * 3)
      cam.updateProjectionMatrix()
      const target = zFor(progress)
      const follow = 1 - Math.pow(mode === 'cruise' ? 0.02 : 0.06, dt)
      const prevZ = zNow
      zNow += (target - zNow) * follow
      const speed = Math.abs(zNow - prevZ) / Math.max(dt, 0.001)
      look.lerp(lookT, 1 - Math.pow(0.004, dt))
      const yaw = -look.x * 0.55
      const pitch = look.y * 0.38
      const bob = mode === 'walk' ? Math.sin(zNow * 1.4) * Math.min(0.08, speed * 0.004) : 0
      const height = mode === 'cruise' ? 1.25 : 1.75
      cam.position.set(Math.sin(t * 0.3) * 0.12, height + bob, zNow)
      cam.rotation.set(pitch, yaw + Math.sin(t * 0.21) * 0.01, mode === 'cruise' ? -look.x * 0.03 : 0, 'YXZ')

      const f = (START - zNow) / GAP
      mixRegion(f, 0, skyU.cTop.value)
      mixRegion(f, 1, skyU.cMid.value)
      mixRegion(f, 2, skyU.cHor.value)
      tmp.copy(skyU.cHor.value).lerp(skyU.cMid.value, 0.45)
      fog.color.copy(tmp)
      gU.cFog.value.copy(tmp)
      const ri = Math.max(0, Math.min(route.length - 1, Math.round(f)))
      gU.cGround.value.set(route[ri].ground)
      gU.cLine.value.set(route[ri].tint[0]).multiplyScalar(0.55)
      const waterOf = (id: string) => (id === 'leonida-keys' ? 1 : id === 'port-gellhorn' ? 0.55 : id === 'vice-city' ? 0.3 : 0)
      const wi = Math.max(0, Math.min(route.length - 1, Math.floor(f)))
      const wj = Math.min(route.length - 1, wi + 1)
      const wt = Math.max(0, Math.min(1, f - wi))
      gU.uWater.value = waterOf(route[wi].id) * (1 - wt) + waterOf(route[wj].id) * wt
      gU.uTime.value = t
      skylines.forEach((m) => {
        const mat = m.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, Math.min(0.92, 1.15 - Math.abs(f - m.userData.i) * 1.05))
        m.visible = mat.opacity > 0.01
      })
      gU.camPos.value.copy(cam.position)
      skyU.uTime.value = t
      skyU.sunDir.value.set(Math.sin(f * 0.9) * 0.6, 0.06 + 0.04 * Math.cos(f), -1)
      sky.position.copy(cam.position)
      ground.position.z = zNow - 200

      const dpr = r.getPixelRatio()
      points.forEach((p) => {
        const m = p.material as THREE.ShaderMaterial
        m.uniforms.uTime.value = t
        m.uniforms.uPx.value = dpr * (h / 900) * 10
        const d = Math.abs(zNow - 16 - p.userData.zc)
        m.uniforms.uFade.value = Math.max(0, 1 - d / 80)
      })
      content.children.forEach((c) => {
        const b = c.userData.bob
        if (b) c.position.y = b.y + Math.sin(t * 0.8 + b.s) * 0.25
      })

      const s = Math.max(0, Math.min(route.length - 1, Math.round(f - 0.15)))
      if (s !== stop) {
        stop = s
        opts.onStop(s)
      }
      const atLast = f > route.length - 1.35
      const wantSky = atLast && pitch > 0.2
      const sm = skyMsg.material as THREE.SpriteMaterial
      sm.opacity += ((wantSky ? 1 : 0) - sm.opacity) * Math.min(1, dt * 1.5)
      if (wantSky && !lookUpFired && sm.opacity > 0.6) {
        lookUpFired = true
        opts.onLookUp()
      }
      r.render(scene, cam)
    },
  })

  return {
    setProgress(p) {
      progress = p
    },
    setMode(m) {
      mode = m
    },
    setRoute(rt) {
      route = rt
      build()
    },
    getStop: () => stop,
    dispose() {
      disposed = true
      roadTex.dispose()
      Object.values(treeTex).forEach((t) => t.dispose())
      ;(skyMsg.material as THREE.SpriteMaterial).map?.dispose()
      skylines.forEach((m) => (m.material as THREE.MeshBasicMaterial).map?.dispose())
      remove()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', onHover)
      window.removeEventListener('deviceorientation', onOrient)
      window.removeEventListener('click', onClick)
      textures.forEach((t) => t.dispose())
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
    },
  }
}
