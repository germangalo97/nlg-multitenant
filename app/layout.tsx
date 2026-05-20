import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Multi-tenant Workspace · NLG Systems',
  description: 'Demo de Row Level Security en Supabase. Cada organización tiene sus datos aislados — un user en Org A no puede ver nada de Org B, ni siquiera conociendo el org_id.',
  robots: { index: true, follow: true }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
