import type { Metadata, Viewport } from 'next'
import '../styles/global.css'
import '../styles/app.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08060d',
}

export const metadata: Metadata = {
  title: 'VI · Welcome to Leonida (fan-made, not affiliated with Rockstar Games)',
  description:
    'A fan-made, playable launch experience for Grand Theft Auto VI: choose your lead, road-trip across Leonida, find six secrets and make your own card. Not affiliated with Rockstar Games.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'VI · Welcome to Leonida (fan-made, not affiliated with Rockstar Games)',
    description: 'Choose your lead, road-trip across Leonida, find six secrets. A fan-made GTA VI experience.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-lead="">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter+Tight:wght@400;500;600;700&display=swap"
        />
        <link rel="preload" as="image" href="/media/vi-logo.webp" fetchPriority="high" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background: #08060d; margin: 0; }
              .boot--static { position: fixed; inset: 0; z-index: 100; background: #08060d; overflow: hidden; }
              .boot--static .boot__panels { position: absolute; inset: -4% -8%; display: flex; gap: 10px; transform: skewX(-9deg); }
              .boot--static .boot__panel { flex: 1; position: relative; overflow: hidden; background: #111; }
              .boot--static .boot__panel:nth-child(2) { flex: 1.15; }
              .boot--static .boot__panel picture { position: absolute; inset: 0 -30%; transform: skewX(9deg); }
              .boot--static .boot__shade { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(8,6,13,.97) 4%, rgba(8,6,13,.35) 48%, rgba(8,6,13,.55) 100%); }
            `,
          }}
        />
      </head>
      <body>
        <div id="root">{children}</div>
        <noscript>
          VI · Welcome to Leonida is a fan-made interactive page and needs JavaScript. Visit
          rockstargames.com/VI for the official site.
        </noscript>
      </body>
    </html>
  )
}

