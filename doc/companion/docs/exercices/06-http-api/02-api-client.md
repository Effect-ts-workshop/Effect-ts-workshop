---
sidebar_position: 2
---

# Exercice 10 — Consommer l'API depuis le client

## Le problème des appels réseau non typés

Voici comment on consomme une API sans Effect :

```typescript
const response = await fetch("/api/items")
const data = await response.json() // type : unknown — aucune garantie
```

Le contrat défini côté serveur (les routes, les types de retour) est **invisible côté client**. Si l'API change, le client ne le saura qu'à l'exécution. Et si on veut tester sans serveur réel, il faut écrire le mock à la main.

## La solution : `HttpApiClient`

`HttpApiClient.make` génère un client typé **directement depuis le contrat** défini dans `packages/shared/api.ts`. La structure du client reflète l'organisation en groupes :

```
Api
└── groupe "items"
    ├── getAllItems    → client.items.getAllItems()
    ├── getItemById   → client.items.getItemById({ path: { itemId } })
    ├── addItem       → client.items.addItem({ payload: { ... } })
    └── removeItemById
```

Si vous renommez un endpoint dans `shared/api.ts`, le compilateur signale l'erreur ici immédiatement.

## Tester sans serveur réel

Pour les tests, on intercepte `fetch` avec un mock et on le branche sur `FetchHttpClient` :

```typescript
import { FetchHttpClient } from "@effect/platform"
import { Layer } from "effect"

const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
  if (input.toString().endsWith("/items")) {
    return new Response(
      JSON.stringify({ items: [ITEM_1, ITEM_2] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }
  return new Response(null, { status: 404 })
}

const TestHttpClient = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, mockFetch))
)
```

C'est la même mécanique que dans l'exercice 8 (test 2) — on substitue l'implémentation de `fetch` dans le contexte Effect.

:::info Encodage de `Option` en JSON
Le contrat déclare `getItemById` avec `addSuccess(Schema.Option(InventoryItemSchema))`.

Effect encode `Option.some(item)` en JSON sous la forme `{ "_tag": "Some", "value": {...} }`. `HttpApiClient` le désérialise automatiquement en `Option<InventoryItem>` côté TypeScript.
:::

## Appeler l'API avec `HttpApiClient`

```typescript
import { HttpApiClient } from "@effect/platform"
import { Effect, pipe } from "effect"
import { Api } from "shared/api"

// Appel simple
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getAllItems()),
  Effect.provide(TestHttpClient)
)

const result = await Effect.runPromise(program)
// result : { items: ReadonlyArray<InventoryItem> }
```

### Appel avec paramètre de chemin

```typescript
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) =>
    client.items.getItemById({ path: { itemId: ITEM_1.id } })
  ),
  Effect.provide(TestHttpClient)
)
// result : Option<InventoryItem>
```

### Appels en parallèle avec `Effect.all`

`Effect.all` exécute plusieurs Effects en parallèle et attend tous les résultats :

```typescript
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) =>
    Effect.all({
      list: client.items.getAllItems(),
      single: client.items.getItemById({ path: { itemId: ITEM_1.id } })
    })
  ),
  Effect.provide(TestHttpClient)
)
```

---

## Partie 2 — `AtomHttpApi.Tag` : le client réactif pour React

Dans les composants React, on n'appelle pas `HttpApiClient.make` directement. `AtomHttpApi.Tag` l'encapsule dans un **Atom réactif** qui gère automatiquement le cycle de vie (loading, success, erreur, invalidation).

### Déclarer le client

```typescript
import { AtomHttpApi } from "@effect-atom/atom-react"
import { FetchHttpClient } from "@effect/platform"
import { Api } from "shared/api"

class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: FetchHttpClient.layer,
  baseUrl: "http://localhost:5173/api"
}) {}
```

C'est exactement ce que vous trouvez dans `packages/app/src/lib/client.ts`.

### `query` — lecture réactive

```typescript
function InventoryList() {
  const result = useAtomValue(
    ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] })
  )

  if (Result.isSuccess(result)) {
    return <ul>{result.value.items.map(item => <li key={item.id}>{item.brand}</li>)}</ul>
  }
  return <div>Chargement...</div>
}
```

La valeur retournée est un `Result` — le même type que dans l'exercice 11 avec `Atom.make(Effect.succeed(...))`.

### `reactivityKeys` — invalidation automatique

Quand une mutation réussit avec la même `reactivityKey`, tous les `query` qui partagent cette clé sont automatiquement relancés :

```typescript
// Lecture — se met à jour quand "items" est invalidé
ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] })

// Écriture — invalide "items" après succès
ApiClient.mutation("items", "removeItemById")
// appelé avec : removeItemById({ path: { itemId }, reactivityKeys: ["items"] })
```

### Tester avec `<RegistryProvider>`

```typescript
render(
  <RegistryProvider>
    <TestComponent />
  </RegistryProvider>
)

await waitFor(() => {
  expect(screen.getByTestId("count")).toHaveTextContent("2")
})
```

`waitFor` est nécessaire car l'Atom démarre en état `initial` et passe en `success` de façon asynchrone.

---

## Lien avec l'application finale

```
shared/api.ts          →  contrat (endpoints, schémas)
        ↓
HttpApiClient.make()   →  client Effect pur (partie 1)
        ↓
AtomHttpApi.Tag        →  client réactif pour React (partie 2)
        ↓
useAtomValue(query)    →  Result<Data> dans les composants
```

Dans `packages/app/src/routes/items/index.tsx`, c'est exactement cette chaîne qu'on voit en production.

---

## Exercice

Le fichier `packages/app/_exercices/10-api-client.spec.tsx` contient les tests à faire passer.

**Partie 1** — créer les programs avec `HttpApiClient.make` et le `TestHttpClient` mocké.

**Partie 2** — déclarer un `AtomHttpApi.Tag`, créer un composant de test, vérifier qu'il affiche les données après résolution de la query.

:::tip Ressources
- [Exercice 8](../06-http-api/01-server-et-client.md) — définition du contrat et `HttpApiBuilder`
- `packages/app/src/lib/client.ts` — le vrai `ApiClient` de l'appli
- `packages/app/src/routes/items/index.tsx` — utilisation de `query` et `mutation`
:::

---

## Indice 1

<details>
  <summary>Structure de HttpApiClient.make</summary>

```typescript
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getAllItems()),
  Effect.provide(TestHttpClient)
)
```

Le client est dans un Effect — il faut `flatMap` pour l'utiliser.

</details>

## Indice 2

<details>
  <summary>Passer un path param</summary>

```typescript
client.items.getItemById({ path: { itemId: ITEM_1.id } })
```

Les paramètres sont regroupés par catégorie : `path`, `payload`, `urlParams`.

</details>

## Indice 3

<details>
  <summary>AtomHttpApi.Tag et RegistryProvider</summary>

```typescript
class TestApiClient extends AtomHttpApi.Tag<TestApiClient>()("TestApiClient", {
  api: Api,
  httpClient: TestHttpClient,
  baseUrl: "http://localhost"
}) {}

render(
  <RegistryProvider>
    <MonComposant />
  </RegistryProvider>
)
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
// Partie 1 — HttpApiClient simple
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getAllItems()),
  Effect.provide(TestHttpClient)
)
const result = await Effect.runPromise(program)

// Partie 1 — avec path param
const program2 = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) =>
    client.items.getItemById({ path: { itemId: ITEM_1.id } })
  ),
  Effect.provide(TestHttpClient)
)

// Partie 1 — Effect.all en parallèle
const program3 = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) =>
    Effect.all({
      list: client.items.getAllItems(),
      single: client.items.getItemById({ path: { itemId: ITEM_1.id } })
    })
  ),
  Effect.provide(TestHttpClient)
)

// Partie 2 — AtomHttpApi.Tag
class TestApiClient extends AtomHttpApi.Tag<TestApiClient>()("TestApiClient", {
  api: Api,
  httpClient: TestHttpClient,
  baseUrl: "http://localhost"
}) {}

function TestComponent() {
  const result = useAtomValue(
    TestApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] })
  )
  if (Result.isSuccess(result)) {
    return <div data-testid="count">{result.value.items.length}</div>
  }
  return <div data-testid="loading">loading</div>
}

render(<RegistryProvider><TestComponent /></RegistryProvider>)

await waitFor(() => {
  expect(screen.getByTestId("count")).toHaveTextContent("2")
})
```

</details>
