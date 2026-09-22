import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Batalhas do Dukoth — Ao vivo',
  description:
    'Painel das batalhas do Dukoth: sorteio, filas, pote e pagamentos via Rhyno.',
  icons: {
    icon: '/dukoth/mark.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0e1626',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={jetbrainsMono.variable}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
