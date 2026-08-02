import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Bundle autonome : Render lance directement .next/standalone/server.js,
  // sans avoir à installer les dépendances de production sur l'instance.
  output: 'standalone',

  // Les erreurs de typage font échouer le build. Elles étaient auparavant
  // ignorées, ce qui laissait passer des régressions jusqu'en production.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Next 16 ne lance plus ESLint pendant le build : le lint a son propre
  // script (`npm run lint`).
  reactStrictMode: true,

  images: {
    // Les joueurs peuvent renseigner l'URL d'un avatar hébergé n'importe où :
    // on sert ces images telles quelles plutôt que de les faire transiter par
    // l'optimiseur, qui refuserait les domaines non déclarés.
    unoptimized: true,
  },
}

export default nextConfig
