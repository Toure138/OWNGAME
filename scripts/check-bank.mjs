// Contrôle qualité de la banque de questions.
// Usage : node scripts/check-bank.mjs
import { CATEGORIES, bankStats, toQuestion, getAllQuestions } from '../data/index.mjs'
import { assignAcademicLevels } from '../data/levels.mjs'
import { DEGREES, DEGREE_CODES } from '../src/lib/academic.mjs'

const errors = []
const warnings = []
const seen = new Map()

for (const cat of CATEGORIES) {
  cat.questions.forEach((tuple, i) => {
    const where = `${cat.name} #${i + 1}`
    if (!Array.isArray(tuple) || tuple.length < 7) {
      errors.push(`${where} : tuple mal formé (${tuple?.length} éléments, 7 minimum)`)
      return
    }
    const q = toQuestion(tuple, cat.name)
    if (!q.text || q.text.length < 8) errors.push(`${where} : énoncé trop court`)
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) errors.push(`${where} : bonne réponse invalide (${q.correctAnswer})`)
    const props = [q.propositionA, q.propositionB, q.propositionC, q.propositionD]
    if (props.some(p => !p || !String(p).trim())) errors.push(`${where} : proposition vide`)
    if (new Set(props.map(p => String(p).toLowerCase().trim())).size !== 4) errors.push(`${where} : propositions dupliquées`)
    if (!['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)) errors.push(`${where} : difficulté invalide`)
    // Le palier est facultatif ; une valeur mal orthographiée serait en
    // revanche ignorée en silence par le classement, et la question se
    // retrouverait dans un palier arbitraire.
    if (q.academicLevel && !DEGREE_CODES.includes(q.academicLevel)) {
      errors.push(`${where} : palier inconnu (${q.academicLevel})`)
    }
    const key = q.text.toLowerCase().replace(/\s+/g, ' ').trim()
    if (seen.has(key)) errors.push(`${where} : énoncé dupliqué avec ${seen.get(key)}`)
    else seen.set(key, where)
  })
}

const stats = bankStats()
const target = 50
for (const c of stats.perCategory) {
  if (c.count < target) warnings.push(`${c.name} : ${c.count} questions (< ${target})`)
}

// Répartition des bonnes réponses APRÈS permutation : une distribution trop
// déséquilibrée rendrait le jeu devinable.
const letters = { A: 0, B: 0, C: 0, D: 0 }
for (const cat of CATEGORIES) {
  for (const t of cat.questions) {
    const q = toQuestion(t, cat.name)
    letters[q.correctAnswer]++
    // La permutation doit préserver le texte de la bonne réponse d'origine.
    const expected = t[1 + ['A', 'B', 'C', 'D'].indexOf(t[5])]
    const got = q[`proposition${q.correctAnswer}`]
    if (expected !== got) errors.push(`${cat.name} « ${t[0].slice(0, 40)}… » : permutation incohérente`)
  }
}
const maxShare = Math.max(...Object.values(letters)) / stats.total
if (maxShare > 0.35) warnings.push(`Répartition des bonnes réponses déséquilibrée (${Math.round(maxShare * 100)} % sur une seule lettre)`)

// Répartition en paliers académiques : un palier trop maigre rendrait son
// examen répétitif, et le signaler ici évite de le découvrir en jouant.
const levels = assignAcademicLevels(getAllQuestions())
const perLevel = new Map(DEGREES.map(d => [d.code, 0]))
for (const level of levels.values()) perLevel.set(level, (perLevel.get(level) || 0) + 1)
for (const degree of DEGREES) {
  const count = perLevel.get(degree.code) || 0
  if (count < degree.questions * 2) {
    warnings.push(
      `Palier ${degree.short} : ${count} questions pour un examen de ${degree.questions} — trop peu pour varier les tentatives`
    )
  }
}

console.log('╭─ Banque de questions ─────────────────────────────')
console.log(`│ Catégories : ${stats.categories}`)
console.log(`│ Questions  : ${stats.total}`)
console.log(`│ Réponses   : A=${letters.A} B=${letters.B} C=${letters.C} D=${letters.D}`)
console.log('├─ Paliers du cursus ───────────────────────────────')
for (const degree of DEGREES) {
  const count = perLevel.get(degree.code) || 0
  console.log(
    `│ ${degree.short.padEnd(30)} ${String(count).padStart(4)}` +
      `   (examen : ${degree.questions} questions)`
  )
}
console.log('├─ Détail par catégorie ────────────────────────────')
for (const c of stats.perCategory) console.log(`│ ${c.name.padEnd(30)} ${String(c.count).padStart(4)}`)
console.log('╰───────────────────────────────────────────────────')

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} avertissement(s) :`)
  warnings.forEach(w => console.log(`   - ${w}`))
}
if (errors.length) {
  console.error(`\n❌ ${errors.length} erreur(s) :`)
  errors.slice(0, 40).forEach(e => console.error(`   - ${e}`))
  if (errors.length > 40) console.error(`   … et ${errors.length - 40} autres`)
  process.exit(1)
}
console.log('\n✅ Banque valide.')
