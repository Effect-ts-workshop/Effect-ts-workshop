---
sidebar_position: 2
---

# Exercice 8 — Fournir les dépendances avec Layer

## Le problème non résolu

À la fin de l'exercice précédent, on avait un Effect avec une dépendance non résolue :

```typescript
// Type : Effect<{ items: Item[] }, RequestError, HttpClient.HttpClient>
const fetchTousLesItems = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  // ...
});

// ❌ Impossible d'exécuter sans fournir HttpClient
```

Il faut **fournir** l'implémentation. C'est le rôle des **Layers**.

## Qu'est-ce qu'un Layer ?

Un `Layer` est une **recette** pour construire un service.

Il répond à la question : _"Comment créer une instance de ce service ?"_

```
Layer<Service, ErreurDeConstruction, DépendancesRequises>
```

Pensez à un Layer comme à une factory qui peut elle-même avoir des dépendances.

## `Effect.provide` — brancher un Layer

`Effect.provide` prend un Effect avec des dépendances et les résout avec un Layer :

```typescript
import { FetchHttpClient } from "@effect/platform";
import { Effect } from "effect";

// L'Effect qui demande HttpClient
const fetchTousLesItems = /* ... (exercice précédent) */;

// On fournit l'implémentation basée sur fetch du navigateur
const program = fetchTousLesItems.pipe(
  Effect.provide(FetchHttpClient.layer)
);

// Type : Effect<{ items: Item[] }, RequestError>
//                                              ↑
//                               HttpClient n'apparaît plus ! Il est résolu.
```

`FetchHttpClient.layer` est un Layer fourni par Effect Platform qui implémente `HttpClient.HttpClient` en utilisant l'API `fetch` native du navigateur (ou de Node.js).

:::tip Visualisation
```
fetchTousLesItems    →   Effect<Items, Err, HttpClient>
  + FetchHttpClient.layer
                     →   Effect<Items, Err>        (dépendance résolue !)
  + Effect.runPromise
                     →   Promise<Items>             (exécuté !)
```
:::

## Créer votre propre Layer

Reprenons le `LoggingService` de l'exercice précédent :

```typescript
import { Context, Effect, Layer } from "effect";

interface LoggingService {
  log: (message: string) => Effect.Effect<void>;
}

const LoggingService = Context.GenericTag<LoggingService>("LoggingService");

// Implémentation console
const ConsoleLogging = Layer.succeed(
  LoggingService,
  {
    log: (message) => Effect.sync(() => console.log(`[LOG] ${message}`)),
  }
);

// Implémentation silencieuse pour les tests
const SilentLogging = Layer.succeed(
  LoggingService,
  {
    log: (_message) => Effect.void,
  }
);
```

Maintenant on peut choisir l'implémentation selon l'environnement :

```typescript
const monProgram = Effect.gen(function* () {
  const logger = yield* LoggingService;
  yield* logger.log("Hello !");
});

// En production
Effect.runPromise(monProgram.pipe(Effect.provide(ConsoleLogging)));
// "[LOG] Hello !"

// En tests
Effect.runPromise(monProgram.pipe(Effect.provide(SilentLogging)));
// (silence)
```

## Composer des Layers

Les Layers peuvent dépendre d'autres Layers et se composer :

```typescript
// Un service qui dépend d'un autre
const DatabaseService = Context.GenericTag<DatabaseService>("DatabaseService");

const DatabaseLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    return {
      query: (sql: string) => Effect.promise(() => db.execute(sql)),
    };
  })
);

// Composer DatabaseLive avec sa dépendance ConfigLive
const AppLayer = DatabaseLive.pipe(Layer.provide(ConfigLive));
```

## Lien avec l'application finale

Dans `packages/api/server.ts`, toute la composition des Layers est visible :

```typescript
// packages/api/server.ts (simplifié)
const ApiLive = HttpRouter.serve(router).pipe(
  Layer.provide(ItemRepositoryDrizzle.Default),  // Repository
  Layer.provide(DatabaseLive),                    // Base de données
  Layer.provide(MigratorLive),                    // Migrations
  Layer.provide(NodeHttpServer.layer({ port: 3000 }))
);
```

Chaque `Layer.provide(...)` résout des dépendances. C'est la composition de toute l'application !

## Exercice

Créez un service `ItemService` simple avec deux implémentations différentes.

**Objectif :**
1. Créer un `Context.GenericTag<ItemService>` avec une méthode `getAll`.
2. Créer `ItemServiceMock` (retourne des données en dur avec `Layer.succeed`).
3. Créer `ItemServiceHttp` (appelle `fetchTousLesItems` de l'exercice 7).
4. Exécuter le programme avec les deux implémentations.

:::tip Ressources

- [Contexte et Services](../../base-de-connaissance/04-contexte-et-services.md)
- [Layers](../../base-de-connaissance/05-layers.md)

:::

## Indice 1

<details>
  <summary>Définir l'interface et le Tag</summary>

```typescript
import { Context, Effect, Layer } from "effect";

type Item = { id: string; brand: string; model: string };

interface ItemService {
  getAll: () => Effect.Effect<Item[]>;
}

const ItemService = Context.GenericTag<ItemService>("ItemService");
```

</details>

## Indice 2

<details>
  <summary>Créer le Layer mock avec des données en dur</summary>

```typescript
const ItemServiceMock = Layer.succeed(ItemService, {
  getAll: () =>
    Effect.succeed([
      { id: "1", brand: "Nike", model: "Air Max" },
      { id: "2", brand: "Adidas", model: "Stan Smith" },
    ]),
});
```

</details>

## Indice 3

<details>
  <summary>Utiliser le service dans un programme</summary>

```typescript
const afficherItems = Effect.gen(function* () {
  const service = yield* ItemService;
  const items = yield* service.getAll();
  console.log("Items:", items);
});

// Exécuter avec le mock
Effect.runPromise(afficherItems.pipe(Effect.provide(ItemServiceMock)));
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Context, Effect, Layer } from "effect";
import { HttpClient, FetchHttpClient } from "@effect/platform";

type Item = { id: string; brand: string; model: string };

// --- Service Interface & Tag ---
interface ItemService {
  getAll: () => Effect.Effect<Item[]>;
}
const ItemService = Context.GenericTag<ItemService>("ItemService");

// --- Implémentation Mock ---
const ItemServiceMock = Layer.succeed(ItemService, {
  getAll: () =>
    Effect.succeed([
      { id: "1", brand: "Nike", model: "Air Max" },
      { id: "2", brand: "Adidas", model: "Stan Smith" },
    ]),
});

// --- Implémentation HTTP ---
const ItemServiceHttp = Layer.effect(
  ItemService,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    return {
      getAll: () =>
        Effect.gen(function* () {
          const response = yield* client.get("http://localhost:3000/items");
          const data = yield* response.json;
          return (data as { items: Item[] }).items;
        }),
    };
  })
);

// --- Programme ---
const afficherItems = Effect.gen(function* () {
  const service = yield* ItemService;
  const items = yield* service.getAll();
  console.log("Items:", items);
});

// Exécuter avec le mock
console.log("=== Mock ===");
Effect.runPromise(afficherItems.pipe(Effect.provide(ItemServiceMock)));

// Exécuter avec l'HTTP (si l'API tourne)
console.log("=== HTTP ===");
Effect.runPromise(
  afficherItems.pipe(
    Effect.provide(ItemServiceHttp),
    Effect.provide(FetchHttpClient.layer)
  )
);
```

</details>
