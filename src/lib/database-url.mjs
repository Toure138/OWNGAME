// Résolution de la chaîne de connexion à la base.
//
// Le projet lit normalement `DATABASE_URL`, et cela suffit partout. Ce module
// existe pour une situation précise : sur un hébergement, une variable déjà
// enregistrée survit au changement de moteur de base. Un service Render créé
// du temps de SQLite conserve ainsi `DATABASE_URL=file:…`, et la valeur ne peut
// être corrigée qu'à l'endroit où elle a été posée — dans le tableau de bord,
// ou par une synchronisation du blueprint qui, elle, refuse de remplacer une
// variable modifiée à la main.
//
// D'où cette porte de sortie : si `DATABASE_URL` est inutilisable, une des
// variables de repli prend le relais. Ajouter une variable est toujours
// possible, même quand la première est verrouillée par un blueprint.
//
// L'ordre de préférence est volontairement conservateur : `DATABASE_URL`
// l'emporte dès qu'elle est exploitable, pour qu'un déploiement sain ne se
// mette jamais à lire une variable secondaire à l'insu de son auteur.

const FALLBACK_VARS = ['POSTGRES_URL', 'DATABASE_URL_POSTGRES', 'POSTGRES_PRISMA_URL']

/** Une URL SQLite est le vestige à écarter ; le reste est confié à Prisma. */
function usable(value) {
  return typeof value === 'string' && value.trim() !== '' && !value.trim().startsWith('file:')
}

/**
 * @returns {{ url: string|null, source: string|null, reason: 'ok'|'sqlite'|'missing' }}
 */
export function resolveDatabaseUrl(env = process.env) {
  if (usable(env.DATABASE_URL)) {
    return { url: env.DATABASE_URL.trim(), source: 'DATABASE_URL', reason: 'ok' }
  }

  for (const name of FALLBACK_VARS) {
    if (usable(env[name])) {
      return { url: env[name].trim(), source: name, reason: 'ok' }
    }
  }

  return {
    url: null,
    source: null,
    reason: env.DATABASE_URL ? 'sqlite' : 'missing',
  }
}

/** Masque le mot de passe : ces lignes finissent dans les journaux. */
export function maskUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.password) parsed.password = '***'
    return parsed.toString()
  } catch {
    return '(URL illisible)'
  }
}

/** Explication affichée quand aucune chaîne exploitable n'a été trouvée. */
export function explainMissingUrl(reason, env = process.env) {
  const lines = []
  if (reason === 'sqlite') {
    lines.push('❌ DATABASE_URL pointe vers un fichier SQLite (file:…).')
    lines.push('   Le projet utilise PostgreSQL depuis le passage à une base persistante.')
  } else {
    lines.push('❌ Aucune chaîne de connexion PostgreSQL n’est définie.')
  }
  lines.push('')

  if (env.RENDER) {
    lines.push('   Sur Render, la variable enregistrée dans le service a été conservée.')
    lines.push('   Trois façons de s’en sortir, de la plus rapide à la plus propre :')
    lines.push('')
    lines.push('   A. La plus rapide — créez la base, puis ajoutez une variable NEUVE :')
    lines.push('      1. New → PostgreSQL (même région que le service, ex. Frankfurt).')
    lines.push('      2. Sur la page de la base, copiez « Internal Database URL ».')
    lines.push('      3. Service web → Settings → Environment → Add Environment Variable')
    lines.push('         Nom : POSTGRES_URL     Valeur : l’URL copiée')
    lines.push('      Inutile de toucher à DATABASE_URL : POSTGRES_URL prend le relais')
    lines.push('      dès qu’elle est inutilisable.')
    lines.push('')
    lines.push('   B. Corriger DATABASE_URL — même chose, mais en remplaçant la valeur')
    lines.push('      existante au lieu d’ajouter une variable.')
    lines.push('')
    lines.push('   C. Blueprint — Dashboard → Blueprints → Sync. Render crée alors la base')
    lines.push('      « qvgdm-db » déclarée dans render.yaml. À noter : le plan gratuit est')
    lines.push('      limité à une base PostgreSQL par compte, et une variable déjà modifiée')
    lines.push('      à la main n’est jamais remplacée par la synchronisation.')
  } else {
    lines.push('   Valeur attendue, par exemple :')
    lines.push('   postgresql://qvgdm:qvgdm@localhost:5432/qvgdm?schema=public')
    lines.push('')
    lines.push('   En local, `npm run db:up` démarre un PostgreSQL correspondant.')
  }
  return lines.join('\n')
}
