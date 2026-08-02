import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Qui veut gagner 20 millions ? — Quiz multijoueur',
  description:
    "Affrontez d'autres joueurs en temps réel sur 20 questions tirées d'une banque de 1000 questions réparties en 20 catégories. Classements mondial et national, succès à débloquer.",
  keywords: ['quiz', 'multijoueur', 'culture générale', 'jeu en ligne', 'temps réel', 'duel'],
  authors: [{ name: 'QVGDM' }],
  applicationName: '20 Millions',
  openGraph: {
    title: 'Qui veut gagner 20 millions ?',
    description: 'Quiz multijoueur en temps réel — 1000 questions, 20 catégories.',
    type: 'website',
    locale: 'fr_FR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Le fond de la barre d'adresse suit le thème actif.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfcfa' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
