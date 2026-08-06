export interface ResolvedDatabaseUrl {
  url: string | null
  source: string | null
  reason: 'ok' | 'sqlite' | 'missing'
}

export declare function resolveDatabaseUrl(
  env?: Record<string, string | undefined>
): ResolvedDatabaseUrl

export declare function maskUrl(url: string): string

export declare function explainMissingUrl(
  reason: 'ok' | 'sqlite' | 'missing',
  env?: Record<string, string | undefined>
): string
