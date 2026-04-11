---
sidebar_position: 5
---

# Layers

## Qu'est-ce qu'un Layer ?

Un `Layer` est une **recette** pour construire un service.

<!-- prettier-ignore -->
```typescript
Layer<Service, ErreurDeConstruction, DépendancesRequises>
```

Il répond à la question : _"Comment créer une instance de ce service ?"_

Un Layer peut lui-même avoir des dépendances (d'autres services). Effect résout automatiquement toute la chaîne de dépendances.

## Créer des Layers

### `Layer.succeed` — implémentation sans dépendances

<!-- prettier-ignore -->
```typescript
import { Layer, Effect } from "effect";

const LoggingConsole = Layer.succeed(LoggingService, {
  log: (message) => Effect.sync(() => console.log(`[LOG] ${message}`)),
});
```

### `Layer.effect` — implémentation qui utilise des Effects

<!-- prettier-ignore -->
```typescript
const ItemRepositoryHttp = Layer.effect(
  ItemRepository,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient; // dépendance

    return {
      getAll: () =>
        Effect.gen(function* () {
          const r = yield* client.get("http://localhost:3000/items");
          return yield* r.json;
        }),
    };
  })
);
// Type : Layer<ItemRepository, ..., HttpClient.HttpClient>
//                                   ↑ requiert HttpClient
```

### `Layer.scoped` — implémentation avec cycle de vie

Pour des ressources qui doivent être libérées (connexions de base de données, fichiers ouverts) :

<!-- prettier-ignore -->
```typescript
const DatabaseLayer = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const connexion = yield* Effect.acquireRelease(
      openDatabase(),
      (connexion) => closeDatabase(connexion)
    );
    return { query: (sql) => connexion.execute(sql) };
  })
);
// Effect.acquireRelease garantit que closeDatabase est appelé à la fin
```

## Fournir des Layers avec `Effect.provide`

`Effect.provide` résout les dépendances d'un Effect :

<!-- prettier-ignore -->
```typescript
// Avant : dépendance non résolue
const programme: Effect<Items, Err, HttpClient.HttpClient> = fetchItems

// Après : dépendance résolue
const résolu: Effect<Items, Err> = pipe(
  programme,
  Effect.provide(FetchHttpClient.layer)
)

// Exécution possible !
Effect.runPromise(résolu)
```

## Composer des Layers

Les Layers peuvent se composer pour former des Layers plus complexes.

### `Layer.provide` — fournir les dépendances d'un Layer

<!-- prettier-ignore -->
```typescript
// ItemRepositoryHttp a besoin de HttpClient
const AppLayer = pipe(
  ItemRepositoryHttp,
  Layer.provide(FetchHttpClient.layer)
)
// Type : Layer<ItemRepository> — plus de dépendance HttpClient !
```

### `Layer.merge` — combiner plusieurs Layers

<!-- prettier-ignore -->
```typescript
const AppLayer = Layer.merge(
  ConsoleLogging,
  FetchHttpClient.layer
);
// Fournit à la fois LoggingService et HttpClient
```

### `Layer.mergeAll` — combiner N Layers

<!-- prettier-ignore -->
```typescript
const AppLayer = Layer.mergeAll(
  ConsoleLogging,
  FetchHttpClient.layer,
  ConfigLayer,
  DatabaseLayer
);
```

## Le pattern dans l'application finale

Dans `packages/api/server.ts`, toute la composition de l'application :

<!-- prettier-ignore -->
```typescript
// packages/api/server.ts (simplifié)
const ApiLive = pipe(
  HttpRouter.serve(router),
  HttpServer.withLogAddress,
  Layer.provide(ItemRepositoryDrizzle.Default), // Layer du repository
  Layer.provide(DatabaseLive),                   // Layer de la BDD
  Layer.provide(MigratorLive),                   // Layer des migrations
  Layer.provide(NodeHttpServer.layer({ port: 3000 }))
)

// Démarrer l'application
Layer.launch(ApiLive)
```

Chaque `Layer.provide(...)` résout une couche de dépendances. Effect valide que tout est fourni **à la compilation** avant même d'exécuter.

## Pourquoi les Layers ?

| Problème       | Sans Layers                                | Avec Layers                          |
| -------------- | ------------------------------------------ | ------------------------------------ |
| Tests          | Modifier les modules ou mocker globalement | Fournir un Layer de test             |
| Environnements | Variables d'environnement dans le code     | Layer différent par environnement    |
| Cycle de vie   | Gérer manuellement les connexions          | `Layer.scoped` garantit la fermeture |
| Dépendances    | Implicites, cachées                        | Explicites, dans le type             |
