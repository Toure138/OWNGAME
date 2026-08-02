'use client'

// Effets sonores synthétisés par l'API Web Audio.
//
// Aucun fichier audio n'est téléchargé : les sons sont générés à la volée, ce
// qui évite d'alourdir le bundle et supprime toute latence de chargement au
// premier clic.

type SoundName =
  | 'tick'
  | 'correct'
  | 'wrong'
  | 'timeout'
  | 'invite'
  | 'start'
  | 'victory'
  | 'defeat'
  | 'click'

let context: AudioContext | null = null
let enabled = true

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
  }
  // Les navigateurs suspendent le contexte tant qu'aucune interaction n'a eu
  // lieu ; on le relance à la première tentative de lecture.
  if (context.state === 'suspended') void context.resume()
  return context
}

export function setSoundEnabled(value: boolean) {
  enabled = value
}

export function isSoundEnabled() {
  return enabled
}

interface Note {
  frequency: number
  /** Décalage du début, en secondes. */
  at: number
  duration: number
  type?: OscillatorType
  gain?: number
}

function playNotes(notes: Note[]) {
  if (!enabled) return
  const ctx = getContext()
  if (!ctx) return

  const now = ctx.currentTime
  for (const note of notes) {
    const oscillator = ctx.createOscillator()
    const amplifier = ctx.createGain()
    oscillator.type = note.type || 'sine'
    oscillator.frequency.setValueAtTime(note.frequency, now + note.at)

    const peak = note.gain ?? 0.12
    // Enveloppe attaque/extinction : sans elle, chaque note produit un clic.
    amplifier.gain.setValueAtTime(0.0001, now + note.at)
    amplifier.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.012)
    amplifier.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.duration)

    oscillator.connect(amplifier)
    amplifier.connect(ctx.destination)
    oscillator.start(now + note.at)
    oscillator.stop(now + note.at + note.duration + 0.02)
  }
}

const LIBRARY: Record<SoundName, Note[]> = {
  click: [{ frequency: 660, at: 0, duration: 0.05, type: 'triangle', gain: 0.05 }],
  tick: [{ frequency: 880, at: 0, duration: 0.045, type: 'square', gain: 0.04 }],
  correct: [
    { frequency: 587.33, at: 0, duration: 0.12, type: 'triangle' },
    { frequency: 880, at: 0.09, duration: 0.18, type: 'triangle' },
  ],
  wrong: [
    { frequency: 196, at: 0, duration: 0.16, type: 'sawtooth', gain: 0.08 },
    { frequency: 147, at: 0.12, duration: 0.22, type: 'sawtooth', gain: 0.08 },
  ],
  timeout: [
    { frequency: 330, at: 0, duration: 0.14, type: 'square', gain: 0.07 },
    { frequency: 247, at: 0.13, duration: 0.2, type: 'square', gain: 0.07 },
  ],
  invite: [
    { frequency: 784, at: 0, duration: 0.11, type: 'sine' },
    { frequency: 1046, at: 0.11, duration: 0.16, type: 'sine' },
  ],
  start: [
    { frequency: 523.25, at: 0, duration: 0.1, type: 'triangle' },
    { frequency: 659.25, at: 0.1, duration: 0.1, type: 'triangle' },
    { frequency: 783.99, at: 0.2, duration: 0.22, type: 'triangle' },
  ],
  victory: [
    { frequency: 523.25, at: 0, duration: 0.13, type: 'triangle' },
    { frequency: 659.25, at: 0.13, duration: 0.13, type: 'triangle' },
    { frequency: 783.99, at: 0.26, duration: 0.13, type: 'triangle' },
    { frequency: 1046.5, at: 0.39, duration: 0.34, type: 'triangle' },
  ],
  defeat: [
    { frequency: 392, at: 0, duration: 0.17, type: 'sine' },
    { frequency: 329.63, at: 0.17, duration: 0.17, type: 'sine' },
    { frequency: 261.63, at: 0.34, duration: 0.38, type: 'sine' },
  ],
}

export function playSound(name: SoundName) {
  try {
    playNotes(LIBRARY[name])
  } catch {
    // L'audio est un agrément : une erreur ne doit jamais interrompre le jeu.
  }
}
