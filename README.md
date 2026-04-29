# Polygon Planning

Outil de planning d'équipe interne — affichage **semaine** / **mois** des tâches et absences, par membre et par client.

---

## 1. Vue d'ensemble

```
                          ┌─────────────────────────┐
                          │   Navigateur (user)     │
                          └────────────┬────────────┘
                                       │ HTTPS
                                       ▼
                          ┌─────────────────────────┐
                          │     Vercel (CDN)        │   ← hébergement du front
                          │   front Vite/React      │     statique (HTML/JS/CSS)
                          └────────────┬────────────┘
                                       │ HTTPS (REST + Realtime)
                                       ▼
                          ┌─────────────────────────┐
                          │     Supabase            │   ← backend managé
                          │ Postgres + Auth + API   │
                          └─────────────────────────┘
                       project_ref: csaequazndafhgotnlif
```

- **Front** : SPA React 18 buildée par Vite, déployée sur Vercel.
- **Back** : Supabase (Postgres managé) — schéma déjà créé, le front sera branché dessus dans une prochaine itération.
- **État actuel** : le front utilise `localStorage` du navigateur en attendant le branchement Supabase.

---

## 2. Stack technique

| Couche       | Techno                              | Rôle                                                  |
|--------------|-------------------------------------|-------------------------------------------------------|
| UI           | React 18 (JavaScript, pas TypeScript) | Composants, état, rendu                            |
| Build / dev  | Vite 5                              | Serveur de dev (hot reload), build prod               |
| Hébergement  | Vercel                              | Déploiement auto sur chaque `git push`                |
| Base de données | Supabase (Postgres 15)           | Tables `members`, `clients`, `tasks`                  |
| Auth (à venir) | Supabase Auth                     | Pas encore branchée — RLS dev-only pour l'instant     |
| Versionning  | Git + GitHub                        | `MarketingDevWebexpR/Kairo-planner-polygon`           |

---

## 3. Organisation du projet

```
2026-Outil-planning-polygon/
├── index.html              ← point d'entrée HTML chargé par Vite
├── vite.config.js          ← config build (rien de custom)
├── package.json            ← dépendances + scripts npm
├── public/                 ← assets statiques (logos)
│   ├── logo-polygon.png
│   └── logo-kairo.png
├── src/
│   ├── main.jsx            ← bootstrap React (monte <App />)
│   ├── App.jsx             ← état global, navigation, modales
│   ├── data.js             ← constantes (clients par défaut, palette,
│   │                          membres seed) + utilitaires de date
│   ├── icons.jsx           ← icônes SVG inline
│   ├── styles.css          ← styles globaux
│   ├── Sidebar.jsx         ← panneau gauche : membres + clients + filtres
│   ├── WeekView.jsx        ← vue semaine (5 jours)
│   ├── MonthView.jsx       ← vue mois (grille de semaines)
│   ├── TaskModal.jsx       ← formulaire création/édition de tâche / absence
│   ├── ConfirmModal.jsx    ← modale de confirmation générique
│   └── FeedbackModal.jsx   ← formulaire de retour utilisateur
├── .gitignore              ← exclut node_modules, dist, .env, .vercel
├── .mcp.json               ← config MCP Supabase (utilisé par Claude Code)
└── .claude/                ← config locale Claude Code (settings, hooks)
```

### Logique applicative (où chercher quoi)

| Besoin                                        | Fichier                  |
|-----------------------------------------------|--------------------------|
| Modifier la liste des membres / clients seed  | `src/data.js`            |
| Changer les motifs d'absence                  | `src/data.js` (`ABSENCE_REASONS`) + le `CHECK` SQL côté Supabase |
| Modifier la couleur d'un client               | géré dynamiquement via la palette dans `data.js` |
| Toucher à la grille semaine                   | `src/WeekView.jsx`       |
| Toucher à la grille mois                      | `src/MonthView.jsx`      |
| Le formulaire qui s'ouvre sur clic sur une tâche | `src/TaskModal.jsx`   |
| L'état global (membres, clients, tâches, vue) | `src/App.jsx`            |

---

## 4. Hébergement du front sur Vercel

### Comment c'est branché

1. Le repo GitHub `MarketingDevWebexpR/Kairo-planner-polygon` est connecté au projet Vercel **`kairo-planner-polygon`** (équipe : *Marketing Dev WebexpR*).
2. À chaque `git push` sur la branche `main`, Vercel :
   - clone le repo
   - lance `npm install`
   - lance `npm run build` (qui exécute `vite build`)
   - publie le contenu de `dist/` sur son CDN mondial
3. Chaque PR / branche génère automatiquement une **preview URL** isolée.

### Configuration Vercel

Tout est auto-détecté grâce au preset Vite :

| Réglage         | Valeur          |
|-----------------|-----------------|
| Framework       | Vite            |
| Build Command   | `npm run build` |
| Output Directory| `dist`          |
| Install Command | `npm install`   |
| Root Directory  | `./`            |

### Variables d'environnement Vercel

Pour l'instant : **aucune** (le front tourne en localStorage).

Quand on branchera Supabase, ajouter dans **Vercel → Settings → Environment Variables** (Production + Preview + Development) :

| Nom                       | Valeur                                              |
|---------------------------|-----------------------------------------------------|
| `VITE_SUPABASE_URL`       | `https://csaequazndafhgotnlif.supabase.co`          |
| `VITE_SUPABASE_ANON_KEY`  | À récupérer dans Supabase → *Project Settings* → *API* (clé `anon` / `publishable`) |

> **Important** : avec Vite, seules les variables préfixées par `VITE_` sont exposées au front. Ne JAMAIS y mettre de clé `service_role` ou de secret serveur — ces variables sont visibles dans le bundle JS livré au navigateur.

---

## 5. Hébergement du back sur Supabase

### Le projet Supabase

- **Project ref** : `csaequazndafhgotnlif`
- **API URL** : `https://csaequazndafhgotnlif.supabase.co`
- **Dashboard** : https://supabase.com/dashboard/project/csaequazndafhgotnlif

### Schéma de la base (Postgres)

Trois tables, toutes avec **RLS activée** et un trigger `updated_at` automatique.

#### `members` — les membres de l'équipe

| Colonne        | Type         | Notes                                        |
|----------------|--------------|----------------------------------------------|
| `id`           | uuid PK      | généré (`gen_random_uuid()`)                 |
| `name`         | text         | non vide                                     |
| `initials`     | text         | 1 à 3 caractères (affichés dans les pastilles) |
| `display_order`| integer      | tri d'affichage dans la sidebar              |
| `created_at`   | timestamptz  | auto                                         |
| `updated_at`   | timestamptz  | auto via trigger                             |

#### `clients` — les clients (et "Interne")

| Colonne      | Type         | Notes                                               |
|--------------|--------------|-----------------------------------------------------|
| `id`         | uuid PK      | généré                                              |
| `name`       | text UNIQUE  | nom affiché                                         |
| `color`      | text         | couleur OKLCH utilisée dans l'UI                    |
| `hue`        | smallint     | 0 à 360, sert à calculer des dégradés cohérents     |
| `created_at` | timestamptz  | auto                                                |
| `updated_at` | timestamptz  | auto                                                |

#### `tasks` — tâches **et** absences (table unifiée distinguée par `kind`)

| Colonne      | Type      | Notes                                                            |
|--------------|-----------|------------------------------------------------------------------|
| `id`         | uuid PK   | généré                                                           |
| `kind`       | text      | `'task'` ou `'absence'`                                          |
| `member_id`  | uuid FK   | → `members.id` (ON DELETE CASCADE)                               |
| `title`      | text      | requis si `kind='task'`, interdit si `kind='absence'`            |
| `client_id`  | uuid FK   | → `clients.id` (CASCADE) — requis si `kind='task'`               |
| `notes`      | text      | par défaut `''`                                                  |
| `reason`     | text      | requis si `kind='absence'` ; valeurs autorisées : `conges`, `rtt`, `maladie`, `formation`, `teletravail`, `autre` |
| `start_date` | date      | début                                                            |
| `end_date`   | date      | fin (≥ `start_date`)                                             |
| `half`       | text      | `'am'` ou `'pm'` — uniquement si l'entrée tient sur un seul jour |
| `created_at` | timestamptz | auto                                                           |
| `updated_at` | timestamptz | auto                                                           |

**Indexes** : `member_id`, `client_id`, `(start_date, end_date)`, `kind`.

### Migrations appliquées

| # | Nom                                     | Contenu                                                |
|---|-----------------------------------------|--------------------------------------------------------|
| 1 | `init_planning_schema`                  | Création des 3 tables, contraintes, RLS, trigger       |
| 2 | `seed_default_members_and_clients`      | Insertion des 6 membres + 4 clients par défaut         |
| 3 | `harden_set_updated_at_search_path`     | Durcissement sécurité du trigger (`search_path` figé)  |

### Sécurité — état actuel et chantier à venir

> **À durcir avant mise en production.**
>
> Les policies RLS actuelles (`*_dev_all`) autorisent **tout le monde (anon + authenticated)** à lire/écrire toutes les tables. C'est volontaire pour que le front fonctionne dès le premier branchement. Avant prod :
> 1. Brancher Supabase Auth (magic link ou OAuth Google)
> 2. Remplacer les policies dev par des policies basées sur `auth.uid() is not null`
> 3. Optionnel : restreindre l'accès aux utilisateurs d'un domaine email (ex. `@webexpr.fr`)

---

## 6. Lancer le projet en local

```bash
# 1. Installer les dépendances (à faire une seule fois)
npm install

# 2. Lancer le serveur de dev (hot reload sur http://localhost:5173)
npm run dev

# 3. Construire le bundle de prod (output dans dist/)
npm run build

# 4. Servir le bundle de prod localement (pour tester avant push)
npm run preview
```

Pas de `.env` à créer pour l'instant — le front tourne en localStorage.

---

## 7. Workflow de déploiement

### Modifier le front (cas standard)

```bash
# 1. Modifier le code
# 2. Tester en local
npm run dev

# 3. Commiter et pousser
git add <fichiers modifiés>
git commit -m "feat: description claire"
git push

# 4. Vercel déploie automatiquement (~30-60s)
#    - Branche main  → URL de production
#    - Autres branches → URL de preview
```

### Modifier la base Supabase

Toujours passer par une **migration** (jamais d'écriture manuelle dans le dashboard pour le schéma) :

- Via Claude Code + MCP Supabase : `mcp__supabase__apply_migration`
- Via Supabase CLI en local : `supabase migration new <name>` puis `supabase db push`
- Via SQL Editor du dashboard : utiliser l'onglet **Database → Migrations** pour garder la traçabilité

Les migrations déjà appliquées sont visibles dans le dashboard ou via :
```
mcp__supabase__list_migrations
```

---

## 8. Ressources utiles

- **App déployée** : (à compléter après le premier deploy Vercel)
- **Repo GitHub** : https://github.com/MarketingDevWebexpR/Kairo-planner-polygon
- **Dashboard Vercel** : https://vercel.com/marketing-dev-webexpr/kairo-planner-polygon
- **Dashboard Supabase** : https://supabase.com/dashboard/project/csaequazndafhgotnlif
- **Doc Vite** : https://vitejs.dev
- **Doc Supabase JS** : https://supabase.com/docs/reference/javascript/introduction

---

## 9. Prochaines étapes

- [ ] Brancher le front sur Supabase (`@supabase/supabase-js`)
- [ ] Migrer les données existantes du `localStorage` vers la base
- [ ] Activer Realtime pour la synchro multi-utilisateurs
- [ ] Ajouter Supabase Auth + durcir les RLS
- [ ] Renseigner l'URL Vercel ci-dessus une fois le premier deploy fait
