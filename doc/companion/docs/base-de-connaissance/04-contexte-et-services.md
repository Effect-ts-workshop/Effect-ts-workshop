---
sidebar_position: 4
---

# Contexte et Services

## Le problème des dépendances implicites

<!-- prettier-ignore -->
```typescript
// Cette fonction dépend implicitement de fetch (navigateur)
// et de console (Node.js ou navigateur)
async function fetchItems(): Promise<Item[]> {
  console.log("Fetching...");                    // dépendance cachée
  const r = await fetch("http://localhost/api"); // dépendance cachée
  return r.json();
}
```

Ces dépendances sont invisibles dans le type `Promise<Item[]>`. Impossible de les tester sans les mocker globalement, ni de les remplacer sans modifier le code.

## La solution : le Contexte Effect

Le troisième paramètre de `Effect<A, E, R>` est le **Contexte** (aussi appelé _Requirements_). Dans le monde effect la fonction `fetchItems` aurait par exmeple la signature suivante :

<!-- prettier-ignore -->
```typescript
Effect.Effect<Item[], ErreurAPI, HttpClient.HttpClient | LoggingService>
//                                            ↑               ↑
//                                "J'ai besoin de ces deux services"
```

Toutes les dépendances sont **visibles dans le type**. Une fois celui-ci déclaré impossible d'oublier d'en fournir une.

## `Context.GenericTag` — créer un service

Un `Tag` est l'identifiant d'un service dans le contexte Effect. C'est la "clé" qui permet de retrouver l'implémentation.

<!-- prettier-ignore -->
```typescript
import { Context, Effect } from "effect";

// 1. Définir l'interface (le contrat du service)
interface LoggingService {
  log: (message: string) => Effect.Effect<void>;
}

// 2. Créer le Tag
const LoggingService = Context.GenericTag<LoggingService>("LoggingService");
//                                                                ↑
//                                                       Nom unique du service
```

Le nom du service doit être **unique** dans toute l'application. Il apparaît dans les erreurs si vous oubliez de fournir le service.

## Utiliser un service avec `yield*`

Dans `Effect.gen`, `yield*` extrait le service du contexte :

<!-- prettier-ignore -->
```typescript
const myProgram = Effect.gen(function* () {
  const logger = yield* LoggingService;  // Récupère le service
  yield* logger.log("Hello !");          // Utilise le service
});

// Type : Effect<void, never, LoggingService>
//                             ↑
//                  LoggingService requis dans le contexte
```

## `Effect.Service` — la façon moderne

Effect fournit `Effect.Service` pour créer des services de façon plus concise :

<!-- prettier-ignore -->
```typescript
import { Effect } from "effect";

class ItemRepository extends Effect.Service<ItemRepository>()("ItemRepository", {
  // Implémentation par défaut (peut être surchargée)
  effect: Effect.gen(function* () {
    return {
      getAll: () => Effect.succeed([] as Item[]),
      findById: (id: string) => Effect.succeed(Option.none()),
    };
  }),
}) {}
```

C'est le pattern utilisé dans `packages/api/db/item-repository.ts`.

## Combiner plusieurs services

Les services dans le contexte s'**additionnent** automatiquement :

<!-- prettier-ignore -->
```typescript
const program = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  const logger = yield* LoggingService;

  yield* logger.log("Démarrage de la requête");
  const response = yield* client.get("http://localhost/api");
  yield* logger.log("Requête terminée");

  return yield* response.json;
});

// Type : Effect<unknown, ..., HttpClient.HttpClient | LoggingService>
//                              ↑ Les deux services sont requis ↑
```

## Pattern dans l'application finale

Dans `packages/api/db/item-repository-drizzle.ts` :

<!-- prettier-ignore -->
```typescript
// Un service qui dépend de la base de données
class ItemRepositoryDrizzle extends Effect.Service<ItemRepositoryDrizzle>()(
  "ItemRepositoryDrizzle",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database; // Dépendance sur Database

      return {
        getAll: Effect.fn("getAll")(function* () {
          return yield* Effect.promise(() =>
            db.select().from(itemsTable)
          );
        }),
        // ...
      };
    }),
  }
) {}
```

Le service `ItemRepositoryDrizzle` déclare sa dépendance sur `Database` via `yield*`. Effect l'enregistre automatiquement dans le contexte.
