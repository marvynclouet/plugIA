import Link from 'next/link'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VistaFlow - Gestion des Interactions Social Media',
  description: 'Automatisez la gestion de vos interactions sur les réseaux sociaux',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-hero-grid [background-size:80px_80px] opacity-20" />
          <div className="pointer-events-none absolute inset-0 blur-[160px] opacity-60">
            <div className="absolute top-10 left-0 h-64 w-64 rounded-full bg-[#7C5CFF]/40 animate-pulse-glow" />
            <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-[#44E2FF]/40 animate-pulse-glow delay-200" />
          </div>
        </div>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-white/10 bg-black/40 py-6 text-center text-sm text-white/60">
              <p>© {new Date().getFullYear()} VistaFlow ·{' '}
                <Link href="/legal/privacy" className="text-white hover:underline">
                  Politique de confidentialité
                </Link>
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}

