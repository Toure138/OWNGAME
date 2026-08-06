// Réglages de partie partagés entre le serveur et l'interface.
//
// Ce module n'importe rien : c'est sa raison d'être. Les mêmes constantes
// vivent dans `GAME_CONFIG`, mais `realtime.ts` tire avec lui le moteur de jeu
// et, de proche en proche, le client Prisma. Un composant client qui importerait
// `GAME_CONFIG` embarquerait tout cela dans son bundle.

/** Longueurs de partie proposées au joueur, en nombre de questions. */
export const QUESTION_CHOICES = [6, 10, 20, 30, 50]

export const DEFAULT_QUESTIONS = 20

/**
 * Bornes appliquées à toute valeur reçue par l'API.
 *
 * Le minimum garantit qu'une partie reste une partie ; le maximum évite qu'un
 * appel direct ne demande dix mille questions et n'immobilise une session.
 */
export const MIN_QUESTIONS = 6
export const MAX_QUESTIONS = 50

/** Durée approximative d'une partie, pour l'afficher avant de la lancer. */
export function estimatedMinutes(questionCount: number): number {
  // Vingt secondes de réflexion, plus l'affichage du résultat entre deux tours.
  return Math.max(1, Math.round((questionCount * 23) / 60))
}
