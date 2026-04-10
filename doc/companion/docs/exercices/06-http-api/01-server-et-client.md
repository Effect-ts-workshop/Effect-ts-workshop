---
sidebar_position: 1
---

# Exercice 8 — Construire une HTTP API

## Le problème des APIs non-typées

Dans une API Express classique, le contrat entre le serveur et le client n'existe nulle part dans le code :

```typescript
// Côté serveur — Express
app.get("/hello", (req, res) => {
  res.json("Hello, World!")
})

// Côté client — aucun lien avec le serveur
const response = await fetch("/hello")
const data = await response.json() // type : unknown
```

Si le serveur renomme la route ou change le type de retour, le client ne le saura qu'à l'exécution. Pas d'erreur de compilation, pas d'alerte.

## La solution : un contrat partagé

Effect Platform repose sur une idée simple : **définir l'API une seule fois, s'en servir des deux côtés**.

```
Contrat (HttpApi)
    ↓             ↓
Serveur       Client typé
(handlers)    (HttpApiClient)
```

La construction d'une API Effect se fait en **3 étapes**.

---

## Étape 1 — Déclarer le contrat

Le contrat décrit ce que l'API expose. C'est un objet purement déclaratif, sans logique :

```typescript
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
  )
)
```

Décortiquons :
- `HttpApi.make("MyApi")` — crée l'API nommée `"MyApi"`
- `HttpApiGroup.make("greet")` — groupe d'endpoints nommé `"greet"`
- `HttpApiEndpoint.get("sayHello", "/hello")` — endpoint `GET /hello` nommé `"sayHello"`
- `.addSuccess(Schema.String)` — le type de retour en cas de succès

:::info Aucune logique ici
Le contrat ne fait rien. Il décrit. C'est intentionnel : la séparation entre description et implémentation est le cœur du pattern.
:::

---

## Étape 2 — Implémenter les handlers

`HttpApiBuilder.group` relie le contrat à des Effects :

```typescript
import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"

const MyApiLive = HttpApiBuilder.group(
  MyApi,
  "greet",
  (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
)
```

Chaque handler est un Effect classique. Il peut utiliser des services depuis le contexte, retourner des erreurs typées, utiliser des générateurs — toutes les mécaniques des exercices précédents s'appliquent ici.

---

## Étape 3 — Brancher sur un routeur

On assemble tout avec `Layer.provide`, exactement comme dans l'exercice 5 :

```typescript
import { HttpLayerRouter } from "@effect/platform"
import { Layer, pipe } from "effect"

const apiLayer = pipe(
  HttpLayerRouter.addHttpApi(MyApi),
  Layer.provide(MyApiLive)
)
```

L'API devient un `Layer` comme un autre. Pas encore de serveur démarré — juste une composition déclarative.

---

## Tester sans démarrer de serveur

`HttpLayerRouter.toWebHandler` transforme le layer en un simple handler `Request => Response` en mémoire :

```typescript
const { handler, dispose } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })

const response = await handler(new Request("http://localhost/hello"))
const body = await response.json()
// body : "Hello, World!"
```

Pas de port à ouvrir, pas de processus à démarrer, pas de race condition.

:::info `dispose()` — libérer les ressources
`toWebHandler` initialise le Layer et acquiert ses ressources. `dispose()` les libère proprement à la fin du test.

```typescript
await dispose()
```

Sans `dispose()`, le process peut rester suspendu et les tests s'interférer entre eux. C'est l'équivalent Effect de "fermer le serveur" — et il est asynchrone, d'où le `await`.
:::

---

## Vérifier le contrat de bout en bout avec `HttpApiClient`

`HttpApiClient.make` génère automatiquement un client typé à partir du même contrat :

```typescript
import { FetchHttpClient, HttpApiClient } from "@effect/platform"
import { Effect, Layer, pipe } from "effect"

// On redirige fetch vers notre handler en mémoire
const TestHttpClient = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, (input, init) =>
    handler(new Request(input as string, init))
  ))
)

const program = pipe(
  HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.greet.sayHello()),
  Effect.provide(TestHttpClient)
)

const result = await Effect.runPromise(program)
// result : "Hello, World!"
```

La structure du client reflète le contrat : `client.greet.sayHello()`. Si vous renommez l'endpoint dans `MyApi`, le compilateur signale l'erreur ici **et** côté serveur.

:::tip Le contrat = source de vérité unique
Le même `MyApi` est utilisé pour implémenter les handlers ET pour générer le client. Changer le contrat casse les deux côtés en même temps — c'est la garantie du typage partagé.
:::

---

## Lien avec l'application finale

Dans `packages/api/http.ts`, les handlers réels suivent exactement la même structure :

```typescript
// packages/api/http.ts (simplifié)
export const itemRoutesLive = HttpApiBuilder.group(Api, "items", (handlers) =>
  handlers
    .handle("getAllItems", Effect.fn(function* () {
      const repo = yield* ItemRepository
      const items = yield* repo.getAll()
      return { items }
    }))
    // ...
)
```

Le contrat `Api` est défini dans `packages/shared/api.ts` et importé à la fois par le serveur (`packages/api`) et par le client (`packages/app`). Changer un endpoint dans `shared/api.ts` provoque immédiatement une erreur de compilation des deux côtés.

---

## Exercice

Le fichier `packages/api/_exercices/8-api.spec.ts` contient les tests à faire passer.

**Objectif :**
1. Déclarer un contrat `MyApi` avec un endpoint `GET /hello` qui retourne une `string`.
2. Implémenter le handler qui retourne `"Hello, World!"`.
3. Brancher l'implémentation avec `HttpLayerRouter` et `Layer.provide`.
4. Faire passer le premier test en appelant `handler(new Request(...))`.
5. Faire passer le second test en utilisant `HttpApiClient.make` avec un `TestHttpClient` mocké.

:::tip Ressources

- [Contexte et Services](../../base-de-connaissance/04-contexte-et-services.md)
- [Layers](../../base-de-connaissance/05-layers.md)

:::

---

## Indice 1

<details>
  <summary>La structure du contrat</summary>

```typescript
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
  )
)
```

</details>

## Indice 2

<details>
  <summary>L'implémentation avec HttpApiBuilder</summary>

```typescript
import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"

const MyApiLive = HttpApiBuilder.group(
  MyApi,
  "greet",
  (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
)
```

Le nom du groupe (`"greet"`) et le nom du handler (`"sayHello"`) doivent correspondre exactement à ce qui est déclaré dans le contrat.

</details>

## Indice 3

<details>
  <summary>Construire le TestHttpClient</summary>

```typescript
import { FetchHttpClient } from "@effect/platform"
import { Layer } from "effect"

const TestHttpClient = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(
      FetchHttpClient.Fetch,
      (input, init) => handler(new Request(input as string, init))
    )
  )
)
```

Ce layer remplace la fonction `fetch` native par une fonction qui redirige les requêtes vers le `handler` en mémoire.

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import {
  FetchHttpClient,
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpLayerRouter,
} from "@effect/platform"
import { Effect, Layer, pipe, Schema } from "effect"

// 1. Le contrat
const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
  )
)

// 2. L'implémentation
const MyApiLive = HttpApiBuilder.group(
  MyApi,
  "greet",
  (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
)

// 3. Le layer de routes
const apiLayer = pipe(
  HttpLayerRouter.addHttpApi(MyApi),
  Layer.provide(MyApiLive)
) as Layer.Layer<never>

// Test 1 — appel direct via Request
const { dispose, handler } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })
const response = await handler(new Request("http://localhost/hello"))
const body = await response.json()
// body === "Hello, World!"
await dispose()

// Test 2 — client typé via HttpApiClient
const { dispose: dispose2, handler: handler2 } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })

const TestHttpClient = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, (input, init) =>
    handler2(new Request(input as string, init))
  ))
)

const program = pipe(
  HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.greet.sayHello()),
  Effect.provide(TestHttpClient)
)

const result = await Effect.runPromise(program)
// result === "Hello, World!"
await dispose2()
```

</details>
