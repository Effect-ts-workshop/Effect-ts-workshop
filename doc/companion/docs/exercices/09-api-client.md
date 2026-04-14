---
sidebar_position: 9
---

# Exercice 9 — API Client

L'exercice 7 montrait comment _définir_ une API côté serveur. Ici, on est côté client (navigateur) : on _consomme_ une API existante.

Le contrat (`Api`) est importé depuis `shared/api.ts` — la même source de vérité que le serveur. Si un endpoint est renommé côté serveur, le compilateur signale immédiatement l'erreur côté client.

Fichier de référence : `packages/app/_exercices/9-api-client.spec.tsx`

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
