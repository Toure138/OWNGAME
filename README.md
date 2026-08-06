# Qui veut gagner 20 millions ?

Quiz multijoueur en temps réel. Deux joueurs s'affrontent sur 20 questions
tirées d'une banque de **7054 questions réparties en 20 catégories**. Chaque
joueur traite la moitié des questions, avec 20 secondes de réflexion et un bonus
de points proportionnel à sa rapidité.

Trois façons de jouer :

| Mode | Adversaire | Ce qui est en jeu |
| ---- | ---------- | ----------------- |
| **Duel** | Un autre joueur du salon | Score, classement, XP |
| **Solo** | L'ordinateur — 4 profils, du Novice au Champion | XP et niveau (hors classement) |
| **Parcours académique** | Un jury | Six diplômes, du CEP au doctorat |

Next.js 16 · React 19 · Prisma · PostgreSQL · Tailwind CSS v4 · shadcn/ui

---

## Démarrage rapide

```bash
npm install
cp .env.example .env        # ajustez DATABASE_URL et JWT_SECRET
npm run db:up               # démarre PostgreSQL (Docker)
npm run db:prepare          # applique le schéma et peuple la base
npm run dev                 # http://localhost:3000
```

`npm run db:up` lance le conteneur décrit par [`docker-compose.yml`](./docker-compose.yml),
qui correspond au `DATABASE_URL` de `.env.example`. Si vous disposez déjà d'un
serveur PostgreSQL (local ou distant : Neon, Supabase…), ignorez cette commande
et renseignez simplement sa chaîne de connexion dans `.env`.

Les données vivent dans PostgreSQL, pas dans un fichier du projet : elles
survivent aux redémarrages de l'application. `npm run db:prepare` est
idempotent — il ne recrée que ce qui manque et n'efface jamais de compte.

### Reprendre l'ancienne base SQLite

Le projet utilisait auparavant un fichier `db/custom.db`. Pour en récupérer les
comptes, questions et parties :

```bash
npm run db:import-sqlite            # lit db/custom.db par défaut
npm run db:import-sqlite -- chemin/vers/autre.db
```

La reprise ignore les lignes déjà présentes : elle peut être relancée sans
risque, et n'est à faire qu'une fois.

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

Un seul compte suffit pour jouer : le salon vide propose directement l'ordinateur
et le parcours académique.

---

## Modes de jeu

### Contre l'ordinateur

Quatre profils, du Novice au Champion. L'ordinateur ne consulte pas la bonne
réponse : sa probabilité de la trouver dépend de son profil **et** du palier
académique de la question, et son temps de réponse suit une loi normale tronquée.
Un adversaire omniscient que l'on brimerait au hasard se tromperait
uniformément, jamais sur ce qui est réellement difficile.

Les questions montent en difficulté au fil de la partie, à partir du niveau
correspondant au dernier diplôme obtenu par le joueur.

Une partie solo rapporte de l'expérience (60 % du barème d'un duel) mais
**n'entre pas au classement** : l'ordinateur étant disponible sans limite, y
verser des points reviendrait à offrir la première place à qui enchaîne les
adversaires les plus faibles.

### Parcours académique

Six examens successifs, chacun ouvrant le suivant :

| Diplôme | Niveau | Questions | Seuil | Temps | XP |
| ------- | ------ | --------- | ----- | ----- | -- |
| CEP | Primaire | 10 | 60 % | 25 s | +300 |
| BEPC | Collège | 12 | 60 % | 22 s | +650 |
| Baccalauréat | Lycée | 15 | 65 % | 20 s | +1000 |
| Licence | Université, 1er cycle | 15 | 70 % | 18 s | +1350 |
| Master | Université, 2e cycle | 18 | 75 % | 16 s | +1700 |
| Doctorat | École doctorale | 20 | 80 % | 15 s | +2050 |

L'examen se joue seul : toutes les questions sont pour le candidat. La réussite
donne une **mention** calculée sur le pourcentage de bonnes réponses — Passable,
Assez bien, Bien, Très bien, ou les Félicitations du jury à partir de 98 %.

Un examen se repasse autant de fois que nécessaire, et **ne fait jamais perdre
un diplôme déjà obtenu** : seule une meilleure mention remplace l'ancienne. Le
plus haut diplôme devient le titre du joueur — Bachelier, Licencié, Docteur… —
affiché à côté de son pseudo, y compris dans le classement.

L'ordre du cursus est vérifié côté serveur : appeler directement l'API pour
passer le doctorat sans avoir le CEP renvoie une erreur 403.

### D'où viennent les 7054 questions

| Origine | Nombre | Catégories |
| ------- | ------ | ---------- |
| Rédigées à la main | 1054 | Les 20 catégories |
| Générées | 6000 | Mathématiques, Physique, Chimie, Informatique, Télécommunications, Économie — 1000 chacune |

Les six catégories « calculables » atteignent 1000 questions grâce aux
générateurs de [`data/generators/`](./data/generators/). Le principe tient en
une phrase : **la réponse n'est jamais écrite, elle est calculée**. Un gabarit
tire ses paramètres — deux nombres à multiplier, une molécule, une fréquence —
puis dérive la bonne réponse et ses leurres. Une question produite ainsi est
juste par construction, ce qui permet d'en fabriquer des milliers sans
multiplier les erreurs factuelles.

Le tirage est déterministe : l'énoncé sert de clé d'unicité en base, une
génération aléatoire ferait diverger la banque à chaque peuplement.

Les quatorze autres catégories restent à 50-56 questions rédigées. **Elles ne
peuvent pas être générées** : une question d'histoire ou de cinéma suppose des
faits, et les inventer produirait des énoncés faux. Les étoffer demande un
travail de rédaction, pas de code.

Chaque gabarit déclare le palier auquel il appartient, si bien que les six
catégories générées couvrent les six niveaux de façon régulière — environ 210
questions au CEP et 105 au doctorat pour chacune.

### Comment les questions ont été réparties en six paliers

La banque était rédigée avec trois difficultés seulement, et très inégalement :
473 faciles, 443 moyennes, 84 difficiles. Découper chaque difficulté en deux
aurait donné 42 questions pour le master et autant pour le doctorat — trop peu
pour un examen de vingt questions rejouable.

[`data/levels.mjs`](./data/levels.mjs) classe donc les mille questions sur une
échelle continue — la difficulté rédigée à la main domine, la complexité
lexicale de l'énoncé départage — puis découpe ce classement en une pyramide :

```
CEP 240 · BEPC 230 · Bac 200 · Licence 150 · Master 110 · Doctorat 70
```

Ce découpage ne s'applique qu'aux questions rédigées sans palier explicite. Une
question qui en déclare un — celles de `data/questions/avance.mjs` et toutes
celles des générateurs — le conserve tel quel : un découpage par percentiles
maintiendrait le doctorat à 7 % de la banque quoi qu'on ajoute. Sur l'ensemble,
la banque compte aujourd'hui **1440 questions au CEP et 696 au doctorat**.

Le classement est strictement déterministe, et chaque question reste modifiable
palier par palier depuis l'administration. Le peuplement ne recalcule jamais une
répartition déjà en place.

---

## Scripts

| Commande                  | Rôle                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | Serveur de développement                                       |
| `npm run build`           | Build de production (`prisma generate` + Next + finalisation)   |
| `npm start`               | Lance le bundle autonome construit                             |
| `npm run db:up`           | Démarre PostgreSQL en local (Docker)                            |
| `npm run db:down`         | Arrête le conteneur (les données sont conservées)               |
| `npm run db:prepare`      | Applique le schéma puis peuple la base si nécessaire            |
| `npm run db:seed`         | Peuplement avec les joueurs de démonstration                    |
| `npm run db:import-sqlite`| Reprend les données de l'ancienne base SQLite                   |
| `npm run db:reset`        | **Efface tout** puis re-peuple — à n'utiliser qu'en local       |
| `npm run typecheck`       | Vérification TypeScript                                        |
| `npm run lint`            | ESLint                                                         |
| `npm run check:bank`      | Contrôle qualité de la banque de questions                      |
| `npm run check:endpoints` | 160 vérifications de l'API contre un serveur démarré             |
| `npm run check:deploy`    | Rejoue un déploiement Render en local, avant de pousser         |
| `npm run verify`          | `typecheck` + `check:bank`                                     |

### Avant de pousser en production

```bash
npm run check:deploy
```

Le build local ne suffit pas à garantir un déploiement : il réutilise
`node_modules` et ne positionne pas `NODE_ENV`. Ce script part des seuls
fichiers suivis par git, installe depuis zéro avec `npm ci` et construit sous
`NODE_ENV=production` — exactement ce que fait Render.

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
  index.mjs                  Catalogue des catégories + agrégation de la banque
  permute.mjs                Placement déterministe de la bonne réponse
  questions/*.mjs            1054 questions rédigées, en tuples compacts
  generators/*.mjs           6000 questions calculées, 1000 par matière
prisma/schema.prisma         Modèle de données
  levels.mjs                 Répartition de la banque en six paliers académiques
docker-compose.yml           PostgreSQL de développement
scripts/
  seed.mjs                   Peuplement (exécutable en production)
  prepare-db.mjs             Attente de la base + schéma + peuplement au démarrage
  migrate-sqlite-to-postgres.mjs  Reprise de l'ancienne base SQLite
  postbuild.mjs              Finalisation du bundle autonome
  check-bank.mjs             Contrôle qualité de la banque
  check-endpoints.mjs        Vérification de l'API de bout en bout
src/
  app/api/                   33 points d'entrée REST
  lib/
    realtime.ts              Moteur de jeu en mémoire (duel, solo, examen)
    bot.ts                   Adversaire artificiel : profils et décisions
    academic.mjs             Cursus, diplômes, mentions, score de difficulté
    game-persistence.ts      Écriture des parties, XP, diplômes, succès, notifications
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
- **Base PostgreSQL plutôt qu'un fichier SQLite.** La base était auparavant un
  fichier posé à côté de l'application : sur un hébergement au système de
  fichiers éphémère, chaque redémarrage repartait d'une base vide et les comptes
  des joueurs disparaissaient. Un serveur PostgreSQL distinct règle le problème,
  au prix d'une dépendance supplémentaire en développement (Docker).
- **Tirage aléatoire délégué à PostgreSQL** (`ORDER BY RANDOM()`) plutôt qu'un
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
