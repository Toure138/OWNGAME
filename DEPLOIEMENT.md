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
4. Render détecte [`render.yaml`](./render.yaml) et propose le service
   `qvgdm-quiz`. Validez avec **Apply**.

Render exécute alors :

| Étape      | Commande                                      |
| ---------- | --------------------------------------------- |
| Build      | `npm ci && npm run build`                     |
| Démarrage  | `npm run db:prepare && npm run start:prod`    |
| Santé      | `GET /api/health`                             |

Le premier déploiement prend environ 3 à 5 minutes. Au démarrage,
`db:prepare` crée la base, applique le schéma et insère les 1000 questions.

## 3. Variables d'environnement

`render.yaml` déclare tout le nécessaire. Deux valeurs sont marquées
`sync: false` : Render vous demande de les saisir dans le tableau de bord,
**avant le premier déploiement**.

| Variable          | Rôle                                                            |
| ----------------- | --------------------------------------------------------------- |
| `ADMIN_EMAIL`     | Identifiant du compte administrateur créé au démarrage           |
| `ADMIN_PASSWORD`  | Son mot de passe — **choisissez-en un solide**                   |
| `JWT_SECRET`      | Généré automatiquement par Render, ne rien saisir                |
| `DATABASE_URL`    | Chemin du fichier SQLite (voir la section suivante)              |
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

Le plan gratuit de Render **ne conserve pas le système de fichiers** : à chaque
déploiement ou redémarrage (dont la mise en veille après 15 minutes
d'inactivité), le disque repart de zéro.

Concrètement :

- la banque de 1000 questions et le compte administrateur sont **recréés
  automatiquement** au démarrage — l'application est toujours immédiatement
  jouable ;
- les comptes créés par les joueurs, leurs parties et leurs classements sont
  **perdus**.

C'est acceptable pour une démonstration. Pour conserver les données :

1. Passez le service en plan **Starter** (7 $/mois) ;
2. décommentez la section `disk` à la fin de `render.yaml` ;
3. remplacez la valeur de `DATABASE_URL` par `file:/var/data/qvgdm.db` ;
4. redéployez.

Le fichier SQLite vit alors sur le disque monté et survit aux redéploiements.
`db:prepare` reste idempotent : il n'écrase jamais une base existante.

## 5. Vérifier le déploiement

Une fois le service en ligne, depuis votre poste :

```bash
curl https://<votre-service>.onrender.com/api/health
node scripts/check-endpoints.mjs https://<votre-service>.onrender.com
```

Le second script exécute les 109 vérifications, dont un duel complet entre deux
comptes de test qu'il crée puis supprime. Il a besoin des identifiants
administrateur :

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
