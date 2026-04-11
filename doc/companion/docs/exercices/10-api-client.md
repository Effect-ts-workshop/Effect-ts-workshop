---
sidebar_position: 10
---

# Exercice 10 — API Client

L'exercice 8 montrait comment _définir_ une API côté serveur. Ici, on est côté client (navigateur) : on _consomme_ une API existante.

Le contrat (`Api`) est importé depuis `shared/api.ts` — la même source de vérité que le serveur. Si un endpoint est renommé côté serveur, le compilateur signale immédiatement l'erreur côté client.

Fichier de référence : `packages/app/_exercices/10-api-client.spec.tsx`

---

## `HttpApiClient.make` — client typé depuis le contrat

`HttpApiClient.make` génère un client typé à partir du contrat. La structure reflète l'organisation en groupes :

<!-- prettier-ignore -->
```typescript
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getAllItems())
  //                                ^      ^
  //                           groupe   endpoint
)
```

Si `getAllItems` n'existe pas dans le contrat, TypeScript signale une erreur de compilation — pas à l'exécution.

### Appeler plusieurs endpoints en parallèle

`Effect.all` exécute plusieurs Effects en parallèle et attend tous les résultats :

<!-- prettier-ignore -->
```typescript
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) =>
    Effect.all({
      list: client.items.getAllItems(),
      single: client.items.getItemById({ path: { itemId: ITEM_1.id } })
    })
  )
)
```

Les deux appels s'exécutent en parallèle. Le résultat est `{ list: ..., single: ... }`.

### À lire et comprendre

Les tests de cette section sont déjà implémentés. Parcourez-les pour observer :

1. **GET /items** — retourne une liste typée `{ items: InventoryItem[] }`
2. **GET /items/:itemId** — retourne `Option<InventoryItem>` (désérialisé automatiquement depuis `{ _tag: "Some", value: {...} }`)
3. **Endpoint inexistant** — TypeScript refuse à la compilation avec `@ts-expect-error`
4. **`Effect.all`** — deux appels en parallèle, un seul `runPromise`

:::tip Ressources

- [HTTP API](../base-de-connaissance/09-http-api.md)

:::

---

## `AtomHttpApi.Tag` — client réactif dans React

Dans l'application, on n'appelle pas `HttpApiClient` directement dans les composants. `AtomHttpApi.Tag` l'encapsule dans un système d'Atoms réactifs :

<!-- prettier-ignore -->
```typescript
class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: SomHttpClientLayer,
  baseUrl: "http://localhost"
}) {}
```

Deux usages :

**Query** — lit des données, se met à jour automatiquement quand les clés de réactivité changent :

<!-- prettier-ignore -->
```typescript
const allItemsAtom = ApiClient.query("items", "getAllItems", {
  reactivityKeys: ["items"]
})

function MyComponent() {
  const result = useAtomValue(allItemsAtom)
  if (Result.isSuccess(result)) {
    return <ul>{result.value.items.map(...)}</ul>
  }
  return <div>Chargement…</div>
}
```

**Mutation** — déclenche un appel et invalide les queries concernées :

<!-- prettier-ignore -->
```typescript
const removeItem = useAtomSet(ApiClient.mutation("items", "removeItemById"))
```

### À lire et comprendre

Le test `"query résout en Result.Success avec les items"` montre le cycle complet :

1. L'atom démarre en état initial (loading)
2. La query s'exécute automatiquement au montage du composant
3. L'atom passe en `Result.Success` quand la réponse arrive
4. `useAtomValue` re-render le composant avec les données

<!-- prettier-ignore -->
```typescript
function TestComponent() {
  const result = useAtomValue(allItemsAtom)

  if (Result.isSuccess(result)) {
    return <div data-testid="count">{result.value.items.length}</div>
  }
  return <div data-testid="loading">loading</div>
}
```

---

:::tip La suite

`AtomHttpApi.Tag` est une surcouche sur `Atom`. Pour comprendre comment ça fonctionne en dessous, l'exercice suivant explore `Atom` directement.

:::
