# Effect-ts Workshop

Atelier progressif pour découvrir [Effect-ts](https://effect.website) à travers une application fullstack (API Node.js + frontend React).

## Prérequis

- Node.js 20+
- npm 10+
- Docker & Docker Compose

## Démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer les services (base de données + tracing)

```bash
docker compose up -d
```

### 3. Lancer les exercices

Pour suivre les tests en mode watch :

```bash
# Tous les exercices API
npm test --workspace=packages/api

# Tous les exercices frontend
npm test --workspace=packages/app
```

### 4. Lancer l'application complète

```bash
npm run dev
```

## Exercices

Les exercices se trouvent dans les dossiers `_exercices/` de chaque package :

| #   | Thème                       | Fichier                                              |
| --- | --------------------------- | ---------------------------------------------------- |
| 1   | Bases (sync / async / pipe) | `packages/api/_exercices/1-base.spec.ts`             |
| 2   | Gestion d'erreurs           | `packages/api/_exercices/2-errors.spec.ts`           |
| 3   | Signal                      | `packages/api/_exercices/3-signal.spec.ts`           |
| 4   | Pattern Matching            | `packages/api/_exercices/4-pattern-matching.spec.ts` |
| 5   | Contexte & Services         | `packages/api/_exercices/5-context-layer.spec.ts`    |
| 6   | Générateurs & Effect.fn     | `packages/api/_exercices/6-generators.spec.ts`       |
| 7   | Schema & Validation         | `packages/api/_exercices/7-schema.spec.ts`           |
| 8   | API HTTP                    | `packages/api/_exercices/8-api.spec.ts`              |
| 9   | Base de données (SQL)       | `packages/api/_exercices/9-sql.spec.ts`              |
| 10  | Atom State                  | `packages/app/_exercices/10-atom.spec.ts`            |
| 11  | Client API typé             | `packages/app/_exercices/11-api-client.spec.ts`      |
| 12  | Formulaires                 | `packages/app/_exercices/12-form.spec.ts`            |

## Documentation

La documentation ici [Effect ts Companion](https://effect-ts-workshop.github.io/Effect-ts-workshop/)

## Outils inclus

- **Effect Language Service Plugin** — meilleure expérience TypeScript dans VSCode
- **Tracing / Logs** — [Signoz](http://localhost:9999) (email: `admin@signoz.local`, mot de passe: `admin123`)
- **Base de données** — PostgreSQL sur le port `5433`
