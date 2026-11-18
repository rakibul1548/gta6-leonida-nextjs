let resizeHook: (() => void) | null = null
export const setResizeHook = (fn: (() => void) | null) => {
  resizeHook = fn
}
export function refreshPixelRatio() {
  resizeHook?.()
}

export const HERO_SCENES = [
  { key: 'jason-and-lucia-02', phone: 'phone-a', label: 'Afternoon' },
  { key: 'jason-and-lucia-01', phone: 'phone', label: 'Golden hour' },
  { key: 'jason-and-lucia-rooftop', phone: 'phone', label: 'Nightfall' },
]

export function heroNeed(phone: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const px = phone ? Math.min(1620, window.innerWidth * 2) : Math.min(window.innerWidth * dpr, 3840)
  return px / dpr
}

export function detectQuality(): 'high' | 'mid' | 'low' {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return 'low'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return 'low'
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8
    if (mem <= 2) return 'low'
    const coarse = matchMedia('(pointer: coarse)').matches
    if (mem <= 4 || (coarse && Math.max(screen.width, screen.height) <= 1024)) return 'mid'
    return 'high'
  } catch {
    return 'low'
  }
}
