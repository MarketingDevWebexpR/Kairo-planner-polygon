# Kairo Planning — Récap complet du projet

> Document de référence à jour au **30 avril 2026**.
> Synthèse complète : ce que le projet est, comment il est organisé, comment il
> est hébergé, ce qui a été construit, et ce qui reste à faire.

---

## 1. Présentation

**Kairo** (anciennement "Polygon planning") est un outil interne de planning
hebdomadaire et mensuel pour une équipe de ~6 personnes (équipe produit
WebexpR). Il permet de :

- Visualiser qui travaille sur quoi, semaine par semaine ou mois par mois
- Affecter des tâches à un membre, un client, sur une période donnée
- Gérer les absences (congés, RTT, maladie, formation, télétravail, etc.)
- Filtrer par membre / par client
- Soumettre des retours utilisateurs centralisés en BDD

---

## 2. Stack technique

| Couche | Techno | Rôle |
|---|---|---|
| UI | React 18 (JS, pas TS) | Composants, état, rendu |
| Build / dev | Vite 5 | Hot reload + bundle prod |
| Hébergement front | Vercel | Auto-deploy sur `git push` main |
| Backend | Supabase (Postgres 15) | BDD + API REST + Realtime |
| Sync temps réel | Supabase Realtime | Diffusion des changements live |
| Versionning | Git + GitHub | Repo `MarketingDevWebexpR/Kairo-planner-polygon` |

---

## 3. Architecture

```
                 ┌─────────────────────────┐
                 │   Navigateur (user)     │
                 └────────────┬────────────┘
                              │ HTTPS
                              ▼
                 ┌─────────────────────────┐
                 │     Vercel (CDN)        │   ← bundle Vite/React
                 │  kairo-planner-polygon  │     (HTML / JS / CSS)
                 └────────────┬────────────┘
                              │ HTTPS REST + WebSocket Realtime
                              ▼
                 ┌─────────────────────────┐
                 │     Supabase            │
                 │  Postgres + API + RLS   │
                 │  Realtime broadcast     │
                 └─────────────────────────┘
              project_ref: csaequazndafhgotnlif
```

- **Front** : SPA Vite, statique, déployée automatiquement à chaque push
  sur la branche `main`
- **Backend** : Postgres managé par Supabase, communique via API REST + WebSocket
- **Source unique de vérité** : la BDD Supabase. Les données sont partagées
  entre tous les utilisateurs ; les prefs UI restent en `localStorage`

---

## 4. Organisation du code

```
2026-Outil-planning-polygon/
├── README.md                  ← documentation détaillée
├── RECAP.md                   ← ce fichier
├── index.html                 ← entrée Vite
├── vite.config.js             ← config minimaliste (plugin React)
├── package.json               ← deps
├── public/
│   ├── logo-polygon.png
│   └── logo-kairo.png
└── src/
    ├── main.jsx               ← bootstrap React
    ├── App.jsx                ← état global + composition
    │
    ├── data.js                ← constantes (palette 24 couleurs,
    │                            absences, fériés, helpers de date)
    ├── supabase.js            ← client Supabase (clé publishable hardcodée)
    ├── api.js                 ← CRUD helpers + mappers DB ↔ front
    ├── useKairoData.js        ← hook unique : load + Realtime + mutators
    │
    ├── Sidebar.jsx            ← clients + équipe + filtres + add/edit
    ├── WeekView.jsx           ← grille semaine (5 jours, drag & drop)
    ├── MonthView.jsx          ← grille mois + popover overflow
    ├── TaskModal.jsx          ← création / édition tâche & absence
    ├── ConfirmModal.jsx       ← modale de confirmation générique
    ├── FeedbackModal.jsx      ← "Améliorer Kairo" → Supabase
    ├── icons.jsx              ← icônes SVG inline
    └── styles.css             ← styles globaux
```

### Logique applicative — où chercher quoi

| Besoin | Fichier |
|---|---|
| Modifier la palette de couleurs des clients | `src/data.js` (`PALETTE`) |
| Ajouter / retirer un motif d'absence | `src/data.js` (`ABSENCE_REASONS`) + check SQL côté DB |
| Ajouter un jour férié | `src/data.js` (`holidaysFor`) |
| Tâche / Absence : règles de création | `src/TaskModal.jsx` |
| Vue semaine | `src/WeekView.jsx` |
| Vue mois | `src/MonthView.jsx` |
| État global / orchestration | `src/App.jsx` |
| Lecture / écriture DB | `src/api.js` + `src/useKairoData.js` |
| Realtime sync | `src/useKairoData.js` (subscription canal `kairo-data`) |

---

## 5. Hébergement & infra

### GitHub

- **Repo** : https://github.com/MarketingDevWebexpR/Kairo-planner-polygon
- **Branche principale** : `main`
- **Workflow** : commits directs sur main → déclenche un déploiement Vercel
- **Auth** : `gh` CLI configuré avec OAuth GitHub (token dans le keychain macOS)

### Vercel

- **Projet** : `kairo-planner-polygon` (équipe *Marketing Dev WebexpR*, plan Pro)
- **URL prod** : https://kairo-planner-polygon.vercel.app
- **Dashboard** : https://vercel.com/marketing-dev-webexpr/kairo-planner-polygon
- **Détection automatique** du framework (Vite) — aucun `vercel.json` nécessaire
- **Variables d'environnement** : aucune. La clé Supabase publishable est
  hardcodée dans `src/supabase.js` (volontairement, cf. décision §11)
- **Auto-deploy** :
  - Push sur `main` → déploiement de production (~30-60 s)
  - Push sur autre branche → preview URL automatique

### Supabase

- **Project ref** : `csaequazndafhgotnlif`
- **API URL** : `https://csaequazndafhgotnlif.supabase.co`
- **Dashboard** : https://supabase.com/dashboard/project/csaequazndafhgotnlif
- **Région** : (par défaut)
- **Auth** : non activée (cf. §11)

---

## 6. Schéma Supabase

Quatre tables, toutes avec **RLS activée** et trigger `updated_at` automatique.

### `members` — Équipe

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `name` | text | non vide |
| `initials` | text | 1 à 3 caractères |
| `display_order` | integer | tri d'affichage |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto via trigger |

### `clients` — Clients

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `name` | text UNIQUE | non vide |
| `color` | text | OKLCH string |
| `hue` | smallint | 0–360 |
| `created_at` / `updated_at` | timestamptz | auto |

### `tasks` — Tâches **et** absences (table unifiée par `kind`)

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `kind` | text | `'task'` ou `'absence'` |
| `member_id` | uuid FK | → `members(id)` ON DELETE CASCADE |
| `title` | text | requis si `kind='task'` |
| `client_id` | uuid FK | → `clients(id)` CASCADE, requis si `kind='task'` |
| `notes` | text | défaut `''` |
| `reason` | text | requis si `kind='absence'` (`conges`, `rtt`, `maladie`, `formation`, `teletravail`, `autre`) |
| `start_date` | date | début |
| `end_date` | date | ≥ `start_date` |
| `half` | text | `'am'` ou `'pm'`, uniquement sur 1 jour |
| `created_at` / `updated_at` | timestamptz | auto |

Indexes : `member_id`, `client_id`, `(start_date, end_date)`, `kind`.

### `feedbacks` — Retours utilisateurs

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `type` | text | `'bug'` ou `'evolution'` |
| `author_name` | text | nullable |
| `description` | text | non vide |
| `url` | text | URL d'où vient le feedback |
| `user_agent` | text | navigateur de l'utilisateur |
| `created_at` | timestamptz | auto |

**RLS** : INSERT autorisé pour tout le monde, SELECT bloqué (consultation
uniquement via le dashboard Supabase).

---

## 7. Historique des migrations Supabase (chronologique)

| # | Nom | Contenu |
|---|---|---|
| 1 | `init_planning_schema` | Création des 3 tables members, clients, tasks + contraintes + RLS dev + trigger updated_at |
| 2 | `seed_default_members_and_clients` | Insertion des 6 membres + 4 clients par défaut |
| 3 | `harden_set_updated_at_search_path` | Sécurisation du trigger (`search_path` figé) |
| 4 | `add_feedbacks_table` | Création table `feedbacks` + policy INSERT-only pour anon |
| 5 | `enable_realtime_on_planning_tables` | Ajout des 3 tables au publication `supabase_realtime` |

À voir dans le dashboard : Settings → Database → Migrations.

---

## 8. Historique des features (commits)

Ordre chronologique de la session :

| Commit | Description |
|---|---|
| `ec45bbd` | **Initial commit** — Vite + React + structure de base |
| `a72bd66` | **README détaillé** — doc d'archi et de hosting |
| `39eb7bc` | **Palette 24 couleurs + jours fériés français** — picker visuel pour les clients (8×3 grid), grisé léger sur les fériés (calculs de Pâques inclus) |
| `443c569` | **Fix z-index** — les pills d'absence passent au-dessus du fond gris des fériés |
| `872e1e7` | **Feedback → Supabase** — création table `feedbacks`, abandon du `mailto:` |
| `1dcf466` | **Hardcode des clés Supabase** — abandon des env vars Vercel |
| `0ad1817` | **Confirmation feedback visible** — bouton "Fermer" manuel au lieu d'auto-close |
| `1a584b3` | **Copy plus chaleureux** dans la modale de confirmation feedback |
| `756b774` | **Migration data sur Supabase** — members + clients + tasks en BDD partagée + Realtime |

---

## 9. Liens utiles

- **App prod** : https://kairo-planner-polygon.vercel.app
- **Repo** : https://github.com/MarketingDevWebexpR/Kairo-planner-polygon
- **Dashboard Vercel** : https://vercel.com/marketing-dev-webexpr/kairo-planner-polygon
- **Dashboard Supabase** : https://supabase.com/dashboard/project/csaequazndafhgotnlif
- **Table editor Supabase** : https://supabase.com/dashboard/project/csaequazndafhgotnlif/editor
- **Doc Vite** : https://vitejs.dev
- **Doc Supabase JS** : https://supabase.com/docs/reference/javascript

---

## 10. Commandes utiles

```bash
# Dev local (hot reload sur :5173)
npm run dev

# Build de prod
npm run build

# Servir le build local pour vérifier avant push
npm run preview

# Pousser une modif (déclenche un deploy Vercel automatique)
git add <fichiers>
git commit -m "type: description courte"
git push
```

Pour modifier la BDD Supabase, **toujours passer par une migration** (jamais
modifier directement le schéma dans le dashboard) :

- Via Claude Code + MCP Supabase : `mcp__supabase__apply_migration`
- Via Supabase CLI : `supabase migration new <name>` puis `supabase db push`

---

## 11. Décisions techniques notables

### a. Clés Supabase hardcodées dans le code (pas d'env vars)

Choix volontaire pour simplifier le déploiement Vercel — l'utilisateur
n'a pas besoin de configurer quoi que ce soit, ça marche dès le premier
push. La clé `sb_publishable_*` est conçue pour être publique et est
visible dans le bundle JS de toute façon. La sécurité repose entièrement
sur la RLS côté Postgres.

### b. RLS actuelle = policies "dev_all" (volontairement permissives)

Toutes les tables (sauf feedbacks) ont des policies `*_dev_all` qui
autorisent **tout** pour `anon` + `authenticated`. C'est un **risque
connu** :

- N'importe quel visiteur de l'app peut récupérer la clé dans les
  DevTools et faire des appels API arbitraires (lire/écrire/supprimer)
- Pas critique pour un outil interne avec ~6 utilisateurs et de la donnée
  non sensible
- À durcir avant tout élargissement à d'autres équipes ou ajout
  d'informations sensibles

**Plan de durcissement futur** :
1. Brancher Supabase Auth (magic link recommandé)
2. Optionnel : restreindre aux emails `@webexpr.fr` via un trigger ou
   policy `using (auth.email() like '%@webexpr.fr')`
3. Remplacer les `*_dev_all` par `using (auth.uid() is not null)`

### c. Tables `tasks` unifiées (task + absence dans la même table)

Une seule table avec une colonne `kind`. Avantages :
- Une seule source de vérité pour les périodes de présence d'un membre
- Indexes partagés (member_id, dates) → requêtes plus simples
- Cascade delete uniforme via la FK member_id

Les contraintes CHECK garantissent la cohérence selon le `kind` (titre +
client_id pour task, reason pour absence).

### d. Tasks référencent `client_id` (UUID), pas le nom

Choix fait lors de la migration vers Supabase. Avantages :
- Renommer un client n'invalide plus les références
- Cohérence relationnelle (FK + cascade)
- Plus de bug "le client n'existe plus" en cas de désync

### e. Realtime au lieu d'un mécanisme de polling

Pour 6 utilisateurs concurrents, Realtime via WebSocket est gratuit côté
ressources Supabase et donne une UX live sans effort. Le hook
`useKairoData` filtre les "echos" de ses propres écritures (via
`lastWriteIdsRef`) pour éviter les doublons d'optimistic update.

### f. Feedback Modal en dur dans Supabase + fallback `mailto:`

La modale tente toujours d'insérer dans `feedbacks`. Si la requête
échoue (réseau, RLS, etc.), un bouton "Envoyer par mail à la place"
apparaît avec `mailto:` vers `ltournier@webexpr.fr`. Ceinture +
bretelles.

---

## 12. Roadmap / À faire

Aucun bug connu à ce jour. Les pistes d'évolution non urgentes :

- [ ] **Sécurité** — Brancher Supabase Auth + durcir RLS (cf. §11.b)
- [ ] **UX** — Drag-and-drop testé manuellement uniquement (Playwright n'a
      pas l'outil pour l'auto-tester)
- [ ] **Mobile** — Pas testé / pas optimisé pour mobile (l'outil est
      pensé desktop)
- [ ] **Accessibilité** — Audit clavier + lecteur d'écran à faire
- [ ] **Notifications** — Optionnel : alertes Slack quand un feedback
      arrive (via Edge Function Supabase + webhook)
- [ ] **Filtres avancés** — Recherche texte sur les titres de tâches
- [ ] **Export** — PDF du planning, ICS pour s'abonner depuis un calendrier
      perso
- [ ] **Gestion des fériés Alsace-Moselle** (si pertinent un jour)

---

## 13. Glossaire technique

- **OKLCH** : espace de couleur (Lightness / Chroma / Hue) utilisé dans
  toute la palette. Plus uniforme perceptuellement que HSL/RGB.
- **RLS (Row Level Security)** : feature Postgres qui filtre les lignes
  visibles/modifiables selon des policies définies au niveau de la table.
  Indispensable quand l'API est exposée au client (Supabase).
- **Publishable key** vs **service_role key** : la première est publique
  et utilisable côté front (RLS s'applique). La seconde bypasse RLS et
  ne doit JAMAIS sortir du serveur.
- **Realtime** : système de Supabase qui broadcast en WebSocket les
  changements d'une table aux clients abonnés.
- **HMR** : Hot Module Replacement de Vite — recharge le code modifié
  sans recharger la page entière.
