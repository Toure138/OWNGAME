# Déploiement sur Render

## 1. Pousser le dépôt sur GitHub

Le dépôt local est déjà initialisé et le travail est committé. Il reste à
déclarer le dépôt distant :

```bash
git remote add origin https://github.com/<votre-compte>/<votre-depot>.git
git branch -M main
git push -u origin main
```

> Créez d'abord un dépôt **vide** sur GitHub (sans README ni .gitignore, ils
> sont déjà présents ici).

## 2. Créer le service sur Render

1. Connectez-vous sur [dashboard.render.com](https://dashboard.render.com).
2. **New → Blueprint**.
3. Sélectionnez le dépôt GitHub que vous venez de pousser.
4. Render détecte [`render.yaml`](./render.yaml) et propose **deux ressources** :
   le service web `qvgdm-quiz` et la base PostgreSQL `qvgdm-db`. Validez avec
   **Apply** — les deux doivent être créées, le service seul ne démarrerait pas.

Render exécute alors :

| Étape      | Commande                                      |
| ---------- | --------------------------------------------- |
| Build      | `npm ci && npm run build`                     |
| Démarrage  | `npm run db:prepare && npm run start:prod`    |
| Santé      | `GET /api/health`                             |

Le premier déploiement prend environ 3 à 5 minutes. Au démarrage, `db:prepare`
attend que PostgreSQL réponde, crée les tables et insère les 1000 questions.
Aux démarrages suivants il ne fait rien : les données déjà en base sont
conservées.

## 2 bis. Service déjà déployé avant le passage à PostgreSQL

**Symptôme.** Le build réussit, puis le démarrage s'arrête sur :

```
❌ DATABASE_URL pointe vers un fichier SQLite (file:…).
==> Exited with status 1
```

**Cause.** Le service a été créé quand la base était encore un fichier SQLite.
Render conserve les variables d'environnement déjà enregistrées : la valeur
`file:/opt/render/project/src/db/qvgdm.db` est restée en place. Le bloc
`fromDatabase` ajouté à `render.yaml` ne s'applique qu'à la **synchronisation du
blueprint**, qui est aussi ce qui crée la base `qvgdm-db`. Tant que cette
synchronisation n'a pas eu lieu, le service pointe vers un fichier qui n'existe
plus et le démarrage échoue — volontairement, plutôt que de repartir sur une
base vide à chaque redémarrage.

**Correction — au choix.**

*A. Par le blueprint (recommandé, la base est alors gérée avec le service)*

1. Dashboard Render → **Blueprints** → votre blueprint → **Sync**.
2. Render détecte le bloc `databases` de `render.yaml`, crée la base
   PostgreSQL `qvgdm-db` et renseigne `DATABASE_URL` sur le service web.
3. Le déploiement suivant démarre normalement : `db:prepare` crée les tables et
   insère les 1000 questions.

> Si `DATABASE_URL` a déjà été modifiée à la main dans le tableau de bord,
> **supprimez-la d'abord** (Settings → Environment). Une valeur saisie
> manuellement l'emporte sur le blueprint et ne serait pas remplacée par la
> synchronisation.

*B. À la main (si vous préférez gérer la base séparément)*

1. **New → PostgreSQL**, même région que le service web (`frankfurt`).
2. Copiez son **Internal Database URL**.
3. Service web → Settings → Environment → remplacez `DATABASE_URL` par cette
   valeur, puis **Manual Deploy → Deploy latest commit**.

Une base hébergée ailleurs (Neon, Supabase) fonctionne de la même façon : collez
sa chaîne de connexion, en ajoutant `?sslmode=require` si le fournisseur
l'exige.

**Reprise des données.** Rien à récupérer : l'ancienne base SQLite vivait sur le
disque éphémère de l'instance et a déjà disparu à chaque redémarrage. Si vous
disposez encore d'un fichier `.db` en local, voir « Reprise d'une ancienne base
SQLite » plus bas.

## 3. Variables d'environnement

`render.yaml` déclare tout le nécessaire. Deux valeurs sont marquées
`sync: false` : Render vous demande de les saisir dans le tableau de bord,
**avant le premier déploiement**.

| Variable          | Rôle                                                            |
| ----------------- | --------------------------------------------------------------- |
| `ADMIN_EMAIL`     | Identifiant du compte administrateur créé au démarrage           |
| `ADMIN_PASSWORD`  | Son mot de passe — **choisissez-en un solide**                   |
| `JWT_SECRET`      | Généré automatiquement par Render, ne rien saisir                |
| `DATABASE_URL`    | Connexion PostgreSQL, renseignée par Render (`fromDatabase`)     |
| `HOSTNAME`        | `0.0.0.0` — **ne pas retirer**, voir ci-dessous                  |
| `SEED_DEMO_USERS` | `true` pour ajouter 15 joueurs de démonstration                  |

### Pourquoi `HOSTNAME=0.0.0.0` est indispensable

Le serveur autonome de Next.js se lie à `process.env.HOSTNAME || '0.0.0.0'`.
Or Render, comme tout environnement conteneurisé, renseigne `HOSTNAME` avec le
nom du conteneur. Sans cette variable, Next écoute sur une interface que le
proxy de la plateforme ne peut pas joindre : le tableau de bord annonce
« Your service is live 🎉 » et l'URL répond malgré tout **502**.

Le symptôme est identifiable dans les journaux de démarrage :

```
- Network:  http://srv-xxxxx-hibernate-xxxxx:10000   ← anormal
- Network:  http://0.0.0.0:10000                     ← attendu
```

Si `ADMIN_EMAIL` et `ADMIN_PASSWORD` ne sont pas renseignées, les valeurs par
défaut (`admin@qvgdm.fr` / `admin123`) s'appliquent : **changez-les
immédiatement après le premier déploiement** depuis l'écran Profil → Sécurité.

## 4. Persistance des données

Les données vivent dans la base PostgreSQL `qvgdm-db`, un service **distinct**
de l'instance web. Comptes, parties, classements, notifications et succès
survivent donc aux redéploiements, aux redémarrages et aux réveils après mise en
veille — le système de fichiers éphémère de l'instance n'entre plus en jeu.

C'était le défaut de la version précédente : la base était un fichier SQLite posé
sur ce disque éphémère, recréé vide à chaque redémarrage.

**Point de vigilance — le plan gratuit de la base est temporaire.** Render
supprime les bases PostgreSQL gratuites au bout de 30 jours ; la date
d'expiration est affichée sur la page de la base dans le tableau de bord. Trois
options :

1. **Payer la base** : passez `plan: free` à `plan: basic-256mb` (ou supérieur)
   dans le bloc `databases` de `render.yaml`, puis redéployez ;
2. **Héberger la base ailleurs** (Neon, Supabase, ElephantSQL… tous proposent
   une offre gratuite durable) : supprimez le bloc `databases` de `render.yaml`,
   remplacez le `fromDatabase` de `DATABASE_URL` par `sync: false`, et collez la
   chaîne de connexion dans le tableau de bord Render. Ajoutez
   `?sslmode=require` si le fournisseur l'exige ;
3. **Ne rien faire** et recréer une base gratuite tous les 30 jours — les
   données sont alors perdues à chaque renouvellement.

### Sauvegarde et restauration

Render fournit la chaîne de connexion externe (`External Database URL`) sur la
page de la base :

```bash
pg_dump "<External Database URL>" > sauvegarde.sql
psql "<External Database URL>" < sauvegarde.sql
```

### Reprise d'une ancienne base SQLite

Si vous aviez déjà un fichier `db/custom.db` rempli, ses données se reprennent
depuis votre poste, la chaîne de connexion externe pointée sur la base Render :

```bash
DATABASE_URL="<External Database URL>" npm run db:import-sqlite
```

L'opération n'écrase rien et peut être relancée sans risque.

## 5. Vérifier le déploiement

Une fois le service en ligne, depuis votre poste :

```bash
curl https://<votre-service>.onrender.com/api/health
node scripts/check-endpoints.mjs https://<votre-service>.onrender.com
```

Le second script exécute les 160 vérifications : un duel complet entre deux
comptes de test qu'il crée puis supprime, une partie contre l'ordinateur et un
examen du parcours académique. Il a besoin des identifiants administrateur :

```bash
ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/check-endpoints.mjs https://<votre-service>.onrender.com
```

## Points d'attention

**Une seule instance.** L'état temps réel (présence dans le salon, invitations,
parties en cours) est conservé en mémoire du processus. `numInstances: 1` dans
`render.yaml` n'est pas une économie mais une nécessité : avec deux instances,
deux joueurs servis par des processus différents ne se verraient pas.

**Mise en veille du plan gratuit.** Après 15 minutes sans trafic, Render
suspend le service ; la requête suivante le réveille en 30 à 60 secondes. Une
partie en cours pendant la mise en veille est perdue — les clients se
reconnectent automatiquement au salon.

**Sonde de santé.** `/api/health` vérifie aussi l'accès à la base et renvoie
503 si elle est injoignable : Render redémarre alors l'instance plutôt que de
laisser un service qui répond mais ne fonctionne pas.
