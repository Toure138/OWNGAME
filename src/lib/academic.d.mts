export type DegreeCode = 'CEP' | 'BEPC' | 'BAC' | 'LICENCE' | 'MASTER' | 'DOCTORAT'

export interface Degree {
  code: DegreeCode
  name: string
  short: string
  holder: string
  school: string
  icon: string
  color: string
  questions: number
  passRate: number
  timer: number
  share: number
}

export interface Mention {
  code: 'EXCELLENT' | 'TRES_BIEN' | 'BIEN' | 'ASSEZ_BIEN' | 'PASSABLE'
  label: string
  min: number
}

export declare const DEGREES: Degree[]
export declare const DEGREE_CODES: DegreeCode[]
export declare const DEFAULT_LEVEL: DegreeCode
export declare const MENTIONS: Mention[]

export declare function getDegree(code: string | null | undefined): Degree | null
export declare function degreeIndex(code: string | null | undefined): number
export declare function nextDegree(code: string | null | undefined): Degree | null
export declare function mentionFor(percent: number): Mention
export declare function holderTitle(degreeCode: string | null | undefined): string
export declare function xpForDegree(code: string | null | undefined): number

export interface ScorableQuestion {
  text?: string | null
  difficulty?: string | null
  propositionA?: string | null
  propositionB?: string | null
  propositionC?: string | null
  propositionD?: string | null
}

export declare function difficultyScore(question: ScorableQuestion): number
export declare function levelForSingleQuestion(question: ScorableQuestion): DegreeCode
