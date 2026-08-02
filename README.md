# Qui veut gagner 20 millions ?

Quiz multijoueur en temps réel. Deux joueurs s'affrontent sur 20 questions
tirées d'une banque de **1000 questions réparties en 20 catégories**. Chaque
joueur traite la moitié des questions, avec 20 secondes de réflexion et un bonus
de points proportionnel à sa rapidité.

Next.js 16 · React 19 · Prisma · SQLite · Tailwind CSS v4 · shadcn/ui

---

## Démarrage rapide

```bash
npm install
cp .env.example .env        # ajustez DATABASE_URL et JWT_SECRET
npm run db:prepare          # applique le schéma et peuple la base
npm run dev                 # http://localhost:3000
```

Pour disposer de joueurs de démonstration dans les classements :

```bash
npm run db:seed             # ajoute 15 comptes (mot de passe : demo123)
```

Comptes créés par le peuplement :

| Rôle          | Identifiant        | Mot de passe |
| ------------- | ------------------ | ------------ |
| Administrateur | `admin@qvgdm.fr`  | `admin123`   |
| Joueur (démo) | `player@demo.fr`   | `demo123`    |

> Changez ces identifiants en production via `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

### Tester le multijoueur en local

Ouvrez l'application dans une fenêtre normale **et** dans une fenêtre de
navigation privée, connectez-vous avec deux comptes distincts : les deux joueurs
apparaissent dans le salon et peuvent se défier.

---

## Scripts

| Commande                  | Rôle                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | Serveur de développement                                       |
| `npm run build`           | Build de production (`prisma generate` + Next + finalisation)   |
| `npm start`               | Lance le bundle autonome construit                             |
| `npm run db:prepare`      | Applique le schéma puis peuple la base si nécessaire            |
| `npm run db:seed`         | Peuplement avec les joueurs de démonstration                    |
| `npm run typecheck`       | Vérification TypeScript                                        |
| `npm run lint`            | ESLint                                                         |
| `npm run check:bank`      | Contrôle qualité de la banque de questions                      |
| `npm run check:endpoints` | Vérifie les 30 points d'entrée contre un serveur démarré        |
| `npm run verify`          | `typecheck` + `check:bank`                                     |

### Vérification des endpoints

Le script parcourt l'ensemble de l'API : codes de succès, refus
d'authentification, contrôles d'autorisation, validation des entrées, et un
**duel complet entre deux joueurs** jusqu'à l'enregistrement de la partie.

```bash
npm run dev                                   # dans un terminal
node scripts/check-endpoints.mjs http://localhost:3000
```

---

## Déploiement sur Render

Voir [`DEPLOIEMENT.md`](./DEPLOIEMENT.md) pour la procédure détaillée.

En résumé : poussez le dépôt sur GitHub, puis dans Render
**New → Blueprint** et sélectionnez le dépôt. Le fichier [`render.yaml`](./render.yaml)
décrit le service, la commande de build, le démarrage et la sonde de santé.

> **Contrainte d'architecture** — l'état temps réel (présence, invitations,
> parties en cours) vit en mémoire du processus. Le service doit rester en
> **une seule instance** ; il n'est pas conçu pour une montée en charge
> horizontale.

---

## Architecture

```
data/                        Banque de questions (JavaScript pur)
  index.mjs                  Catalogue des catégories + permutation des propositions
  questions/*.mjs            1000 questions en tuples compacts
prisma/schema.prisma         Modèle de données
scripts/
  seed.mjs                   Peuplement (exécutable en production)
  prepare-db.mjs             Schéma + peuplement au démarrage
  postbuild.mjs              Finalisation du bundle autonome
  check-bank.mjs             Contrôle qualité de la banque
  check-endpoints.mjs        Vérification de l'API de bout en bout
src/
  app/api/                   30 points d'entrée REST
  lib/
    realtime.ts              Moteur de jeu en mémoire
    game-persistence.ts      Écriture des parties, XP, succès, notifications
    question-picker.ts       Tirage des questions côté serveur
    auth.ts / password.mjs   Jetons HMAC-SHA256, mots de passe scrypt
    api.ts                   Garde d'authentification, validation, limitation de débit
  components/screens/        Un composant par écran
  hooks/use-realtime.ts      Client d'interrogation + bus d'événements
```

### Déroulement d'une partie

1. Un joueur en défie un autre depuis le salon (`/api/realtime/invite`).
2. L'adversaire accepte ; l'invitant lance la partie (`/api/realtime/game-start`).
3. **Le serveur tire les 20 questions** et les distribue une par une. Les
   bonnes réponses ne quittent jamais le serveur avant la fin du tour.
4. Chaque joueur répond à une question sur deux, dans un temps limité.
5. À la fin, **le serveur seul** enregistre la partie, met à jour les
   statistiques des deux joueurs, l'expérience, les succès et les notifications.

### Choix notables

- **Interrogation HTTP plutôt que WebSocket.** Le service tourne en une
  instance ; l'interrogation périodique évite une infrastructure supplémentaire.
- **Permutation déterministe des propositions.** Les questions sont rédigées
  avec la bonne réponse souvent en même position ; une permutation dérivée de
  l'énoncé rétablit une répartition A/B/C/D équilibrée, de façon reproductible.
- **Tirage aléatoire délégué à SQLite** (`ORDER BY RANDOM()`) plutôt qu'un
  mélange en mémoire d'un sous-ensemble : avec 1000 questions, l'ancienne
  approche rendait une grande partie de la banque inatteignable.
- **Temps de réponse recalculé côté serveur** : le client ne peut pas
  s'attribuer un bonus de rapidité en annonçant un temps fantaisiste.

---

## Banque de questions

1000 questions, 50 par catégorie :

Mathématiques · Physique · Chimie · Biologie · Sciences de la Terre ·
Informatique · Intelligence artificielle · Télécommunications · Histoire ·
Géographie · Politique · Économie · Culture générale · Sport · Cinéma ·
Musique · Littérature · Technologie · Santé · Environnement

`npm run check:bank` vérifie l'absence de doublons, la validité des réponses,
l'unicité des propositions et l'équilibre de la répartition A/B/C/D.

Les administrateurs peuvent créer, modifier et importer des questions en masse
(JSON) depuis l'écran d'administration.
