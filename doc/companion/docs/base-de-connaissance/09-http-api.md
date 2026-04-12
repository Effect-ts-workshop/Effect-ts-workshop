---
sidebar_position: 9
---

# HTTP API

## L'approche Effect : contrat d'abord

Dans Effect, une API HTTP se définit en trois étapes distinctes :

```
1. Contrat   → ce que l'API expose (endpoints, schémas)
2. Handlers  → l'implémentation de chaque endpoint
3. Routeur   → assemblage du tout
```

Cette séparation permet de partager le contrat entre le serveur et le client — les deux parlent le même langage, et le compilateur détecte toute divergence.

## Étape 1 — Déclarer le contrat avec `HttpApi`

<!-- prettier-ignore -->
```typescript
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("users").add(
    HttpApiEndpoint.get("getUser", "/users/:id")
      .addSuccess(UserSchema)
      .addError(Schema.String, { status: 404 })
  )
);
```

- `HttpApi.make` — crée l'API, identifiée par un nom
- `HttpApiGroup.make` — groupe d'endpoints (correspond à un domaine métier)
- `HttpApiEndpoint.get/post/put/delete` — un endpoint avec sa méthode et son chemin
- `.addSuccess(Schema)` — le type de la réponse en cas de succès
- `.addError(Schema, { status })` — un type d'erreur avec son code HTTP

Le contrat est un objet **purement déclaratif** — il ne fait rien par lui-même.

## Étape 2 — Implémenter les handlers avec `HttpApiBuilder`

<!-- prettier-ignore -->
```typescript
import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";

const MyApiLive = HttpApiBuilder.group(MyApi, "users", (handlers) =>
  handlers.handle("getUser", ({ path }) =>
    Effect.gen(function* () {
      const user = yield* UserRepository.findById(path.id);
      return user;
    })
  )
);
```

Chaque handler est un **Effect classique**. Il peut :

- `yield*` des services depuis le contexte (repository, HttpClient…)
- retourner des erreurs typées
- utiliser toutes les mécaniques Effect vues dans les exercices précédents

## Étape 3 — Assembler avec `HttpLayerRouter`

<!-- prettier-ignore -->
```typescript
import { HttpLayerRouter } from "@effect/platform";
import { Layer, pipe } from "effect";

const apiLayer = pipe(
  HttpLayerRouter.addHttpApi(MyApi),
  Layer.provide(MyApiLive)
) as Layer.Layer<never>;
```

L'API devient un `Layer` — elle se compose avec les autres services exactement comme dans l'exercice 5.

## Tester sans serveur avec `toWebHandler`

`HttpLayerRouter.toWebHandler` transforme le Layer en un simple handler `(Request) => Response`. Pas de port à ouvrir, pas de processus à démarrer :

<!-- prettier-ignore -->
```typescript
const { handler, dispose } = HttpLayerRouter.toWebHandler(apiLayer);

const response = await handler(new Request("http://localhost/users/42"));
const body = await response.json();
// → { id: "42", name: "Alice" }

await dispose(); // libère les ressources
```

C'est une technique centrale dans Effect Platform : **les tests unitaires d'API ne nécessitent pas de réseau**.

## Consommer l'API avec `HttpApiClient`

`HttpApiClient.make` génère un client TypeScript typé à partir du même contrat :

<!-- prettier-ignore -->
```typescript
import { HttpApiClient } from "@effect/platform";
import { Effect, pipe } from "effect";

const program = pipe(
  HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.users.getUser({ path: { id: "42" } }))
);
```

La structure du client reflète l'organisation en groupes : `client.users.getUser(...)`. Si un endpoint est renommé dans le contrat, le compilateur signale l'erreur ici.

## Le contrat partagé

Dans le projet, le contrat vit dans `packages/shared/api.ts`. Serveur et client l'importent tous les deux :

```
          packages/shared/api.ts   // source de vérité
            ↓                ↓
packages/api/http.ts     packages/app/src/lib/client.ts
(implémentation)         (consommation)
```

Modifier un endpoint dans `shared` provoque immédiatement une erreur de compilation des deux côtés.

## Récapitulatif

| Brique                 | Rôle                                    |
| ---------------------- | --------------------------------------- |
| `HttpApi`              | Définit l'API (nom + groupes)           |
| `HttpApiGroup`         | Regroupe les endpoints par domaine      |
| `HttpApiEndpoint`      | Déclare une route avec son contrat      |
| `HttpApiBuilder.group` | Implémente les handlers                 |
| `HttpLayerRouter`      | Assemble et expose l'API                |
| `HttpApiClient`        | Génère un client typé depuis le contrat |
