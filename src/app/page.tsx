'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

const App = dynamic(() => import('../App').then((mod) => mod.App), {
  ssr: false,
  loading: () => (
    <div className="boot boot--static" aria-hidden="true">
      <div className="boot__panels">
        <div className="boot__panel">
          <picture style={{ display: 'block', overflow: 'hidden' }}>
            <source
              media="(max-aspect-ratio: 4/5)"
              type="image/webp"
              srcSet="/media/a/jason-and-lucia-rooftop-portrait-540.webp 540w, /media/a/jason-and-lucia-rooftop-portrait-1080.webp 1080w, /media/a/jason-and-lucia-rooftop-portrait-1620.webp 1620w"
              sizes="40vw"
            />
            <img
              src="/media/a/jason-and-lucia-rooftop-landscape-1280.webp"
              srcSet="/media/a/jason-and-lucia-rooftop-landscape-640.webp 640w, /media/a/jason-and-lucia-rooftop-landscape-1280.webp 1280w, /media/a/jason-and-lucia-rooftop-landscape-1920.webp 1920w"
              sizes="58vw"
              alt=""
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '40% 50%' }}
            />
          </picture>
        </div>
        <div className="boot__panel">
          <picture style={{ display: 'block', overflow: 'hidden' }}>
            <source
              media="(max-aspect-ratio: 4/5)"
              type="image/webp"
              srcSet="/media/a/jason-and-lucia-lock-and-load-portrait-540.webp 540w, /media/a/jason-and-lucia-lock-and-load-portrait-1080.webp 1080w"
              sizes="40vw"
            />
            <img
              src="/media/a/jason-and-lucia-lock-and-load-landscape-1280.webp"
              srcSet="/media/a/jason-and-lucia-lock-and-load-landscape-640.webp 640w, /media/a/jason-and-lucia-lock-and-load-landscape-1280.webp 1280w, /media/a/jason-and-lucia-lock-and-load-landscape-1920.webp 1920w"
              sizes="58vw"
              alt=""
              decoding="async"
              fetchPriority="high"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '45% 50%' }}
            />
          </picture>
        </div>
        <div className="boot__panel">
          <picture style={{ display: 'block', overflow: 'hidden' }}>
            <source
              media="(max-aspect-ratio: 4/5)"
              type="image/webp"
              srcSet="/media/a/jason-and-lucia-robbery-portrait-540.webp 540w, /media/a/jason-and-lucia-robbery-portrait-1080.webp 1080w"
              sizes="40vw"
            />
            <img
              src="/media/a/jason-and-lucia-robbery-landscape-1280.webp"
              srcSet="/media/a/jason-and-lucia-robbery-landscape-640.webp 640w, /media/a/jason-and-lucia-robbery-landscape-1280.webp 1280w, /media/a/jason-and-lucia-robbery-landscape-1920.webp 1920w"
              sizes="58vw"
              alt=""
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '55% 50%' }}
            />
          </picture>
        </div>
      </div>
      <div className="boot__shade"></div>
    </div>
  ),
})

export default function Home() {
  useEffect(() => {
    ;(window as unknown as { __staticBoot?: boolean }).__staticBoot = true
  }, [])
  return <App />
}
