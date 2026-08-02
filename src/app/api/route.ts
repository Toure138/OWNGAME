import { ok } from '@/lib/api'

export const runtime = 'nodejs'

// GET /api — index des points d'entrée, utile pour explorer l'API et pour les
// tests de bout en bout.
export async function GET() {
  return ok({
    name: 'Qui veut gagner 20 millions ? — API',
    version: '2.0.0',
    endpoints: {
      health: { 'GET /api/health': 'état du service et de la base' },
      auth: {
        'POST /api/auth/register': 'création de compte',
        'POST /api/auth/login': 'connexion',
        'GET /api/auth/me': 'profil courant (authentifié)',
        'PATCH /api/auth/profile': 'mise à jour du profil et du mot de passe',
      },
      contenu: {
        'GET /api/categories': 'catégories et nombre de questions',
        'GET /api/questions': 'banque de questions (authentifié)',
        'GET /api/questions/random': 'tirage aléatoire (authentifié)',
      },
      jeu: {
        'GET /api/games': 'détail d’une partie (?id=…)',
        'GET /api/games/history': 'historique et statistiques du joueur',
        'GET /api/leaderboard': 'classements (scope=global|national|weekly|monthly|yearly)',
        'GET /api/achievements': 'succès du joueur',
        'GET /api/notifications': 'notifications',
        'PATCH /api/notifications': 'marquer comme lu (?id=… ou ?all=true)',
        'DELETE /api/notifications': 'supprimer (?id=… ou ?all=true)',
      },
      tempsReel: {
        'POST /api/realtime/join': 'entrer dans le salon',
        'POST /api/realtime/poll': 'récupérer les événements',
        'POST /api/realtime/leave': 'quitter le salon',
        'POST /api/realtime/invite': 'défier un joueur',
        'DELETE /api/realtime/invite': 'annuler une invitation',
        'POST /api/realtime/invite-respond': 'accepter ou refuser',
        'POST /api/realtime/game-start': 'lancer la partie',
        'POST /api/realtime/game-answer': 'répondre à la question courante',
        'POST /api/realtime/game-chat': 'envoyer un message',
        'POST /api/realtime/game-leave': 'abandonner',
      },
      administration: {
        'GET /api/admin/stats': 'tableau de bord',
        'GET|PATCH|DELETE /api/admin/users': 'gestion des joueurs',
        'GET|POST|PATCH|DELETE /api/admin/questions': 'gestion des questions',
        'GET|POST|PATCH|DELETE /api/admin/categories': 'gestion des catégories',
        'POST /api/admin/import': 'import en masse de questions',
      },
    },
  })
}
