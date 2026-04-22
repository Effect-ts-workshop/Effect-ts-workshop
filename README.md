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

### 2. Lancer les exercices

Pour suivre les tests en mode watch :

```bash
npm run test
```

## Exercices

Les exercices se trouvent dans les dossiers `_exercices/` de chaque package.

**Les fondations - du type `Effect` aux services :**

| #   | Thème            | Fichier                                              |
| --- | ---------------- | ---------------------------------------------------- |
| 1   | Bases            | `packages/api/_exercices/1-base.spec.ts`             |
| 2   | Erreurs          | `packages/api/_exercices/2-errors.spec.ts`           |
| 3   | Interruption     | `packages/api/_exercices/3-interruption.spec.ts`     |
| 4   | Pattern Matching | `packages/api/_exercices/4-pattern-matching.spec.ts` |
| 5   | Context & Layer  | `packages/api/_exercices/5-context-layer.spec.ts`    |
| 6   | Générateurs      | `packages/api/_exercices/6-generators.spec.ts`       |
| 7   | Schema           | `packages/api/_exercices/7-schema.spec.ts`           |

**En pratique - appliquer ces concepts à une vraie application :**

| #   | Thème      | Fichier                                          |
| --- | ---------- | ------------------------------------------------ |
| 8   | HTTP API   | `packages/api/_exercices/8-api.spec.ts`          |
| 9   | SQL        | `packages/api/_exercices/9-sql.spec.ts`          |
| 10  | API Client | `packages/app/_exercices/10-api-client.spec.tsx` |
| 11  | Atom       | `packages/app/_exercices/11-atom.spec.tsx`       |
| 12  | Form       | `packages/app/_exercices/12-form.spec.tsx`       |

## Fullstack App

Le repository contient une application fullstack complète (API REST + frontend React) à titre d'exemple. À la fin de l'atelier, vous aurez toutes les clés pour en construire une similaire.

<details>
<summary>Lancer l'application d'example (API + Frontend)</summary>

```bash
docker compose up -d
npm run dev
```

Services disponibles :

- API : http://localhost:3000
- App : http://localhost:5173
- Documentation API : http://localhost:3000/docs
- Traces : http://localhost:16686/search?service=api (Jaeger UI)

</details>

## Documentation

La documentation ici [Effect ts Companion](https://effect-ts-workshop.github.io/Effect-ts-workshop/)

## Outils inclus

- **Effect Language Service Plugin** - meilleure expérience TypeScript dans VSCode
- **Tracing / Logs** - [Jaeger](http://localhost:16686/search?service=api)
- **Base de données** - PostgreSQL sur le port `5433`
