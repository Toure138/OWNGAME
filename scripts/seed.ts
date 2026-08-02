// Seed script: populates categories, questions, admin user, demo players.
// Run with: bun run scripts/seed.ts

import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  console.log('🌱 Seeding database...')

  // ----- Categories -----
  const categories = [
    { name: 'Mathématiques', icon: 'Calculator', color: '#ef4444', description: 'Algèbre, géométrie, analyse' },
    { name: 'Physique', icon: 'Atom', color: '#f97316', description: 'Mécanique, électricité, optique' },
    { name: 'Chimie', icon: 'FlaskConical', color: '#eab308', description: 'Chimie organique et inorganique' },
    { name: 'Biologie', icon: 'Dna', color: '#22c55e', description: 'Cellules, génétique, évolution' },
    { name: 'Sciences de la Terre', icon: 'Globe', color: '#14b8a6', description: 'Géologie, climat, océans' },
    { name: 'Informatique', icon: 'Cpu', color: '#06b6d4', description: 'Programmation, algorithmes, réseaux' },
    { name: 'Intelligence artificielle', icon: 'BrainCircuit', color: '#3b82f6', description: 'ML, deep learning, LLMs' },
    { name: 'Télécommunications', icon: 'Radio', color: '#8b5cf6', description: 'Réseaux mobiles, fibre, 5G' },
    { name: 'Histoire', icon: 'Landmark', color: '#ec4899', description: 'Antiquité, moyen-âge, moderne' },
    { name: 'Géographie', icon: 'Map', color: '#f43f5e', description: 'Pays, capitales, reliefs' },
    { name: 'Politique', icon: 'Landmark', color: '#84cc16', description: 'Institutions, doctrines' },
    { name: 'Économie', icon: 'TrendingUp', color: '#f59e0b', description: 'Macro, micro, finance' },
    { name: 'Culture générale', icon: 'BookOpen', color: '#10b981', description: 'Savoirs transversaux' },
    { name: 'Sport', icon: 'Trophy', color: '#0891b2', description: 'Football, JO, records' },
    { name: 'Cinéma', icon: 'Clapperboard', color: '#7c3aed', description: 'Films, réalisateurs, oscars' },
    { name: 'Musique', icon: 'Music', color: '#db2777', description: 'Genres, artistes, instruments' },
    { name: 'Littérature', icon: 'BookMarked', color: '#92400e', description: 'Romans, auteurs, courants' },
    { name: 'Technologie', icon: 'Rocket', color: '#0284c7', description: 'Innovations, gadgets, sciences appliquées' },
    { name: 'Santé', icon: 'HeartPulse', color: '#dc2626', description: 'Médecine, nutrition, bien-être' },
    { name: 'Environnement', icon: 'Leaf', color: '#16a34a', description: 'Climat, biodiversité, énergie' },
  ]

  const catRecords: Record<string, any> = {}
  for (const c of categories) {
    const existing = await db.category.findUnique({ where: { name: c.name } })
    if (existing) {
      catRecords[c.name] = existing
    } else {
      catRecords[c.name] = await db.category.create({ data: c })
    }
  }
  console.log(`✓ ${Object.keys(catRecords).length} catégories`)

  // ----- Questions -----
  const questions: Array<{ cat: string; text: string; A: string; B: string; C: string; D: string; correct: 'A'|'B'|'C'|'D'; explanation?: string; difficulty?: string }> = [
    // Mathématiques
    { cat: 'Mathématiques', text: 'Combien font 7 × 8 ?', A: '54', B: '56', C: '64', D: '58', correct: 'B', explanation: '7 × 8 = 56', difficulty: 'EASY' },
    { cat: 'Mathématiques', text: 'Que vaut la racine carrée de 144 ?', A: '10', B: '11', C: '12', D: '14', correct: 'C', explanation: '12 × 12 = 144', difficulty: 'EASY' },
    { cat: 'Mathématiques', text: 'Quel est le résultat de 15² ?', A: '205', B: '215', C: '225', D: '245', correct: 'C', explanation: '15 × 15 = 225', difficulty: 'EASY' },
    { cat: 'Mathématiques', text: 'Combien de côtés possède un hexagone ?', A: '5', B: '6', C: '7', D: '8', correct: 'B', difficulty: 'EASY' },
    { cat: 'Mathématiques', text: 'Que vaut π (arrondi à 2 décimales) ?', A: '3,14', B: '3,16', C: '3,12', D: '3,18', correct: 'A', difficulty: 'EASY' },
    { cat: 'Mathématiques', text: 'Quel est le PGCD de 24 et 36 ?', A: '6', B: '8', C: '12', D: '4', correct: 'C', explanation: 'Les diviseurs communs sont 1, 2, 3, 4, 6, 12. Le plus grand est 12.', difficulty: 'MEDIUM' },
    { cat: 'Mathématiques', text: 'Combien font log₁₀(1000) ?', A: '2', B: '3', C: '10', D: '100', correct: 'B', explanation: '10³ = 1000', difficulty: 'MEDIUM' },
    { cat: 'Mathématiques', text: 'Que vaut la somme des angles d\'un triangle ?', A: '90°', B: '180°', C: '270°', D: '360°', correct: 'B', difficulty: 'EASY' },
    { cat: 'Mathématiques', text: 'Combien de nombres premiers y a-t-il entre 1 et 10 ?', A: '3', B: '4', C: '5', D: '6', correct: 'B', explanation: '2, 3, 5, 7', difficulty: 'MEDIUM' },
    { cat: 'Mathématiques', text: 'Que vaut 0! (factorielle de zéro) ?', A: '0', B: '1', C: 'Indéfini', D: '∞', correct: 'B', difficulty: 'HARD' },

    // Physique
    { cat: 'Physique', text: 'Quelle est l\'unité de la force dans le SI ?', A: 'Joule', B: 'Pascal', C: 'Newton', D: 'Watt', correct: 'C', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Quelle est la vitesse de la lumière dans le vide (environ) ?', A: '300 000 km/s', B: '150 000 km/s', C: '30 000 km/s', D: '3 000 000 km/s', correct: 'A', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Qui a formulé la théorie de la relativité restreinte ?', A: 'Isaac Newton', B: 'Albert Einstein', C: 'Niels Bohr', D: 'Galilée', correct: 'B', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Quel est le symbole de l\'accélération de la pesanteur terrestre ?', A: 'p', B: 'm', C: 'g', D: 'G', correct: 'C', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Quelle particule a une charge négative ?', A: 'Proton', B: 'Neutron', C: 'Électron', D: 'Photon', correct: 'C', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Que vaut g à la surface de la Terre (environ) ?', A: '9,81 m/s²', B: '8,91 m/s²', C: '10,81 m/s²', D: '9,18 m/s²', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Physique', text: 'Quelle est l\'unité de la résistance électrique ?', A: 'Volt', B: 'Ampère', C: 'Ohm', D: 'Watt', correct: 'C', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Qu\'est-ce que la loi d\'Ohm ?', A: 'U = R/I', B: 'U = R × I', C: 'U = R + I', D: 'U = I/R', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Physique', text: 'Quel est le point de fusion de la glace à pression atmosphérique ?', A: '-10°C', B: '0°C', C: '10°C', D: '100°C', correct: 'B', difficulty: 'EASY' },
    { cat: 'Physique', text: 'Qu\'est-ce qu\'un quark ?', A: 'Une particule élémentaire', B: 'Un atome', C: 'Une molécule', D: 'Un rayon', correct: 'A', difficulty: 'HARD' },

    // Chimie
    { cat: 'Chimie', text: 'Quel est le symbole chimique de l\'or ?', A: 'Au', B: 'Ag', C: 'Or', D: 'Gd', correct: 'A', difficulty: 'EASY' },
    { cat: 'Chimie', text: 'Combien d\'éléments contient le tableau périodique (standard) ?', A: '92', B: '108', C: '118', D: '126', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Chimie', text: 'Quelle est la formule de l\'eau ?', A: 'CO₂', B: 'H₂O', C: 'O₂', D: 'H₂O₂', correct: 'B', difficulty: 'EASY' },
    { cat: 'Chimie', text: 'Quel gaz est majoritaire dans l\'air que nous respirons ?', A: 'Oxygène', B: 'Azote', C: 'CO₂', D: 'Hydrogène', correct: 'B', explanation: '~78% azote, ~21% oxygène', difficulty: 'EASY' },
    { cat: 'Chimie', text: 'Quel est le pH de l\'eau pure à 25°C ?', A: '0', B: '7', C: '14', D: '1', correct: 'B', difficulty: 'EASY' },
    { cat: 'Chimie', text: 'Quel est l\'élément le plus abondant dans l\'univers ?', A: 'Oxygène', B: 'Carbone', C: 'Hydrogène', D: 'Hélium', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Chimie', text: 'Combien d\'atomes de carbone contient une molécule de glucose (C₆H₁₂O₆) ?', A: '3', B: '6', C: '12', D: '24', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Chimie', text: 'Quel métal est liquide à température ambiante ?', A: 'Sodium', B: 'Mercure', C: 'Plomb', D: 'Étain', correct: 'B', difficulty: 'EASY' },
    { cat: 'Chimie', text: 'Que signifie "NaCl" ?', A: 'Acide nitrique', B: 'Chlorure de sodium', C: 'Nitrate de calcium', D: 'Néon', correct: 'B', difficulty: 'EASY' },
    { cat: 'Chimie', text: 'Quel est le numéro atomique du carbone ?', A: '4', B: '6', C: '8', D: '12', correct: 'B', difficulty: 'HARD' },

    // Biologie
    { cat: 'Biologie', text: 'Combien de chromosomes possède l\'être humain ?', A: '23', B: '46', C: '48', D: '44', correct: 'B', difficulty: 'EASY' },
    { cat: 'Biologie', text: 'Quel organe pompe le sang ?', A: 'Le foie', B: 'Le cœur', C: 'Le poumon', D: 'Le rein', correct: 'B', difficulty: 'EASY' },
    { cat: 'Biologie', text: 'Quelle est la plus grande cellule du corps humain ?', A: 'Le neurone', B: 'L\'ovule', C: 'Le globule rouge', D: 'La cellule musculaire', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Biologie', text: 'Que signifie ADN ?', A: 'Acide désoxyribonucléique', B: 'Acide aminé naturel', C: 'Antigène nucléaire', D: 'Acide dynamique', correct: 'A', difficulty: 'EASY' },
    { cat: 'Biologie', text: 'Quel est l\'organe de la photosynthèse ?', A: 'La racine', B: 'La feuille', C: 'La tige', D: 'La fleur', correct: 'B', difficulty: 'EASY' },
    { cat: 'Biologie', text: 'Combien d\'os a un adulte humain ?', A: '186', B: '206', C: '226', D: '246', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Biologie', text: 'Quel groupe sanguin est donneur universel ?', A: 'A+', B: 'B+', C: 'O-', D: 'AB+', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Biologie', text: 'Quelle vitamine est synthétisée grâce au soleil ?', A: 'Vitamine A', B: 'Vitamine B12', C: 'Vitamine C', D: 'Vitamine D', correct: 'D', difficulty: 'EASY' },
    { cat: 'Biologie', text: 'Quel est le plus grand organe du corps humain ?', A: 'Le foie', B: 'Le cerveau', C: 'La peau', D: 'Les poumons', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Biologie', text: 'Combien de types de cônes possède l\'œil humain (vision des couleurs) ?', A: '1', B: '2', C: '3', D: '4', correct: 'C', explanation: 'Rouge, vert, bleu', difficulty: 'HARD' },

    // Sciences de la Terre
    { cat: 'Sciences de la Terre', text: 'Quelle est la planète la plus proche du Soleil ?', A: 'Vénus', B: 'Mercure', C: 'Mars', D: 'Terre', correct: 'B', difficulty: 'EASY' },
    { cat: 'Sciences de la Terre', text: 'Combien de continents y a-t-il sur Terre ?', A: '5', B: '6', C: '7', D: '8', correct: 'C', difficulty: 'EASY' },
    { cat: 'Sciences de la Terre', text: 'Quelle est la cause principale des marées ?', A: 'Le vent', B: 'La Lune', C: 'Le Soleil', D: 'Les courants', correct: 'B', difficulty: 'EASY' },
    { cat: 'Sciences de la Terre', text: 'Combien de couches principales compose l\'atmosphère terrestre ?', A: '3', B: '4', C: '5', D: '6', correct: 'C', explanation: 'Troposphère, stratosphère, mésosphère, thermosphère, exosphère', difficulty: 'MEDIUM' },
    { cat: 'Sciences de la Terre', text: 'Quel est le plus grand océan du monde ?', A: 'Atlantique', B: 'Indien', C: 'Pacifique', D: 'Arctique', correct: 'C', difficulty: 'EASY' },
    { cat: 'Sciences de la Terre', text: 'Qu\'est-ce que la tectonique des plaques ?', A: 'Une théorie musicale', B: 'Le mouvement des plaques lithosphériques', C: 'Un phénomène météo', D: 'Une maladie des plantes', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Sciences de la Terre', text: 'Quel gaz contribue le plus à l\'effet de serre ?', A: 'Oxygène', B: 'Dioxyde de carbone', C: 'Azote', D: 'Hélium', correct: 'B', difficulty: 'EASY' },
    { cat: 'Sciences de la Terre', text: 'Combien de temps met la Terre pour faire le tour du Soleil ?', A: '24 heures', B: '30 jours', C: '365 jours', D: '7 ans', correct: 'C', difficulty: 'EASY' },
    { cat: 'Sciences de la Terre', text: 'Quelle est la couche la plus externe de la Terre ?', A: 'Le noyau', B: 'Le manteau', C: 'La croûte', D: 'La lithosphère', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Sciences de la Terre', text: 'Quel est l\'âge estimé de la Terre ?', A: '1 milliard d\'années', B: '2,5 milliards d\'années', C: '4,5 milliards d\'années', D: '10 milliards d\'années', correct: 'C', difficulty: 'HARD' },

    // Informatique
    { cat: 'Informatique', text: 'Que signifie CPU ?', A: 'Central Processing Unit', B: 'Computer Power Unit', C: 'Control Process Unit', D: 'Central Program Unit', correct: 'A', difficulty: 'EASY' },
    { cat: 'Informatique', text: 'Combien de bits y a-t-il dans un octet ?', A: '4', B: '8', C: '16', D: '32', correct: 'B', difficulty: 'EASY' },
    { cat: 'Informatique', text: 'Qui a inventé le World Wide Web ?', A: 'Bill Gates', B: 'Steve Jobs', C: 'Tim Berners-Lee', D: 'Linus Torvalds', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Informatique', text: 'Quel langage est principalement utilisé pour le développement Android natif ?', A: 'Swift', B: 'Kotlin', C: 'Ruby', D: 'PHP', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Informatique', text: 'Que signifie "HTTP" ?', A: 'HyperText Transfer Protocol', B: 'High Tech Transfer Protocol', C: 'HyperText Transmission Process', D: 'Home Tool Transfer Protocol', correct: 'A', difficulty: 'EASY' },
    { cat: 'Informatique', text: 'Quelle est la complexité d\'une recherche dichotomique ?', A: 'O(n)', B: 'O(n log n)', C: 'O(log n)', D: 'O(1)', correct: 'C', difficulty: 'HARD' },
    { cat: 'Informatique', text: 'Que signifie "SQL" ?', A: 'Simple Query Language', B: 'Structured Query Language', C: 'Standard Question Language', D: 'Server Query Layer', correct: 'B', difficulty: 'EASY' },
    { cat: 'Informatique', text: 'Quel est le système de gestion de versions le plus utilisé ?', A: 'SVN', B: 'Mercurial', C: 'Git', D: 'Perforce', correct: 'C', difficulty: 'EASY' },
    { cat: 'Informatique', text: 'Que signifie "RAM" ?', A: 'Read Access Memory', B: 'Random Access Memory', C: 'Rapid Access Module', D: 'Run Access Memory', correct: 'B', difficulty: 'EASY' },
    { cat: 'Informatique', text: 'Qu\'est-ce qu\'une structure de données "LIFO" ?', A: 'Une file', B: 'Une pile', C: 'Un arbre', D: 'Un graphe', correct: 'B', difficulty: 'MEDIUM' },

    // Intelligence artificielle
    { cat: 'Intelligence artificielle', text: 'Que signifie "IA" ?', A: 'Informatique avancée', B: 'Intelligence artificielle', C: 'Interface applicative', D: 'Internet des objets', correct: 'B', difficulty: 'EASY' },
    { cat: 'Intelligence artificielle', text: 'Qui est considéré comme le père de l\'IA ?', A: 'Alan Turing', B: 'John McCarthy', C: 'Marvin Minsky', D: 'Geoffrey Hinton', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Intelligence artificielle', text: 'Qu\'est-ce que le "Machine Learning" ?', A: 'Une marque d\'ordinateur', B: 'L\'apprentissage automatique', C: 'Un système d\'exploitation', D: 'Un langage de programmation', correct: 'B', difficulty: 'EASY' },
    { cat: 'Intelligence artificielle', text: 'Qu\'est-ce qu\'un réseau de neurones artificiels ?', A: 'Un réseau informatique', B: 'Un modèle inspiré du cerveau humain', C: 'Un protocole de communication', D: 'Un type de base de données', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Intelligence artificielle', text: 'Que signifie "LLM" ?', A: 'Large Language Model', B: 'Long Live Music', C: 'Low Level Memory', D: 'Local Logic Module', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Intelligence artificielle', text: 'Qu\'est-ce que le "Deep Learning" ?', A: 'L\'apprentissage en profondeur', B: 'Un sommeil profond', C: 'Une plongée sous-marine', D: 'Une méthode de méditation', correct: 'A', difficulty: 'EASY' },
    { cat: 'Intelligence artificielle', text: 'Qu\'est-ce que le "Test de Turing" ?', A: 'Un test de QI', B: 'Un test pour évaluer si une machine est intelligente', C: 'Un test de vitesse', D: 'Un test de sécurité réseau', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Intelligence artificielle', text: 'Quelle est la fonction d\'activation la plus courante dans les réseaux profonds ?', A: 'Sigmoïde', B: 'Tanh', C: 'ReLU', D: 'Lineaire', correct: 'C', difficulty: 'HARD' },
    { cat: 'Intelligence artificielle', text: 'Que signifie "GPT" ?', A: 'Generative Pre-trained Transformer', B: 'General Purpose Tool', C: 'Global Processing Time', D: 'Graph Processing Task', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Intelligence artificielle', text: 'Qu\'est-ce que "l\'overfitting" ?', A: 'Un modèle trop simple', B: 'Un modèle qui mémorise trop les données d\'entraînement', C: 'Une erreur réseau', D: 'Un bug de compilation', correct: 'B', difficulty: 'HARD' },

    // Télécommunications
    { cat: 'Télécommunications', text: 'Que signifie "5G" ?', A: '5 Gigaoctets', B: '5ᵉ génération de réseaux mobiles', C: '5 Groupes', D: '5 Gigahertz', correct: 'B', difficulty: 'EASY' },
    { cat: 'Télécommunications', text: 'Qu\'est-ce que la fibre optique transmet ?', A: 'De l\'électricité', B: 'De la lumière', C: 'Du son', D: 'Du gaz', correct: 'B', difficulty: 'EASY' },
    { cat: 'Télécommunications', text: 'Que signifie "Wi-Fi" ?', A: 'Wireless Fidelity', B: 'Wide Frequency', C: 'Wired Filter', D: 'Wireless Frequency', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Télécommunications', text: 'Quelle fréquence utilise le Bluetooth ?', A: '2,4 GHz', B: '5 GHz', C: '900 MHz', D: '60 GHz', correct: 'A', difficulty: 'HARD' },
    { cat: 'Télécommunications', text: 'Que signifie "SMS" ?', A: 'Short Message Service', B: 'Send My SMS', C: 'Standard Mobile Service', D: 'Simple Message System', correct: 'A', difficulty: 'EASY' },
    { cat: 'Télécommunications', text: 'Qu\'est-ce que la "LTE" ?', A: 'Long Term Evolution', B: 'Low Transmission Energy', C: 'Local Terminal Equipment', D: 'Long Text Exchange', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Télécommunications', text: 'Quelle est la portée typique du Bluetooth classique ?', A: '1 mètre', B: '10 mètres', C: '100 mètres', D: '1 kilomètre', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Télécommunications', text: 'Que signifie "IP" dans "adresse IP" ?', A: 'Internet Protocol', B: 'International Phone', C: 'Internal Process', D: 'Information Provider', correct: 'A', difficulty: 'EASY' },

    // Histoire
    { cat: 'Histoire', text: 'En quelle année a eu lieu la Révolution française ?', A: '1689', B: '1789', C: '1889', D: '1989', correct: 'B', difficulty: 'EASY' },
    { cat: 'Histoire', text: 'Qui était le premier empereur romain ?', A: 'Jules César', B: 'Auguste', C: 'Néron', D: 'Trajan', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Histoire', text: 'Quand a pris fin la Seconde Guerre mondiale ?', A: '1944', B: '1945', C: '1946', D: '1947', correct: 'B', difficulty: 'EASY' },
    { cat: 'Histoire', text: 'Qui a découvert l\'Amérique en 1492 ?', A: 'Magellan', B: 'Christophe Colomb', C: 'Vasco de Gama', D: 'Jacques Cartier', correct: 'B', difficulty: 'EASY' },
    { cat: 'Histoire', text: 'Combien de dynasties impériales a connu la Chine ?', A: '7', B: '13', C: '21', D: '24', correct: 'B', difficulty: 'HARD' },
    { cat: 'Histoire', text: 'En quelle année a été construite la Tour Eiffel ?', A: '1879', B: '1889', C: '1899', D: '1909', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Histoire', text: 'Qui a écrit le Manifeste du Parti communiste ?', A: 'Lénine', B: 'Staline', C: 'Marx et Engels', D: 'Mao', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Histoire', text: 'Quand est tombé le mur de Berlin ?', A: '1987', B: '1989', C: '1991', D: '1993', correct: 'B', difficulty: 'EASY' },
    { cat: 'Histoire', text: 'Qui a fondé l\'Empire mongol ?', A: 'Kubilaï Khan', B: 'Gengis Khan', C: 'Tamerlan', D: 'Attila', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Histoire', text: 'En quelle année l\'homme a-t-il marché sur la Lune pour la première fois ?', A: '1965', B: '1969', C: '1972', D: '1975', correct: 'B', difficulty: 'EASY' },

    // Géographie
    { cat: 'Géographie', text: 'Quelle est la capitale de l\'Australie ?', A: 'Sydney', B: 'Melbourne', C: 'Canberra', D: 'Perth', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Géographie', text: 'Quel est le plus long fleuve du monde ?', A: 'Amazone', B: 'Nil', C: 'Mississippi', D: 'Yangtze', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Géographie', text: 'Combien de pays y a-t-il en Afrique ?', A: '44', B: '54', C: '64', D: '74', correct: 'B', difficulty: 'HARD' },
    { cat: 'Géographie', text: 'Quelle est la capitale du Canada ?', A: 'Toronto', B: 'Montréal', C: 'Vancouver', D: 'Ottawa', correct: 'D', difficulty: 'MEDIUM' },
    { cat: 'Géographie', text: 'Dans quel pays se trouve le mont Everest ?', A: 'Inde', B: 'Chine', C: 'Népal', D: 'Pakistan', correct: 'C', difficulty: 'EASY' },
    { cat: 'Géographie', text: 'Quel est le plus petit pays du monde ?', A: 'Monaco', B: 'Saint-Marin', C: 'Vatican', D: 'Liechtenstein', correct: 'C', difficulty: 'EASY' },
    { cat: 'Géographie', text: 'Quelle est la capitale du Brésil ?', A: 'Rio de Janeiro', B: 'São Paulo', C: 'Brasília', D: 'Salvador', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Géographie', text: 'Quel détroit sépare l\'Europe de l\'Afrique ?', A: 'Détroit de Béring', B: 'Détroit de Gibraltar', C: 'Détroit de Magellan', D: 'Canal de Suez', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Géographie', text: 'Combien d\'États comptent les États-Unis ?', A: '48', B: '50', C: '52', D: '54', correct: 'B', difficulty: 'EASY' },
    { cat: 'Géographie', text: 'Quel désert est le plus grand du monde ?', A: 'Sahara', B: 'Gobi', C: 'Désert d\'Antarctique', D: 'Kalahari', correct: 'C', difficulty: 'HARD' },

    // Politique
    { cat: 'Politique', text: 'Qu\'est-ce qu\'une démocratie ?', A: 'Le pouvoir du peuple', B: 'Le pouvoir d\'un seul', C: 'Le pouvoir des riches', D: 'Le pouvoir militaire', correct: 'A', difficulty: 'EASY' },
    { cat: 'Politique', text: 'Combien de présidents a connus la Ve République française (avant 2024) ?', A: '6', B: '7', C: '8', D: '9', correct: 'C', difficulty: 'HARD' },
    { cat: 'Politique', text: 'Quel est le siège de l\'ONU ?', A: 'Genève', B: 'Bruxelles', C: 'New York', D: 'Paris', correct: 'C', difficulty: 'EASY' },
    { cat: 'Politique', text: 'Combien de membres compte le Parlement européen (environ) ?', A: '350', B: '500', C: '720', D: '900', correct: 'C', difficulty: 'HARD' },
    { cat: 'Politique', text: 'Qu\'est-ce qu\'une monarchie constitutionnelle ?', A: 'Un roi sans pouvoir', B: 'Un roi avec pouvoir limité par une constitution', C: 'Une république', D: 'Une dictature', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Politique', text: 'Quelle est la devise de la République française ?', A: 'Honneur et Patrie', B: 'Liberté, Égalité, Fraternité', C: 'Paix et Prospérité', D: 'Dieu et Roi', correct: 'B', difficulty: 'EASY' },

    // Économie
    { cat: 'Économie', text: 'Que signifie "PIB" ?', A: 'Produit Intérieur Brut', B: 'Pourcentage d\'Investissement Brut', C: 'Plan Industriel Budgetaire', D: 'Produit Industriel Brut', correct: 'A', difficulty: 'EASY' },
    { cat: 'Économie', text: 'Qu\'est-ce que l\'inflation ?', A: 'Une hausse généralisée des prix', B: 'Une baisse des prix', C: 'Une monnaie forte', D: 'Une crise politique', correct: 'A', difficulty: 'EASY' },
    { cat: 'Économie', text: 'Qui a écrit "La Richesse des Nations" ?', A: 'Karl Marx', B: 'John Maynard Keynes', C: 'Adam Smith', D: 'Milton Friedman', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Économie', text: 'Qu\'est-ce que la BCE ?', A: 'Banque Centrale Européenne', B: 'Bureau Comptable Européen', C: 'Banque Commerciale Européenne', D: 'Bureau Central Économique', correct: 'A', difficulty: 'EASY' },
    { cat: 'Économie', text: 'Qu\'est-ce que le "libre-échange" ?', A: 'Échange sans barrières douanières', B: 'Échange gratuit', C: 'Échange entre particuliers', D: 'Échange local', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Économie', text: 'Que signifie "OPEC" ?', A: 'Organisation des Pays Exportateurs de Pétrole', B: 'Organisation Politique Européenne', C: 'Office Public Économique', D: 'Organisation des Pays Émergents', correct: 'A', difficulty: 'HARD' },

    // Culture générale
    { cat: 'Culture générale', text: 'Combien de couleurs y a-t-il dans un arc-en-ciel ?', A: '5', B: '6', C: '7', D: '8', correct: 'C', difficulty: 'EASY' },
    { cat: 'Culture générale', text: 'Quelle est la langue la plus parlée au monde (locuteurs natifs) ?', A: 'Anglais', B: 'Espagnol', C: 'Mandarin', D: 'Hindi', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Culture générale', text: 'Combien de jours compte une année bissextile ?', A: '364', B: '365', C: '366', D: '367', correct: 'C', difficulty: 'EASY' },
    { cat: 'Culture générale', text: 'Quelle est la monnaie du Japon ?', A: 'Yuan', B: 'Yen', C: 'Won', D: 'Rupee', correct: 'B', difficulty: 'EASY' },
    { cat: 'Culture générale', text: 'Combien de continents commencent par la lettre "A" ?', A: '2', B: '3', C: '4', D: '5', correct: 'C', explanation: 'Afrique, Amérique, Antarctique, Asie', difficulty: 'MEDIUM' },
    { cat: 'Culture générale', text: 'Quel instrument mesure la température ?', A: 'Baromètre', B: 'Thermomètre', C: 'Hygromètre', D: 'Anémomètre', correct: 'B', difficulty: 'EASY' },
    { cat: 'Culture générale', text: 'Combien de cordes a une guitare classique ?', A: '4', B: '5', C: '6', D: '7', correct: 'C', difficulty: 'EASY' },
    { cat: 'Culture générale', text: 'Quelle est la planète la plus éloignée du Soleil ?', A: 'Jupiter', B: 'Saturne', C: 'Uranus', D: 'Neptune', correct: 'D', difficulty: 'MEDIUM' },

    // Sport
    { cat: 'Sport', text: 'Combien de joueurs composent une équipe de football sur le terrain ?', A: '9', B: '10', C: '11', D: '12', correct: 'C', difficulty: 'EASY' },
    { cat: 'Sport', text: 'Tous les combien d\'années ont lieu les Jeux Olympiques d\'été ?', A: '2 ans', B: '3 ans', C: '4 ans', D: '5 ans', correct: 'C', difficulty: 'EASY' },
    { cat: 'Sport', text: 'Combien de points vaut un panier à 3 points au basketball ?', A: '2', B: '3', C: '4', D: '5', correct: 'B', difficulty: 'EASY' },
    { cat: 'Sport', text: 'Quel pays a gagné la Coupe du Monde de football 2018 ?', A: 'Brésil', B: 'Allemagne', C: 'France', D: 'Argentine', correct: 'C', difficulty: 'EASY' },
    { cat: 'Sport', text: 'Combien de joueurs y a-t-il dans une équipe de rugby à 15 ?', A: '11', B: '13', C: '15', D: '18', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Sport', text: 'Dans quel sport pratique-t-on le "serve" ?', A: 'Tennis', B: 'Football', C: 'Golf', D: 'Natation', correct: 'A', difficulty: 'EASY' },
    { cat: 'Sport', text: 'Combien de tours fait un pilote dans un Grand Prix de F1 (environ) ?', A: '20', B: '50', C: '100', D: '200', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Sport', text: 'Qui détient le record du monde du 100 m hommes (avant 2024) ?', A: 'Usain Bolt', B: 'Carl Lewis', C: 'Tyson Gay', D: 'Yohan Blake', correct: 'A', difficulty: 'MEDIUM' },

    // Cinéma
    { cat: 'Cinéma', text: 'Qui a réalisé le film "Inception" ?', A: 'Steven Spielberg', B: 'Christopher Nolan', C: 'Martin Scorsese', D: 'Quentin Tarantino', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Cinéma', text: 'Combien d\'Oscars le film "Titanic" (1997) a-t-il remportés ?', A: '7', B: '11', C: '13', D: '14', correct: 'B', difficulty: 'HARD' },
    { cat: 'Cinéma', text: 'Quel acteur joue le rôle principal dans "Forrest Gump" ?', A: 'Brad Pitt', B: 'Tom Hanks', C: 'Leonardo DiCaprio', D: 'Johnny Depp', correct: 'B', difficulty: 'EASY' },
    { cat: 'Cinéma', text: 'Quelle est la couleur de la voiture de James Bond la plus emblématique ?', A: 'Rouge', B: 'Noir', C: 'Argent', D: 'Vert', correct: 'C', explanation: 'Aston Martin DB5 argentée', difficulty: 'MEDIUM' },
    { cat: 'Cinéma', text: 'Qui a réalisé "Le Parrain" ?', A: 'Francis Ford Coppola', B: 'Martin Scorsese', C: 'Brian De Palma', D: 'Robert Altman', correct: 'A', difficulty: 'EASY' },
    { cat: 'Cinéma', text: 'Dans quelle ville se déroule le festival de Cannes ?', A: 'Nice', B: 'Marseille', C: 'Cannes', D: 'Paris', correct: 'C', difficulty: 'EASY' },
    { cat: 'Cinéma', text: 'Quel studio a produit "Toy Story" ?', A: 'Disney', B: 'Pixar', C: 'DreamWorks', D: 'Sony', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Cinéma', text: 'Qui a joué le Joker dans "The Dark Knight" (2008) ?', A: 'Joaquin Phoenix', B: 'Heath Ledger', C: 'Jack Nicholson', D: 'Jared Leto', correct: 'B', difficulty: 'EASY' },

    // Musique
    { cat: 'Musique', text: 'Combien de cordes a un violon ?', A: '3', B: '4', C: '5', D: '6', correct: 'B', difficulty: 'EASY' },
    { cat: 'Musique', text: 'Qui a composé la "Neuvième Symphonie" ?', A: 'Mozart', B: 'Beethoven', C: 'Bach', D: 'Chopin', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Musique', text: 'Combien de membres composait le groupe "The Beatles" ?', A: '3', B: '4', C: '5', D: '6', correct: 'B', difficulty: 'EASY' },
    { cat: 'Musique', text: 'Quel instrument a 88 touches ?', A: 'Guitare', B: 'Piano', C: 'Violon', D: 'Flûte', correct: 'B', difficulty: 'EASY' },
    { cat: 'Musique', text: 'Qui a chanté "Bohemian Rhapsody" ?', A: 'Led Zeppelin', B: 'Queen', C: 'The Who', D: 'Pink Floyd', correct: 'B', difficulty: 'EASY' },
    { cat: 'Musique', text: 'Combien de notes a la gamme chromatique occidentale ?', A: '7', B: '10', C: '12', D: '14', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Musique', text: 'De quel pays originate le groupe ABBA ?', A: 'Norvège', B: 'Suède', C: 'Danemark', D: 'Finlande', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Musique', text: 'Qui a composé le "Lac des Cygnes" ?', A: 'Tchaïkovski', B: 'Ravel', C: 'Debussy', D: 'Stravinski', correct: 'A', difficulty: 'MEDIUM' },

    // Littérature
    { cat: 'Littérature', text: 'Qui a écrit "Les Misérables" ?', A: 'Émile Zola', B: 'Victor Hugo', C: 'Honoré de Balzac', D: 'Alexandre Dumas', correct: 'B', difficulty: 'EASY' },
    { cat: 'Littérature', text: 'Qui a écrit "Le Petit Prince" ?', A: 'Antoine de Saint-Exupéry', B: 'Albert Camus', C: 'Jean-Paul Sartre', D: 'Marcel Proust', correct: 'A', difficulty: 'EASY' },
    { cat: 'Littérature', text: 'Combien de tomes compte "À la recherche du temps perdu" ?', A: '5', B: '6', C: '7', D: '8', correct: 'C', difficulty: 'HARD' },
    { cat: 'Littérature', text: 'Qui a écrit "Don Quichotte" ?', A: 'Cervantès', B: 'Shakespeare', C: 'Dante', D: 'Goethe', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Littérature', text: 'Qui a écrit "Roméo et Juliette" ?', A: 'Marlowe', B: 'Shakespeare', C: 'Molière', D: 'Corneille', correct: 'B', difficulty: 'EASY' },
    { cat: 'Littérature', text: 'Qui est l\'auteur de la trilogie "Le Seigneur des Anneaux" ?', A: 'C.S. Lewis', B: 'J.R.R. Tolkien', C: 'George R.R. Martin', D: 'J.K. Rowling', correct: 'B', difficulty: 'EASY' },
    { cat: 'Littérature', text: 'Combien de comédies Molière a-t-il écrites (environ) ?', A: '15', B: '25', C: '33', D: '40', correct: 'C', difficulty: 'HARD' },
    { cat: 'Littérature', text: 'Qui a écrit "L\'Étranger" ?', A: 'Albert Camus', B: 'Jean-Paul Sartre', C: 'André Gide', D: 'André Malraux', correct: 'A', difficulty: 'MEDIUM' },

    // Technologie
    { cat: 'Technologie', text: 'Qui a fondé Microsoft ?', A: 'Steve Jobs', B: 'Bill Gates et Paul Allen', C: 'Mark Zuckerberg', D: 'Larry Page', correct: 'B', difficulty: 'EASY' },
    { cat: 'Technologie', text: 'Quelle entreprise a créé l\'iPhone ?', A: 'Samsung', B: 'Google', C: 'Apple', D: 'Nokia', correct: 'C', difficulty: 'EASY' },
    { cat: 'Technologie', text: 'En quelle année a été lancé Facebook ?', A: '2002', B: '2004', C: '2006', D: '2008', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Technologie', text: 'Que signifie "USB" ?', A: 'Universal Serial Bus', B: 'United Storage Box', C: 'Ultra Speed Bus', D: 'Universal System Buffer', correct: 'A', difficulty: 'EASY' },
    { cat: 'Technologie', text: 'Qu\'est-ce que "l\'IoT" ?', A: 'Internet des objets', B: 'Index of Things', C: 'Internet of Time', D: 'Internal Operating Tool', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Technologie', text: 'Qui a fondé SpaceX ?', A: 'Jeff Bezos', B: 'Elon Musk', C: 'Richard Branson', D: 'Bill Gates', correct: 'B', difficulty: 'EASY' },
    { cat: 'Technologie', text: 'Qu\'est-ce que la blockchain ?', A: 'Une chaîne de blocs', B: 'Une base de données distribuée et immuable', C: 'Un type de monnaie', D: 'Un réseau social', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Technologie', text: 'Combien de bits a une adresse IPv6 ?', A: '32', B: '64', C: '128', D: '256', correct: 'C', difficulty: 'HARD' },

    // Santé
    { cat: 'Santé', text: 'Combien de verres d\'eau par jour recommande-t-on de boire (environ) ?', A: '1', B: '3', C: '8', D: '15', correct: 'C', difficulty: 'EASY' },
    { cat: 'Santé', text: 'Combien d\'heures de sommeil sont recommandées pour un adulte ?', A: '4-5', B: '7-9', C: '10-12', D: '12-14', correct: 'B', difficulty: 'EASY' },
    { cat: 'Santé', text: 'Quel est l\'apport calorique recommandé par jour pour un homme adulte (environ) ?', A: '1500 kcal', B: '2500 kcal', C: '3500 kcal', D: '5000 kcal', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Santé', text: 'Combien de temps maximum peut-on survivre sans eau (environ) ?', A: '1 jour', B: '3 jours', C: '7 jours', D: '15 jours', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Santé', text: 'Qu\'est-ce que la glycémie ?', A: 'Le taux de cholestérol', B: 'Le taux de sucre dans le sang', C: 'La tension artérielle', D: 'Le rythme cardiaque', correct: 'B', difficulty: 'EASY' },
    { cat: 'Santé', text: 'Combien de battements par minute a un cœur au repos (adulte sain) ?', A: '20-40', B: '60-100', C: '120-150', D: '180-200', correct: 'B', difficulty: 'EASY' },
    { cat: 'Santé', text: 'Quelle vitamine prévient le scorbut ?', A: 'Vitamine A', B: 'Vitamine B', C: 'Vitamine C', D: 'Vitamine K', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Santé', text: 'Combien de calories fait 1 gramme de glucides ?', A: '4 kcal', B: '7 kcal', C: '9 kcal', D: '12 kcal', correct: 'A', difficulty: 'HARD' },

    // Environnement
    { cat: 'Environnement', text: 'Qu\'est-ce que l\'empreinte carbone ?', A: 'Une marque au sol', B: 'La quantité de gaz à effet de serre émise', C: 'Un type de plante', D: 'Une méthode de pêche', correct: 'B', difficulty: 'EASY' },
    { cat: 'Environnement', text: 'Qu\'est-ce que la biodiversité ?', A: 'La diversité des êtres vivants', B: 'La diversité des paysages', C: 'Une marque biologique', D: 'Un type d\'écosystème', correct: 'A', difficulty: 'EASY' },
    { cat: 'Environnement', text: 'Quel gaz est principalement responsable du trou dans la couche d\'ozone ?', A: 'CO₂', B: 'CFC', C: 'Méthane', D: 'Oxygène', correct: 'B', difficulty: 'MEDIUM' },
    { cat: 'Environnement', text: 'Combien de temps met le plastique à se décomposer ?', A: '10 ans', B: '100 ans', C: '450 ans', D: '1000 ans', correct: 'C', difficulty: 'MEDIUM' },
    { cat: 'Environnement', text: 'Qu\'est-ce que l\'énergie renouvelable ?', A: 'Une énergie fossile', B: 'Une énergie inépuisable à l\'échelle humaine', C: 'Une énergie nucléaire', D: 'Une énergie artificielle', correct: 'B', difficulty: 'EASY' },
    { cat: 'Environnement', text: 'Quelle est la principale cause de la déforestation amazonienne ?', A: 'L\'agriculture et l\'élevage', B: 'Les incendies naturels', C: 'La sécheresse', D: 'Les volcanismes', correct: 'A', difficulty: 'MEDIUM' },
    { cat: 'Environnement', text: 'Qu\'est-ce que le réchauffement climatique ?', A: 'Une augmentation de la température moyenne de la Terre', B: 'Une canicule passagère', C: 'Un phénomène local', D: 'Une théorie non prouvée', correct: 'A', difficulty: 'EASY' },
    { cat: 'Environnement', text: 'Combien de degrés l\'Accord de Paris vise-il à limiter le réchauffement ?', A: '1°C', B: '1,5°C', C: '2,5°C', D: '4°C', correct: 'B', difficulty: 'HARD' },
  ]

  let created = 0
  for (const q of questions) {
    const cat = catRecords[q.cat]
    if (!cat) continue
    const existing = await db.question.findFirst({ where: { text: q.text } })
    if (existing) continue
    await db.question.create({
      data: {
        text: q.text,
        propositionA: q.A,
        propositionB: q.B,
        propositionC: q.C,
        propositionD: q.D,
        correctAnswer: q.correct,
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'MEDIUM',
        categoryId: cat.id,
      },
    })
    created++
  }
  console.log(`✓ ${created} nouvelles questions créées`)

  // ----- Admin user -----
  const adminEmail = 'admin@qvgdm.fr'
  let admin = await db.user.findUnique({ where: { email: adminEmail } })
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashPassword('admin123'),
        pseudo: 'Admin',
        fullName: 'Administrateur',
        role: 'ADMIN',
        country: 'France',
      },
    })
    console.log('✓ Utilisateur admin créé')
  } else {
    if (admin.role !== 'ADMIN') {
      admin = await db.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    }
    console.log('✓ Utilisateur admin déjà existant')
  }

  // ----- Demo players -----
  const demoPlayers = [
    { email: 'alice@demo.fr', pseudo: 'Alice', country: 'France' },
    { email: 'bob@demo.fr', pseudo: 'Bob', country: 'France' },
    { email: 'carlos@demo.es', pseudo: 'Carlos', country: 'Espagne' },
    { email: 'diana@demo.uk', pseudo: 'Diana', country: 'Royaume-Uni' },
    { email: 'emir@demo.dz', pseudo: 'Emir', country: 'Algérie' },
    { email: 'fatou@demo.sn', pseudo: 'Fatou', country: 'Sénégal' },
    { email: 'giulia@demo.it', pseudo: 'Giulia', country: 'Italie' },
    { email: 'hiroshi@demo.jp', pseudo: 'Hiroshi', country: 'Japon' },
    { email: 'ines@demo.ma', pseudo: 'Inès', country: 'Maroc' },
    { email: 'juan@demo.mx', pseudo: 'Juan', country: 'Mexique' },
  ]
  for (const p of demoPlayers) {
    const existing = await db.user.findUnique({ where: { email: p.email } })
    if (existing) continue
    await db.user.create({
      data: {
        email: p.email,
        passwordHash: hashPassword('demo123'),
        pseudo: p.pseudo,
        country: p.country,
        role: 'USER',
        gamesPlayed: Math.floor(Math.random() * 50) + 5,
        wins: Math.floor(Math.random() * 30),
        losses: Math.floor(Math.random() * 30),
        totalScore: Math.floor(Math.random() * 5000) + 500,
        xp: Math.floor(Math.random() * 3000) + 100,
        level: Math.floor(Math.random() * 8) + 1,
      },
    })
  }
  console.log(`✓ ${demoPlayers.length} joueurs de démo créés`)

  const testEmail = 'player@demo.fr'
  let testUser = await db.user.findUnique({ where: { email: testEmail } })
  if (!testUser) {
    testUser = await db.user.create({
      data: {
        email: testEmail,
        passwordHash: hashPassword('demo123'),
        pseudo: 'Player1',
        country: 'France',
        role: 'USER',
        gamesPlayed: 3,
        wins: 2,
        losses: 1,
        totalScore: 850,
        xp: 600,
        level: 2,
      },
    })
    console.log('✓ Utilisateur de test créé')
  }

  console.log('\n✅ Seeding terminé!')
  console.log('   Comptes:')
  console.log('   - Admin: admin@qvgdm.fr / admin123')
  console.log('   - Joueur: player@demo.fr / demo123')
}

main().catch(e => {
  console.error('❌ Seed error:', e)
  process.exit(1)
}).finally(async () => {
  await db.$disconnect()
})
