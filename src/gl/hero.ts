import * as THREE from 'three'
import { addView, loadData, loadTex } from './stage'
import { artUrl } from '../content/media'
import { get } from '../game/store'
import { HERO_SCENES, heroNeed } from './quality'


const vert = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const frag = `
precision highp float;
uniform sampler2D tA; uniform sampler2D tB; uniform sampler2D dA; uniform sampler2D dB;
uniform float aA; uniform float aB; uniform float uMix; uniform float uTime; uniform float uLeak;
uniform vec2 uRes; uniform vec2 uPtr; uniform float uStrength; uniform float uScroll; uniform float uNight;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

vec2 cover(vec2 uv, float ia) {
  float sa = uRes.x / uRes.y;
  vec2 s = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
  float zoom = 0.93 - uScroll * 0.06;
  return (uv - 0.5) * s * zoom + 0.5 + vec2(0.0, uScroll * 0.035);
}

vec3 art(sampler2D t, sampler2D d, float ia) {
  vec2 uv = cover(vUv, ia);
  float dep = texture2D(d, uv).r;
  vec2 off = uPtr * (dep - 0.42) * uStrength;
  uv -= off;
  float far = 1.0 - smoothstep(0.08, 0.3, dep);
  float band = smoothstep(0.2, 0.42, 1.0 - uv.y) * (1.0 - smoothstep(0.5, 0.7, 1.0 - uv.y));
  float haze = far * band;
  uv.x += sin(uv.y * 70.0 + uTime * 1.8) * 0.00045 * haze;
  uv.y += cos(uv.x * 40.0 + uTime * 1.3) * 0.0003 * haze;
  vec3 c = texture2D(t, uv).rgb;
  float sweep = vUv.x * 0.9 + vUv.y * 0.55 - fract(uTime * 0.03) * 3.2 + 0.8;
  c += vec3(1.0, 0.82, 0.62) * exp(-sweep * sweep * 22.0) * 0.07 * (0.4 + far);
  return c;
}

void main() {
  vec3 a = art(tA, dA, aA);
  vec3 b = art(tB, dB, aB);
  float n = fbm(vUv * vec2(3.2, 2.2) + uTime * 0.05);
  float m = smoothstep(n - 0.12, n + 0.12, uMix * 1.24 - 0.12);
  vec3 col = mix(a, b, m);
  float edge = (1.0 - abs(m - 0.5) * 2.0);
  col += vec3(1.0, 0.45, 0.18) * pow(edge, 3.0) * uLeak * 0.9;
  col += vec3(1.0, 0.35, 0.55) * uLeak * 0.12 * (1.0 - vUv.y);
  col = mix(col, col * vec3(0.72, 0.62, 1.05), uNight * 0.55);
  float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.15, 1.0)));
  col *= mix(0.7, 1.0, v);
  col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`

export type HeroGL = {
  setScene: (i: number) => void
  setNight: (v: number) => void
  ready: Promise<void>
  dispose: () => void
}

export function createHero(el: HTMLElement, phone: boolean): HeroGL {
  const scene = new THREE.Scene()
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const empty = new THREE.Texture()
  const uniforms = {
    tA: { value: empty }, tB: { value: empty }, dA: { value: empty }, dB: { value: empty },
    aA: { value: 16 / 9 }, aB: { value: 16 / 9 },
    uMix: { value: 0 }, uTime: { value: 0 }, uLeak: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) }, uPtr: { value: new THREE.Vector2() },
    uStrength: { value: phone ? 0.03 : 0.022 }, uScroll: { value: 0 }, uNight: { value: 0 },
  }
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false })
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))

  const tex: { t: THREE.Texture; d: THREE.Texture; a: number }[] = []
  const need = heroNeed(phone)
  const ready = Promise.all(
    HERO_SCENES.map(async (s) => {
      const variant = phone ? s.phone : 'landscape'
      const [t, d] = await Promise.all([loadTex(artUrl(s.key, variant, need)), loadData(`/media/d/${s.key}-${variant}.webp`)])
      const img = t.image as HTMLImageElement
      return { t, d, a: img.width / img.height }
    }),
  ).then((list) => {
    tex.push(...list)
    apply(cur, cur)
  })

  let cur = 1
  let from = 1
  let mixV = 1
  let leak = 0
  const ptr = new THREE.Vector2()
  const target = new THREE.Vector2()
  let gyro = false

  function apply(a: number, b: number) {
    if (!tex.length) return
    uniforms.tA.value = tex[a].t
    uniforms.dA.value = tex[a].d
    uniforms.aA.value = tex[a].a
    uniforms.tB.value = tex[b].t
    uniforms.dB.value = tex[b].d
    uniforms.aB.value = tex[b].a
  }

  const onMove = (e: PointerEvent) => {
    if (gyro) return
    target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
  }
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return
    gyro = true
    target.set(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25)))
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('deviceorientation', onOrient)

  const remove = addView({
    el,
    enabled: () => !get().reduced && get().quality !== 'low',
    render(r, t, dt, w, h) {
      if (!tex.length) return
      const k = 1 - Math.pow(0.0015, dt)
      ptr.lerp(target, k)
      uniforms.uPtr.value.copy(ptr)
      uniforms.uTime.value = t
      uniforms.uRes.value.set(w, h)
      const rect = el.getBoundingClientRect()
      uniforms.uScroll.value = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)))
      if (mixV < 1) {
        mixV = Math.min(1, mixV + dt / 1.1)
        leak = Math.sin(mixV * Math.PI)
        if (mixV >= 1) apply(cur, cur)
      } else leak *= 0.9
      uniforms.uMix.value = mixV
      uniforms.uLeak.value = leak
      r.render(scene, cam)
    },
  })

  return {
    ready,
    setScene(i: number) {
      if (i === cur) return
      from = mixV < 1 ? cur : cur
      cur = i
      apply(from, cur)
      mixV = 0
    },
    setNight(v: number) {
      uniforms.uNight.value = v
    },
    dispose() {
      remove()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onOrient)
      mat.dispose()
      tex.forEach((x) => {
        x.t.dispose()
        x.d.dispose()
      })
    },
  }
}
