// Vérification de bout en bout de tous les points d'entrée de l'API.
//
// Le script s'exécute contre un serveur déjà démarré :
//   node scripts/check-endpoints.mjs [URL]
// (URL par défaut : http://localhost:3000)
//
// Il couvre les codes de succès, les refus d'authentification, les contrôles
// d'autorisation, la validation des entrées, un duel complet entre deux joueurs
// jusqu'à l'enregistrement de la partie en base, une partie contre l'ordinateur
// et un examen du parcours académique.

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@qvgdm.fr', password: process.env.ADMIN_PASSWORD || 'admin123' }

let passed = 0
let failed = 0
const failures = []

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

function section(title) {
  console.log(`\n${BOLD}── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}${RESET}`)
}

function record(ok, label, detail) {
  if (ok) {
    passed++
    console.log(`  ${GREEN}✓${RESET} ${label}`)
  } else {
    failed++
    failures.push(`${label} — ${detail}`)
    console.log(`  ${RED}✗${RESET} ${label}\n    ${DIM}${detail}${RESET}`)
  }
}

async function call(method, path, { token, body, expect } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (e) {
    return { ok: false, status: 0, data: {}, error: `requête échouée : ${e.message}` }
  }

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  const expected = Array.isArray(expect) ? expect : expect === undefined ? null : [expect]
  const statusOk = expected ? expected.includes(res.status) : res.ok
  return {
    ok: statusOk,
    status: res.status,
    data,
    error: statusOk ? null : `attendu ${expected ? expected.join('/') : '2xx'}, reçu ${res.status} — ${JSON.stringify(data).slice(0, 160)}`,
  }
}

async function check(label, method, path, options = {}) {
  const res = await call(method, path, options)
  record(res.ok, `${method.padEnd(6)} ${path.padEnd(42)} ${label}`, res.error || '')
  return res
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Attend un événement donné dans la file d'un joueur, en interrogeant le serveur. */
async function waitForEvent(token, type, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs
  const collected = []
  while (Date.now() < deadline) {
    const res = await call('POST', '/api/realtime/poll', { token })
    for (const evt of res.data.events || []) {
      collected.push(evt)
      if (evt.type === type) return { event: evt, collected }
    }
    await sleep(250)
  }
  return { event: null, collected }
}

async function main() {
  console.log(`${BOLD}Vérification des points d'entrée${RESET}`)
  console.log(`${DIM}Cible : ${BASE}${RESET}`)

  // ---------------------------------------------------------------- Santé
  section('Santé et index')
  const health = await check('service et base disponibles', 'GET', '/api/health')
  if (health.ok) {
    console.log(
      `    ${DIM}${health.data.database?.questions} questions · ${health.data.database?.categories} catégories · ${health.data.database?.users} comptes${RESET}`
    )
    record(
      health.data.database?.questions > 0,
      'GET    /api/health                                banque de questions non vide',
      `questions = ${health.data.database?.questions}`
    )
  }
  await check('index des endpoints', 'GET', '/api')

  // ------------------------------------------------------------ Inscription
  section('Authentification')
  const stamp = Date.now()
  const playerOne = { email: `verif-a-${stamp}@test.fr`, password: 'MotDePasse123!', pseudo: `VerifA${stamp % 10000}`, country: 'France' }
  const playerTwo = { email: `verif-b-${stamp}@test.fr`, password: 'MotDePasse123!', pseudo: `VerifB${stamp % 10000}`, country: 'Belgique' }

  const regOne = await check('inscription joueur A', 'POST', '/api/auth/register', { body: playerOne, expect: 201 })
  const regTwo = await check('inscription joueur B', 'POST', '/api/auth/register', { body: playerTwo, expect: 201 })
  await check('e-mail déjà utilisé rejeté', 'POST', '/api/auth/register', { body: playerOne, expect: 409 })
  await check('mot de passe trop court rejeté', 'POST', '/api/auth/register', {
    body: { email: `court-${stamp}@test.fr`, password: '123', pseudo: 'Court' },
    expect: 400,
  })
  await check('adresse e-mail invalide rejetée', 'POST', '/api/auth/register', {
    body: { email: 'pas-un-email', password: 'MotDePasse123!', pseudo: 'Test' },
    expect: 400,
  })

  const tokenA = regOne.data.token
  const tokenB = regTwo.data.token
  const idA = regOne.data.user?.id
  const idB = regTwo.data.user?.id
  record(!!tokenA && !!tokenB, 'jetons délivrés à l’inscription', 'jeton manquant')
  record(
    regOne.data.user && !('passwordHash' in regOne.data.user),
    'la réponse d’inscription n’expose pas l’empreinte du mot de passe',
    'passwordHash présent dans la réponse'
  )

  const login = await check('connexion joueur A', 'POST', '/api/auth/login', {
    body: { email: playerOne.email, password: playerOne.password },
  })
  await check('mot de passe erroné rejeté', 'POST', '/api/auth/login', {
    body: { email: playerOne.email, password: 'mauvais-mot-de-passe' },
    expect: 401,
  })
  await check('compte inconnu rejeté', 'POST', '/api/auth/login', {
    body: { email: `inconnu-${stamp}@test.fr`, password: 'MotDePasse123!' },
    expect: 401,
  })

  // Le bourrage d'identifiants vise un compte précis, souvent depuis plusieurs
  // adresses IP : la limite par compte doit finir par bloquer.
  const victim = `cible-${stamp}@test.fr`
  let blocked = false
  for (let i = 0; i < 12; i++) {
    const attempt = await call('POST', '/api/auth/login', {
      body: { email: victim, password: `essai-${i}` },
    })
    if (attempt.status === 429) {
      blocked = true
      break
    }
  }
  record(
    blocked,
    'POST   /api/auth/login                            le bourrage sur un compte est bloqué',
    '12 tentatives sur la même adresse sans blocage'
  )
  // Une connexion valide doit rester possible depuis la même IP : la limite
  // par adresse ne doit pas être si basse qu'elle punisse les autres joueurs.
  await check('les autres comptes restent connectables', 'POST', '/api/auth/login', {
    body: { email: playerOne.email, password: playerOne.password },
  })

  await check('profil courant', 'GET', '/api/auth/me', { token: tokenA })
  await check('profil sans jeton refusé', 'GET', '/api/auth/me', { expect: 401 })
  await check('jeton falsifié refusé', 'GET', '/api/auth/me', {
    token: `${login.data.token?.split('.').slice(0, 2).join('.')}.signature-invalide`,
    expect: 401,
  })
  await check('jeton malformé refusé', 'GET', '/api/auth/me', { token: 'nimportequoi', expect: 401 })

  await check('mise à jour du profil', 'PATCH', '/api/auth/profile', {
    token: tokenA,
    body: { country: 'Canada', fullName: 'Joueur de vérification' },
  })
  await check('avatar non http rejeté', 'PATCH', '/api/auth/profile', {
    token: tokenA,
    body: { avatarUrl: 'javascript:alert(1)' },
    expect: 400,
  })
  await check('changement de mot de passe sans l’ancien refusé', 'PATCH', '/api/auth/profile', {
    token: tokenA,
    body: { newPassword: 'UnAutreMotDePasse1!' },
    expect: 400,
  })
  await check('changement avec un ancien mot de passe erroné refusé', 'PATCH', '/api/auth/profile', {
    token: tokenA,
    body: { currentPassword: 'faux', newPassword: 'UnAutreMotDePasse1!' },
    expect: 403,
  })

  // --------------------------------------------------------------- Contenu
  section('Contenu')
  const cats = await check('liste des catégories', 'GET', '/api/categories')
  const firstCategory = cats.data.categories?.[0]
  record(
    typeof firstCategory?.questionCount === 'number',
    'GET    /api/categories                            nombre de questions par catégorie',
    'questionCount absent'
  )

  await check('banque de questions (authentifié)', 'GET', '/api/questions?limit=5', { token: tokenA })
  await check('banque de questions sans jeton refusée', 'GET', '/api/questions', { expect: 401 })

  const randomAsPlayer = await check('tirage aléatoire', 'GET', '/api/questions/random?limit=10', { token: tokenA })
  record(
    (randomAsPlayer.data.questions || []).every(q => !('correctAnswer' in q)),
    'GET    /api/questions/random                      la bonne réponse est masquée aux joueurs',
    'correctAnswer exposé à un joueur non administrateur'
  )
  await check('difficulté invalide rejetée', 'GET', '/api/questions/random?difficulty=IMPOSSIBLE', {
    token: tokenA,
    expect: 400,
  })

  // Deux tirages successifs doivent différer : sinon le tirage n'est pas aléatoire.
  const drawOne = await call('GET', '/api/questions/random?limit=20', { token: tokenA })
  const drawTwo = await call('GET', '/api/questions/random?limit=20', { token: tokenA })
  const idsOne = (drawOne.data.questions || []).map(q => q.id).join(',')
  const idsTwo = (drawTwo.data.questions || []).map(q => q.id).join(',')
  record(
    idsOne !== idsTwo,
    'GET    /api/questions/random                      deux tirages successifs diffèrent',
    'tirages identiques : la sélection ne semble pas aléatoire'
  )

  // -------------------------------------------------------- Jeu et données
  section('Données du joueur')
  await check('historique des parties', 'GET', '/api/games/history', { token: tokenA })
  await check('historique sans jeton refusé', 'GET', '/api/games/history', { expect: 401 })
  await check('classement mondial', 'GET', '/api/leaderboard?scope=global')
  await check('classement national', 'GET', '/api/leaderboard?scope=national', { token: tokenA })
  await check('classement hebdomadaire', 'GET', '/api/leaderboard?scope=weekly', { token: tokenA })
  await check('classement mensuel', 'GET', '/api/leaderboard?scope=monthly', { token: tokenA })
  await check('classement annuel', 'GET', '/api/leaderboard?scope=yearly', { token: tokenA })
  await check('portée de classement invalide rejetée', 'GET', '/api/leaderboard?scope=nimporte', { expect: 400 })

  await check('succès du joueur', 'GET', '/api/achievements', { token: tokenA })
  const notifs = await check('notifications', 'GET', '/api/notifications', { token: tokenA })
  record(
    typeof notifs.data.unreadCount === 'number',
    'GET    /api/notifications                         compteur de non-lues fourni',
    'unreadCount absent'
  )
  await check('marquage global comme lu', 'PATCH', '/api/notifications?all=true', { token: tokenA })
  await check('notification inexistante refusée', 'PATCH', '/api/notifications?id=inexistante', {
    token: tokenA,
    expect: 404,
  })

  // Suppression : ces méthodes sont utilisées par l'écran des notifications
  // (croix sur chaque ligne et bouton « Tout effacer »).
  const firstNotif = notifs.data.notifications?.[0]
  if (firstNotif) {
    await check('suppression d’une notification', 'DELETE', `/api/notifications?id=${firstNotif.id}`, {
      token: tokenA,
    })
    await check('suppression déjà effectuée', 'DELETE', `/api/notifications?id=${firstNotif.id}`, {
      token: tokenA,
      expect: 404,
    })
  }
  await check('suppression globale', 'DELETE', '/api/notifications?all=true', { token: tokenA })
  const emptied = await call('GET', '/api/notifications', { token: tokenA })
  record(
    (emptied.data.notifications || []).length === 0,
    'DELETE /api/notifications                         la liste est bien vidée',
    `${(emptied.data.notifications || []).length} notification(s) restante(s)`
  )
  await check('écriture directe de partie refusée', 'POST', '/api/games', {
    token: tokenA,
    body: { scoreA: 99999 },
    expect: 405,
  })
  await check('partie inexistante', 'GET', '/api/games?id=inexistante', { token: tokenA, expect: 404 })

  // ---------------------------------------------------------- Administration
  section('Administration')
  const adminLogin = await check('connexion administrateur', 'POST', '/api/auth/login', { body: ADMIN })
  const tokenAdmin = adminLogin.data.token

  await check('statistiques refusées à un joueur', 'GET', '/api/admin/stats', { token: tokenA, expect: 403 })
  await check('statistiques refusées sans jeton', 'GET', '/api/admin/stats', { expect: 401 })

  if (!tokenAdmin) {
    record(false, 'connexion administrateur', 'jeton administrateur indisponible, section ignorée')
  } else {
    await check('tableau de bord', 'GET', '/api/admin/stats', { token: tokenAdmin })
    await check('liste des joueurs', 'GET', '/api/admin/users?limit=5', { token: tokenAdmin })
    await check('liste des questions', 'GET', '/api/admin/questions?limit=5', { token: tokenAdmin })
    await check('liste des catégories', 'GET', '/api/admin/categories', { token: tokenAdmin })

    const adminRandom = await call('GET', '/api/questions/random?limit=3', { token: tokenAdmin })
    record(
      (adminRandom.data.questions || []).every(q => 'correctAnswer' in q),
      'GET    /api/questions/random                      la bonne réponse est visible pour un administrateur',
      'correctAnswer absent pour un administrateur'
    )

    // Cycle de vie complet d'une catégorie et d'une question.
    const newCategory = await check('création d’une catégorie', 'POST', '/api/admin/categories', {
      token: tokenAdmin,
      body: { name: `Vérification ${stamp}`, description: 'Créée par le script de vérification', color: '#3b82f6' },
      expect: 201,
    })
    const categoryId = newCategory.data.category?.id

    await check('couleur invalide rejetée', 'POST', '/api/admin/categories', {
      token: tokenAdmin,
      body: { name: `Couleur ${stamp}`, color: 'bleu' },
      expect: 400,
    })
    await check('nom de catégorie en double rejeté', 'POST', '/api/admin/categories', {
      token: tokenAdmin,
      body: { name: `Vérification ${stamp}` },
      expect: 409,
    })

    let questionId = null
    if (categoryId) {
      await check('modification de la catégorie', 'PATCH', `/api/admin/categories?id=${categoryId}`, {
        token: tokenAdmin,
        body: { description: 'Description mise à jour' },
      })

      const newQuestion = await check('création d’une question', 'POST', '/api/admin/questions', {
        token: tokenAdmin,
        body: {
          text: `Question de vérification ${stamp} : combien font deux plus deux ?`,
          propositionA: 'Trois',
          propositionB: 'Quatre',
          propositionC: 'Cinq',
          propositionD: 'Six',
          correctAnswer: 'B',
          difficulty: 'EASY',
          explanation: 'Deux plus deux font quatre.',
          categoryId,
        },
        expect: 201,
      })
      questionId = newQuestion.data.question?.id

      await check('propositions identiques rejetées', 'POST', '/api/admin/questions', {
        token: tokenAdmin,
        body: {
          text: `Question invalide ${stamp} avec des propositions identiques ?`,
          propositionA: 'Oui',
          propositionB: 'Oui',
          propositionC: 'Non',
          propositionD: 'Peut-être',
          correctAnswer: 'A',
          categoryId,
        },
        expect: 400,
      })
      await check('bonne réponse hors A–D rejetée', 'POST', '/api/admin/questions', {
        token: tokenAdmin,
        body: {
          text: `Question invalide ${stamp} avec une lettre inattendue ?`,
          propositionA: 'A', propositionB: 'B', propositionC: 'C', propositionD: 'D',
          correctAnswer: 'E',
          categoryId,
        },
        expect: 400,
      })
      await check('énoncé en double rejeté', 'POST', '/api/admin/questions', {
        token: tokenAdmin,
        body: {
          text: `Question de vérification ${stamp} : combien font deux plus deux ?`,
          propositionA: 'Un', propositionB: 'Deux', propositionC: 'Trois', propositionD: 'Quatre',
          correctAnswer: 'D',
          categoryId,
        },
        expect: 409,
      })

      const importRes = await check('import en masse', 'POST', '/api/admin/import', {
        token: tokenAdmin,
        body: {
          categoryId,
          questions: [
            {
              text: `Import ${stamp} — quelle est la capitale du Portugal ?`,
              propositionA: 'Porto', propositionB: 'Lisbonne', propositionC: 'Faro', propositionD: 'Braga',
              correctAnswer: 'B', difficulty: 'EASY',
            },
            {
              // Doublon volontaire : doit être ignoré, sans faire échouer le lot.
              text: `Import ${stamp} — quelle est la capitale du Portugal ?`,
              propositionA: 'Porto', propositionB: 'Lisbonne', propositionC: 'Faro', propositionD: 'Braga',
              correctAnswer: 'B',
            },
          ],
        },
      })
      record(
        importRes.data.imported === 1 && importRes.data.rejected === 1,
        'POST   /api/admin/import                          les doublons sont ignorés sans bloquer le lot',
        `importées = ${importRes.data.imported}, rejetées = ${importRes.data.rejected}`
      )

      if (questionId) {
        await check('modification de la question', 'PATCH', `/api/admin/questions?id=${questionId}`, {
          token: tokenAdmin,
          body: { difficulty: 'MEDIUM' },
        })
        await check('suppression de la question', 'DELETE', `/api/admin/questions?id=${questionId}`, {
          token: tokenAdmin,
        })
        await check('suppression déjà effectuée', 'DELETE', `/api/admin/questions?id=${questionId}`, {
          token: tokenAdmin,
          expect: 404,
        })
      }

      await check('suppression d’une catégorie non vide refusée', 'DELETE', `/api/admin/categories?id=${categoryId}`, {
        token: tokenAdmin,
        expect: 409,
      })
      await check('suppression forcée de la catégorie', 'DELETE', `/api/admin/categories?id=${categoryId}&force=true`, {
        token: tokenAdmin,
      })
    }

    // Garde-fous sur le compte administrateur lui-même.
    const adminId = adminLogin.data.user?.id
    if (adminId) {
      await check('un administrateur ne peut pas se rétrograder', 'PATCH', `/api/admin/users?id=${adminId}`, {
        token: tokenAdmin,
        body: { role: 'USER' },
        expect: 400,
      })
      await check('un administrateur ne peut pas se suspendre', 'PATCH', `/api/admin/users?id=${adminId}`, {
        token: tokenAdmin,
        body: { banned: true },
        expect: 400,
      })
      await check('un administrateur ne peut pas se supprimer', 'DELETE', `/api/admin/users?id=${adminId}`, {
        token: tokenAdmin,
        expect: 400,
      })
    }
  }

  // --------------------------------------------------------- Duel complet
  section('Duel complet en temps réel')

  const joinA = await check('joueur A rejoint le salon', 'POST', '/api/realtime/join', { token: tokenA })
  await check('joueur B rejoint le salon', 'POST', '/api/realtime/join', { token: tokenB })
  await check('rejoindre sans jeton refusé', 'POST', '/api/realtime/join', { expect: 401 })
  record(
    typeof joinA.data.config?.questionsPerGame === 'number',
    'POST   /api/realtime/join                         configuration de partie transmise',
    'config absente'
  )

  await check('interrogation des événements', 'POST', '/api/realtime/poll', { token: tokenA })
  await check('interrogation sans jeton refusée', 'POST', '/api/realtime/poll', { expect: 401 })

  await check('auto-invitation refusée', 'POST', '/api/realtime/invite', {
    token: tokenA,
    body: { toUserId: idA },
    expect: 409,
  })
  await check('invitation d’un joueur hors ligne refusée', 'POST', '/api/realtime/invite', {
    token: tokenA,
    body: { toUserId: 'utilisateur-inexistant' },
    expect: 409,
  })

  // Annulation d'un défi (bouton « Annuler » du salon), avant l'invitation
  // qui mènera réellement à la partie.
  const cancelled = await check('A défie B puis se ravise', 'POST', '/api/realtime/invite', {
    token: tokenA,
    body: { toUserId: idB },
  })
  await check('annulation du défi', 'DELETE', '/api/realtime/invite', {
    token: tokenA,
    body: { invitationId: cancelled.data.invitationId },
  })
  await check('annulation d’une invitation inconnue refusée', 'DELETE', '/api/realtime/invite', {
    token: tokenA,
    body: { invitationId: 'inexistante' },
    expect: 404,
  })
  await check('un défi annulé n’est plus acceptable', 'POST', '/api/realtime/invite-respond', {
    token: tokenB,
    body: { invitationId: cancelled.data.invitationId, accept: true },
    expect: 409,
  })
  // On vide la file d'événements de B : l'invitation annulée s'y trouve encore
  // et fausserait l'attente de l'invitation suivante.
  await call('POST', '/api/realtime/poll', { token: tokenB })

  const invite = await check('A défie B', 'POST', '/api/realtime/invite', {
    token: tokenA,
    body: { toUserId: idB, categoryFilter: null },
  })
  await check('invitation en double refusée', 'POST', '/api/realtime/invite', {
    token: tokenA,
    body: { toUserId: idB },
    expect: 409,
  })

  const invitationEvent = await waitForEvent(tokenB, 'invite:received', 6000)
  record(!!invitationEvent.event, 'le joueur B reçoit l’invitation', 'événement invite:received non reçu')

  const invitationId = invitationEvent.event?.data?.id || invite.data.invitationId
  await check('B accepte le défi', 'POST', '/api/realtime/invite-respond', {
    token: tokenB,
    body: { invitationId, accept: true },
  })
  await check('réponse à une invitation inconnue refusée', 'POST', '/api/realtime/invite-respond', {
    token: tokenB,
    body: { invitationId: 'inexistante', accept: true },
    expect: 409,
  })

  const prepare = await waitForEvent(tokenA, 'game:prepare', 6000)
  record(!!prepare.event, 'le joueur A est invité à préparer la partie', 'événement game:prepare non reçu')

  const start = await check('A lance la partie', 'POST', '/api/realtime/game-start', {
    token: tokenA,
    body: { opponentId: idB, categoryFilter: null },
  })
  const gameId = start.data.gameId
  record(!!gameId, 'identifiant de partie retourné', 'gameId absent')
  record(
    start.data.totalQuestions === 20,
    'la partie compte 20 questions',
    `totalQuestions = ${start.data.totalQuestions}`
  )

  if (gameId) {
    const firstQuestion = await waitForEvent(tokenA, 'game:question', 6000)
    const questionData = firstQuestion.event?.data
    record(!!questionData, 'la première question est distribuée', 'événement game:question non reçu')
    record(
      questionData && !('correct' in questionData),
      'la question distribuée ne contient pas la bonne réponse',
      'le champ correct est exposé au client'
    )

    await check('chat de partie', 'POST', '/api/realtime/game-chat', {
      token: tokenA,
      body: { gameId, content: 'Bonne chance !' },
    })

    // Rechargement de page en pleine partie : le joueur doit reprendre sa
    // place, et non perdre par abandon.
    await call('POST', '/api/realtime/poll', { token: tokenB })
    const resumed = await call('POST', '/api/realtime/join', { token: tokenB })
    record(
      !!resumed.data.currentGame,
      'POST   /api/realtime/join                         recharger la page ne fait pas perdre la partie',
      'currentGame absent : la partie a été abandonnée au rechargement'
    )
    record(
      resumed.data.currentGame?.question?.text === questionData?.text,
      'POST   /api/realtime/join                         la question courante est restituée',
      "la reprise ne fournit pas la question en cours : l'écran resterait figé"
    )
    record(
      (resumed.data.currentGame?.chat || []).some(m => m.content === 'Bonne chance !'),
      'POST   /api/realtime/join                         l’historique du chat est restitué',
      'chat vide après reprise'
    )
    record(
      resumed.data.currentGame?.game?.status === 'IN_PROGRESS',
      'POST   /api/realtime/join                         la partie reprise est toujours en cours',
      `statut = ${resumed.data.currentGame?.game?.status}`
    )
    await check('message vide refusé', 'POST', '/api/realtime/game-chat', {
      token: tokenA,
      body: { gameId, content: '   ' },
      expect: 400,
    })

    // La première question revient au joueur A : B ne doit pas pouvoir répondre.
    await check('réponse hors tour refusée', 'POST', '/api/realtime/game-answer', {
      token: tokenB,
      body: { gameId, choice: 'A', responseTime: 500 },
      expect: 409,
    })
    await check('lettre de réponse invalide rejetée', 'POST', '/api/realtime/game-answer', {
      token: tokenA,
      body: { gameId, choice: 'Z', responseTime: 500 },
      expect: 400,
    })
    await check('réponse du joueur A acceptée', 'POST', '/api/realtime/game-answer', {
      token: tokenA,
      body: { gameId, choice: 'A', responseTime: 800 },
    })
    await check('double réponse refusée', 'POST', '/api/realtime/game-answer', {
      token: tokenA,
      body: { gameId, choice: 'B', responseTime: 900 },
      expect: 409,
    })

    const result = await waitForEvent(tokenB, 'game:question-result', 6000)
    record(!!result.event, 'le résultat est diffusé aux deux joueurs', 'événement game:question-result non reçu')

    // Abandon volontaire : la partie doit se clore et être enregistrée.
    await check('abandon du joueur B', 'POST', '/api/realtime/game-leave', {
      token: tokenB,
      body: { gameId },
    })
    const finished = await waitForEvent(tokenA, 'game:finished', 8000)
    record(!!finished.event, 'la fin de partie est notifiée', 'événement game:finished non reçu')
    record(
      finished.event?.data?.winnerId === idA,
      'la victoire est attribuée au joueur resté en lice',
      `winnerId = ${finished.event?.data?.winnerId}`
    )

    // La persistance est asynchrone : on laisse le serveur écrire en base.
    await sleep(1500)

    const historyA = await call('GET', '/api/games/history', { token: tokenA })
    record(
      (historyA.data.games || []).length === 1,
      'la partie est enregistrée une seule fois dans l’historique',
      `${(historyA.data.games || []).length} partie(s) trouvée(s) — un doublon signalerait une double écriture`
    )
    record(
      historyA.data.games?.[0]?.outcome === 'WIN' && historyA.data.games?.[0]?.forfeit === true,
      'l’abandon est correctement enregistré',
      JSON.stringify(historyA.data.games?.[0] || {}).slice(0, 160)
    )

    const meA = await call('GET', '/api/auth/me', { token: tokenA })
    record(
      meA.data.user?.gamesPlayed === 1 && meA.data.user?.wins === 1,
      'les statistiques du joueur sont mises à jour',
      `gamesPlayed = ${meA.data.user?.gamesPlayed}, wins = ${meA.data.user?.wins}`
    )
    record(
      (meA.data.user?.xp ?? 0) > 0,
      'de l’expérience est attribuée',
      `xp = ${meA.data.user?.xp}`
    )

    const achievements = await call('GET', '/api/achievements', { token: tokenA })
    const firstGame = (achievements.data.achievements || []).find(a => a.code === 'FIRST_GAME')
    record(
      firstGame?.unlocked === true,
      'le succès « Première partie » est débloqué',
      `unlocked = ${firstGame?.unlocked}`
    )

    const notifsA = await call('GET', '/api/notifications', { token: tokenA })
    record(
      (notifsA.data.notifications || []).some(n => n.type === 'GAME_WON'),
      'une notification de victoire est créée',
      'aucune notification GAME_WON'
    )
  }

  // ------------------------------------------------- Solo contre l'ordinateur
  section('Partie contre l’ordinateur')

  await check('profil d’ordinateur inconnu refusé', 'POST', '/api/realtime/solo-start', {
    token: tokenA,
    body: { botProfile: 'TERMINATOR', categoryFilter: null },
    expect: 400,
  })
  await check('lancement sans jeton refusé', 'POST', '/api/realtime/solo-start', {
    body: { botProfile: 'NOVICE', categoryFilter: null },
    expect: 401,
  })

  const solo = await check('A lance un duel contre l’ordinateur', 'POST', '/api/realtime/solo-start', {
    token: tokenA,
    body: { botProfile: 'NOVICE', categoryFilter: null },
  })

  if (solo.ok) {
    const started = await waitForEvent(tokenA, 'game:started')
    const soloGame = started.event?.data?.game
    record(soloGame?.mode === 'SOLO', 'la partie démarre en mode SOLO', `mode = ${soloGame?.mode}`)
    record(
      soloGame?.playerB?.isBot === true,
      'l’adversaire est identifié comme artificiel',
      `isBot = ${soloGame?.playerB?.isBot}`
    )
    record(
      soloGame?.playerB?.pseudo?.includes('Ordinateur'),
      'l’adversaire est nommé « Ordinateur »',
      `pseudo = ${soloGame?.playerB?.pseudo}`
    )

    await check('le clavardage est refusé face à l’ordinateur', 'POST', '/api/realtime/game-chat', {
      token: tokenA,
      body: { gameId: soloGame?.id, content: 'bonjour' },
      expect: 409,
    })

    // L'ordinateur doit répondre de lui-même : on attend le résultat d'une
    // question qui lui revient, sans qu'aucun client ne l'ait provoquée.
    let botAnswered = false
    const deadline = Date.now() + 40_000
    while (!botAnswered && Date.now() < deadline) {
      const poll = await call('POST', '/api/realtime/poll', { token: tokenA })
      for (const evt of poll.data.events || []) {
        if (evt.type === 'game:question' && evt.data.answeredBy === 'A') {
          await call('POST', '/api/realtime/game-answer', {
            token: tokenA,
            body: { gameId: evt.data.gameId, choice: 'A', responseTime: 1000 },
          })
        }
        if (evt.type === 'game:question-result' && evt.data.answeredBy === 'B') botAnswered = true
      }
      await sleep(250)
    }
    record(botAnswered, 'l’ordinateur répond de lui-même à son tour', 'aucun résultat côté B')

    await check('abandon de la partie solo', 'POST', '/api/realtime/game-leave', {
      token: tokenA,
      body: { gameId: soloGame?.id },
    })

    const soloHistory = await call('GET', '/api/games/history', { token: tokenA })
    const soloEntry = (soloHistory.data.games || []).find(g => g.mode === 'SOLO')
    record(!!soloEntry, 'la partie solo est enregistrée dans l’historique', 'aucune partie SOLO')
    record(
      soloEntry?.opponent?.pseudo?.includes('Ordinateur'),
      'l’historique nomme l’adversaire artificiel',
      `opponent = ${soloEntry?.opponent?.pseudo}`
    )
  }

  // ------------------------------------------------------ Parcours académique
  section('Parcours académique')

  const progress = await check('état du parcours', 'GET', '/api/academic/progress', { token: tokenA })
  if (progress.ok) {
    const steps = progress.data.steps || []
    record(steps.length === 6, 'les six paliers sont décrits', `${steps.length} paliers`)
    record(
      steps[0]?.code === 'CEP' && steps[5]?.code === 'DOCTORAT',
      'le cursus va du CEP au doctorat',
      `${steps[0]?.code} … ${steps[5]?.code}`
    )
    record(
      steps[0]?.locked === false && steps[1]?.locked === true,
      'seul le premier palier est ouvert à un nouveau joueur',
      `CEP locked=${steps[0]?.locked}, BEPC locked=${steps[1]?.locked}`
    )
    record(
      steps.every(s => s.availableQuestions >= 4),
      'chaque palier dispose d’assez de questions',
      steps.map(s => `${s.short}=${s.availableQuestions}`).join(' ')
    )
    record(
      progress.data.title === 'Candidat libre',
      'un joueur sans diplôme est « Candidat libre »',
      `titre = ${progress.data.title}`
    )
  }

  await check('examen d’un diplôme inconnu refusé', 'POST', '/api/realtime/exam-start', {
    token: tokenA,
    body: { degree: 'PRIX_NOBEL' },
    expect: 400,
  })
  await check('doctorat refusé sans les diplômes précédents', 'POST', '/api/realtime/exam-start', {
    token: tokenA,
    body: { degree: 'DOCTORAT' },
    expect: 403,
  })

  const exam = await check('A se présente au CEP', 'POST', '/api/realtime/exam-start', {
    token: tokenA,
    body: { degree: 'CEP' },
  })

  if (exam.ok) {
    const started = await waitForEvent(tokenA, 'game:started')
    const examGame = started.event?.data?.game
    record(examGame?.mode === 'EXAM', 'la partie démarre en mode EXAM', `mode = ${examGame?.mode}`)
    record(
      examGame?.examLevel === 'CEP' && examGame.examPassRate === 60,
      'le diplôme visé et son seuil accompagnent la partie',
      `${examGame?.examLevel} / ${examGame?.examPassRate} %`
    )
    record(
      examGame?.totalQuestions === 10,
      'l’examen du CEP compte dix questions',
      `${examGame?.totalQuestions} questions`
    )

    // Toutes les questions reviennent au candidat : on répond au hasard
    // jusqu'à la délibération, seul le déroulement est vérifié ici.
    let examSummary = null
    const deadline = Date.now() + 60_000
    while (!examSummary && Date.now() < deadline) {
      const poll = await call('POST', '/api/realtime/poll', { token: tokenA })
      for (const evt of poll.data.events || []) {
        if (evt.type === 'game:question') {
          record(
            evt.data.answeredBy === 'A',
            `question ${evt.data.index + 1} adressée au candidat`,
            `answeredBy = ${evt.data.answeredBy}`
          )
          await call('POST', '/api/realtime/game-answer', {
            token: tokenA,
            body: { gameId: evt.data.gameId, choice: 'A', responseTime: 900 },
          })
        }
        if (evt.type === 'game:finished') examSummary = evt.data
      }
      await sleep(200)
    }

    record(!!examSummary, 'l’examen se termine par une délibération', 'aucun game:finished')
    if (examSummary) {
      record(
        typeof examSummary.passed === 'boolean',
        'le verdict est rendu (reçu ou ajourné)',
        `passed = ${examSummary.passed}`
      )
      record(
        examSummary.examPercent >= 0 && examSummary.examPassRate === 60,
        'la note et le seuil figurent dans le résultat',
        `${examSummary.examPercent} % / ${examSummary.examPassRate} %`
      )
    }

    const examHistory = await call('GET', '/api/games/history', { token: tokenA })
    const examEntry = (examHistory.data.games || []).find(g => g.mode === 'EXAM')
    record(!!examEntry, 'l’examen est enregistré dans l’historique', 'aucune partie EXAM')
    record(
      examEntry?.myQuestions === examEntry?.totalQuestions,
      'toutes les questions de l’examen sont comptées au candidat',
      `${examEntry?.myQuestions} sur ${examEntry?.totalQuestions}`
    )
  }

  await check('joueur A quitte le salon', 'POST', '/api/realtime/leave', { token: tokenA })
  await check('joueur B quitte le salon', 'POST', '/api/realtime/leave', { token: tokenB })

  // -------------------------------------------------------------- Ménage
  section('Nettoyage')
  if (tokenAdmin) {
    for (const [label, id] of [['joueur A', idA], ['joueur B', idB]]) {
      if (!id) continue
      await check(`suppression du compte de test (${label})`, 'DELETE', `/api/admin/users?id=${id}`, {
        token: tokenAdmin,
      })
    }
  }

  // -------------------------------------------------------------- Rapport
  const total = passed + failed
  console.log(`\n${BOLD}${'═'.repeat(62)}${RESET}`)
  console.log(
    `${BOLD}Résultat :${RESET} ${GREEN}${passed} réussi(s)${RESET} · ${failed > 0 ? RED : DIM}${failed} échec(s)${RESET} sur ${total} vérifications`
  )
  if (failures.length) {
    console.log(`\n${RED}${BOLD}Échecs :${RESET}`)
    failures.forEach(f => console.log(`  ${RED}•${RESET} ${f}`))
    process.exitCode = 1
  } else {
    console.log(`${GREEN}Tous les points d'entrée répondent comme attendu.${RESET}`)
  }
}

main().catch(e => {
  console.error(`\n${RED}Le script a échoué : ${e.message}${RESET}`)
  console.error(e)
  process.exitCode = 1
})
