import type { User } from '@prisma/client'

/**
 * Projection publique d'un utilisateur.
 * Centralisée pour garantir qu'aucune route ne renvoie `passwordHash`.
 */
export function publicUser(user: User, extra: { rank?: number | null } = {}) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    pseudo: user.pseudo,
    fullName: user.fullName,
    country: user.country,
    avatarUrl: user.avatarUrl,
    role: user.role,
    banned: user.banned,
    level: user.level,
    xp: user.xp,
    gamesPlayed: user.gamesPlayed,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    totalScore: user.totalScore,
    bestStreak: user.bestStreak,
    highestDegree: user.highestDegree,
    examsPassed: user.examsPassed,
    soloGames: user.soloGames,
    createdAt: user.createdAt,
    ...(extra.rank !== undefined ? { rank: extra.rank } : {}),
  }
}

export type PublicUser = ReturnType<typeof publicUser>
