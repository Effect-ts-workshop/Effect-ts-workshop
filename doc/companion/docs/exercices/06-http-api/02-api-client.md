---
sidebar_position: 2
---

# Exercice 10 — API Client

## Rappel : l'exercice 8 côté serveur

Dans l'exercice 8, vous avez défini un contrat, implémenté des handlers, et testé le tout **sans démarrer de vrai serveur**. Le contrat `Api` est défini dans `packages/shared/api.ts` et décrit tous les endpoints de l'application.

Ici, on est côté **navigateur**. On consomme ce même contrat. On ne redéfinit rien — on importe directement `Api` depuis `shared`.

## Le mock fetch

Pour tester sans serveur réel, on intercepte la fonction `fetch` native avec un mock :

```typescript
const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
  const url = input.toString()

  if (/\/items\/[^/]+$/.test(url)) {
    return new Response(
      JSON.stringify({ _tag: "Some", value: ITEM_1 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }

  if (url.endsWith("/items")) {
    return new Response(
      JSON.stringify({ items: [ITEM_1, ITEM_2] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }

  return new Response(null, { status: 404 })
}
```

:::info Encodage de `Option` en JSON
Le contrat déclare `getItemById` avec `addSuccess(Schema.Option(InventoryItemSchema))`.

Effect encode `Option.some(item)` en JSON sous la forme `{ "_tag": "Some", "value": {...} }`. C'est ce que le mock renvoie, et `HttpApiClient` le désérialise automatiquement en `Option<InventoryItem>` côté TypeScript.
:::

On branche ensuite ce mock sur `FetchHttpClient` via un Layer :

```typescript
const TestHttpClient = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, mockFetch))
)
```

C'est la même mécanique que dans l'exercice 8 (test 2) — on substitue l'implémentation de `fetch` dans le contexte Effect.

---

## Partie 1 — `HttpApiClient`

`HttpApiClient.make` génère un client typé à partir du contrat. La structure du client reflète l'organisation en groupes définie dans `shared/api.ts` :

```
Api
└── groupe "items"
    ├── getAllItems    → client.items.getAllItems()
    ├── getItemById   → client.items.getItemById({ path: { itemId } })
    ├── addItem       → client.items.addItem({ payload: { ... } })
    ├── updateItemById
    └── removeItemById
```

Si vous renommez un endpoint dans `shared/api.ts`, le compilateur signale immédiatement l'erreur ici. C'est la garantie du **contrat partagé typé**.

### Appel simple

```typescript
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

const result = await Effect.runPromise(program)
// result : Option<InventoryItem>
```

### Appels en parallèle avec `Effect.all`

`Effect.all` exécute plusieurs Effects en parallèle par défaut et attend tous les résultats :

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

const { list, single } = await Effect.runPromise(program)
```

---

## Partie 2 — `AtomHttpApi.Tag`

Dans l'appli, on n'appelle pas `HttpApiClient.make` directement dans les composants React. `AtomHttpApi.Tag` l'encapsule dans un **Atom réactif** qui gère automatiquement le cycle de vie (loading, success, erreur, invalidation).

### Déclarer le client

```typescript
class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: FetchHttpClient.layer,
  baseUrl: "http://localhost:5173/api"
}) {}
```

C'est exactement ce que vous trouvez dans `packages/app/src/lib/client.ts`.

### `query` — lecture réactive

```typescript
const allItemsAtom = ApiClient.query("items", "getAllItems", {
  reactivityKeys: ["items"]
})
```

`query` retourne un Atom. Dans un composant React, on lit cet Atom avec `useAtomValue` :

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

La valeur est un `Result` — le même type que dans l'exercice 11 avec `Atom.make(Effect.succeed(...))`.

```
Result.isInitial  → requête pas encore lancée
Result.isSuccess  → données disponibles
Result.isFailure  → erreur
```

### `reactivityKeys` — invalidation automatique

Quand une mutation réussit avec la même `reactivityKey`, tous les `query` qui partagent cette clé sont automatiquement relancés :

```typescript
// Dans le composant liste
ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] })

// Dans le composant suppression
ApiClient.mutation("items", "removeItemById")
// appelé avec : removeItemById({ path: { itemId }, reactivityKeys: ["items"] })
// → invalide automatiquement la query ci-dessus
```

C'est le mécanisme qu'on voit dans `packages/app/src/routes/items/index.tsx`.

### Tester avec `<RegistryProvider>`

En test, on enveloppe le composant dans `<RegistryProvider>` qui fournit une Registry isolée :

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

`waitFor` est nécessaire car l'Atom démarre en état `initial` et passe en `Success` de façon asynchrone, le temps que le mock fetch réponde.

---

## Vue d'ensemble

```
shared/api.ts          →  contrat (endpoints, schémas)
        ↓
HttpApiClient.make()   →  client Effect pur (exercice 8 + partie 1)
        ↓
AtomHttpApi.Tag        →  client réactif pour React (partie 2)
        ↓
useAtomValue(query)    →  Result<Data> dans les composants
```

## Exercice

Le fichier `10-api-client.spec.tsx` contient les tests à faire passer.

**Partie 1** : créer les programs avec `HttpApiClient.make` et le `TestHttpClient` mocké.

**Partie 2** : déclarer un `AtomHttpApi.Tag`, créer un composant de test, et vérifier qu'il affiche les données après résolution de la query.

:::tip Ressources
- Exercice 8 — définition du contrat et `HttpApiBuilder`
- `packages/app/src/lib/client.ts` — le vrai `ApiClient` de l'appli
- `packages/app/src/routes/items/index.tsx` — utilisation de `query` et `mutation`
:::

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
// Partie 1 — HttpApiClient
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
