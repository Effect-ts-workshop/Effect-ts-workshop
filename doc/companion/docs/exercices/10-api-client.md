---
sidebar_position: 10
---

# Exercice 10 — API Client

L'exercice 8 montrait comment _définir_ une API côté serveur. Ici, on est côté client (navigateur) : on _consomme_ une API existante.

Le contrat (`Api`) est importé depuis `shared/api.ts` — la même source de vérité que le serveur. Si un endpoint est renommé côté serveur, le compilateur signale immédiatement l'erreur côté client.

Fichier de référence : `packages/app/_exercices/10-api-client.spec.tsx`

---

## Consommer une API depuis le client

`HttpApiClient.make` génère un client typé à partir du contrat. La structure reflète l'organisation en groupes définis côté serveur :

<!-- prettier-ignore -->
```ts
const program = pipe(
  HttpApiClient.make(TodoApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.tasks.getAll())
  //                                ^      ^
  //                           groupe   endpoint
)
```

Le client retourné est lui-même un `Effect` — il faut `flatMap` pour l'utiliser.

### Récupérer la liste des items

Implémentez le `program` qui appelle `getAllItems` sur le groupe `items`.

N'oubliez pas de fournir `TestHttpClient` avec `Effect.provide`.

À vous de jouer !

:::tip Ressources

- [HTTP API](../base-de-connaissance/09-http-api.md)

:::

#### Indice 1

<details>
  <summary>Comment obtenir le client ?</summary>

  `HttpApiClient.make(Api, { baseUrl: "http://localhost" })` renvoie un `Effect<client>`. Il faut `Effect.flatMap` pour accéder à ce client et appeler un endpoint.

</details>

#### Indice 2

<details>
  <summary>Comment fournir le layer HTTP ?</summary>

  `HttpApiClient` a besoin d'un layer HTTP pour effectuer les requêtes. On le fournit en ajoutant `Effect.provide(TestHttpClient)` à la fin du pipe.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```ts
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getAllItems()),
  Effect.provide(TestHttpClient)
)
```

</details>

### Récupérer un item par son identifiant

Implémentez le `program` qui appelle `getItemById`. L'identifiant est passé dans les paramètres de chemin (`path`).

À vous de jouer !

#### Indice 1

<details>
  <summary>Comment passer un paramètre de chemin ?</summary>

  Les endpoints qui prennent un paramètre `:itemId` dans l'URL attendent un objet `{ path: { itemId: ... } }`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```ts
const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getItemById({ path: { itemId: ITEM_1.id } })),
  Effect.provide(TestHttpClient)
)
```

</details>

### Observer la sûreté du contrat

Ce test illustre une propriété importante : TypeScript refuse à la compilation tout appel à un endpoint non déclaré dans le contrat.

Remplacez le `TODO` par un appel à `client.items.getItemByName(...)`. Observez l'erreur TypeScript. Ajoutez ensuite `// @ts-expect-error` sur la ligne précédente pour signaler cet échec attendu.

À vous de jouer !

#### Indice 1

<details>
  <summary>Comment indiquer à TypeScript qu'on attend une erreur ?</summary>

  `// @ts-expect-error` placé sur la ligne juste avant dit au compilateur : "la ligne suivante doit produire une erreur". Si elle n'en produit pas, c'est le commentaire lui-même qui devient une erreur.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```ts
pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  // @ts-expect-error -- getItemByName n'existe pas dans le contrat Api
  Effect.flatMap((client) => client.items.getItemByName({ query: { name: "Devoxx" } })),
  Effect.provide(TestHttpClient)
)
```

</details>

---

## Appeler plusieurs endpoints en parallèle

`Effect.all` exécute plusieurs Effects en parallèle et attend tous les résultats. Passé un objet, il renvoie un objet de même forme :

<!-- prettier-ignore -->
```ts
const program = Effect.all({
  user: Effect.succeed({ name: "Alice" }),
  posts: Effect.succeed([{ title: "Hello" }])
})
// résultat : { user: { name: "Alice" }, posts: [...] }
```

Les deux Effects s'exécutent en parallèle. Un seul `runPromise` suffit pour obtenir les deux résultats.

### Combiner une liste et un détail

Implémentez l'argument de `Effect.all` pour appeler `getAllItems` et `getItemById` en parallèle. Le résultat doit avoir la forme `{ list: ..., single: ... }`.

À vous de jouer !

#### Indice 1

<details>
  <summary>Que passer à Effect.all ?</summary>

  Les clés du résultat attendu sont `list` et `single`. Chaque valeur est un `Effect` retourné par le client — par exemple `client.items.getAllItems()`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```ts
Effect.all({
  list: client.items.getAllItems(),
  single: client.items.getItemById({ path: { itemId: ITEM_1.id } })
})
```

</details>

---

## Rendre les appels API réactifs dans React

Dans l'application, on n'appelle pas `HttpApiClient` directement dans les composants. `AtomHttpApi.Tag` l'encapsule dans un système d'Atoms réactifs :

<!-- prettier-ignore -->
```ts
class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: TodoApi,
  httpClient: FetchHttpClient.layer,
  baseUrl: "http://localhost"
}) {}
```

Deux usages :

**Query** — lit des données, se met à jour automatiquement quand les clés de réactivité changent :

<!-- prettier-ignore -->
```ts
const allItemsAtom = ApiClient.query("tasks", "getAll", {
  reactivityKeys: ["tasks"]
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
```ts
const removeTask = useAtomSet(ApiClient.mutation("tasks", "removeById"))
```

### Déclarer un client API réactif

Déclarez `TestApiClient` en étendant `AtomHttpApi.Tag`. Utilisez `Api` comme contrat, `TestHttpClient` comme layer HTTP, et `"http://localhost"` comme `baseUrl`.

Pensez également à décommenter `AtomHttpApi` dans l'import en tête de fichier.

À vous de jouer !

#### Indice 1

<details>
  <summary>Quelle est la syntaxe de déclaration ?</summary>

  ```ts
  class MonClient extends AtomHttpApi.Tag<MonClient>()("MonClient", {
    api: ...,
    httpClient: ...,
    baseUrl: ...
  }) {}
  ```

  Le nom passé en paramètre (`"MonClient"`) est un identifiant unique utilisé en interne par le registre.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```ts
class TestApiClient extends AtomHttpApi.Tag<TestApiClient>()("TestApiClient", {
  api: Api,
  httpClient: TestHttpClient,
  baseUrl: "http://localhost"
}) {}
```

</details>

---

:::tip La suite

`AtomHttpApi.Tag` est une surcouche sur `Atom`. Pour comprendre comment ça fonctionne en dessous, l'exercice suivant explore `Atom` directement.

:::
