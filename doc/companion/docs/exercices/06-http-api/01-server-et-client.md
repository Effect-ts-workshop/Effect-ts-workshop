---
sidebar_position: 1
---

# Exercices 8 & 11 — HTTP API : serveur et client

Ces deux exercices forment une paire. L'exercice 8 vit dans `packages/api` (Node.js), l'exercice 11 dans `packages/app` (navigateur). Ensemble, ils couvrent le cycle complet d'une API Effect : définir, implémenter, tester, puis consommer.

## L'architecture du projet en trois packages

```
packages/
├── shared/       ← le contrat (types + schémas + déclaration des endpoints)
├── api/          ← le serveur Node.js (implémentation des handlers)
└── app/          ← le client React/Vite (consommation de l'API)
```

Le package `shared` est la clé de voûte. Il contient la définition `Api` que le serveur et le navigateur importent tous les deux. Changer un endpoint dans `shared` provoque immédiatement une erreur de compilation des deux côtés — c'est le **contrat partagé typé**.

```typescript
// packages/shared/api.ts
export const Api = HttpApi.make("Api").add(
  HttpApiGroup.make("items")
    .add(HttpApiEndpoint.get("getAllItems", "/items").addSuccess(getAllItemsResponseSchema))
    .add(HttpApiEndpoint.post("addItem", "/items").setPayload(InventoryItemSchema))
    // ...
)
```

## Exercice 8 — côté serveur

### Ce qu'on fait

L'exercice 8 est entièrement dans `packages/api`. Il couvre les trois étapes de construction d'une API Effect :

**Étape 1 — Déclarer le contrat**

Le contrat décrit _ce que l'API expose_, sans aucune logique. C'est un simple objet déclaratif :

```typescript
const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
  )
)
```

Ce contrat est un **type pur** : il ne fait rien tout seul. Son rôle est de servir de référence partagée entre l'implémentation et le client.

**Étape 2 — Implémenter les handlers**

`HttpApiBuilder.group` relie un groupe d'endpoints à des Effects :

```typescript
const MyApiLive = HttpApiBuilder.group(
  MyApi,
  "greet",
  (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
)
```

Chaque handler est un Effect classique. Il peut `yield*` des services depuis le contexte, retourner des erreurs typées, utiliser des générateurs — toutes les mécaniques vues dans les exercices précédents s'appliquent ici.

**Étape 3 — Brancher sur un routeur**

```typescript
const apiLayer = pipe(
  HttpLayerRouter.addHttpApi(MyApi),
  Layer.provide(MyApiLive)
)
```

On assemble le tout avec `Layer.provide`, exactement comme dans l'exercice 5. L'API devient un `Layer` comme un autre.

### Pourquoi tester sans vrai serveur HTTP ?

`HttpLayerRouter.toWebHandler` transforme le Layer en un simple handler `(Request) => Response` :

```typescript
const { handler } = HttpLayerRouter.toWebHandler(apiLayer)
const response = await handler(new Request("http://localhost/hello"))
```

Pas de port à ouvrir, pas de processus à démarrer, pas de race condition dans les tests. Le handler est une fonction pure en mémoire. C'est une technique centrale dans Effect Platform : **les tests unitaires d'API ne nécessitent pas de réseau**.

### Pourquoi `HttpApiClient` apparaît déjà dans l'exercice 8 ?

Le deuxième test de l'exercice 8 introduit `HttpApiClient.make` :

```typescript
const program = pipe(
  HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.greet.sayHello()),
  Effect.provide(TestHttpClient)
)
```

Ce n'est pas encore "le client côté navigateur" — c'est un **test d'intégration qui vérifie que le contrat est cohérent de bout en bout**. On génère un client à partir du même contrat que le serveur, et on vérifie que l'appel retourne bien ce que le handler produit.

L'objectif est de faire sentir que le contrat `MyApi` est la source de vérité pour les deux côtés, avant de séparer les deux dans des packages distincts.

---

## Exercice 11 — côté client

### Ce qu'on fait

L'exercice 11 est dans `packages/app`. Le contrat `Api` est maintenant importé depuis `shared` — on ne le redéfinit plus.

**Partie 1 — `HttpApiClient` avec un `FetchHttpClient` mocké**

Le pattern est identique à celui du test 2 de l'exercice 8, mais avec le vrai contrat partagé et un mock `fetch` qui simule les réponses :

```typescript
import { Api } from "shared/api"

const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
  if (input.toString().endsWith("/items")) {
    return new Response(JSON.stringify({ items: fakeItems }), { status: 200, ... })
  }
  // ...
}

const TestHttpClient = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.Fetch, mockFetch))
)

const program = pipe(
  HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.items.getAllItems()),
  Effect.provide(TestHttpClient)
)
```

La structure du client reflète celle du contrat : `client.items.getAllItems()`, `client.items.addItem(...)`. Si on renomme un endpoint dans `shared/api.ts`, le compilateur signale l'erreur ici.

**Partie 2 — `AtomHttpApi.Tag`**

Dans l'appli réelle, on n'appelle pas `HttpApiClient.make` directement dans les composants. La librairie `@effect-atom/atom-react` fournit `AtomHttpApi.Tag` qui encapsule le client dans un **Atom réactif** :

```typescript
// packages/app/src/lib/client.ts
export class ApiClient extends AtomHttpApi.Tag<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: FetchHttpClient.layer,
  baseUrl: "http://localhost:5173/api"
}) {}
```

Ce Tag expose deux méthodes dans les composants React :

```typescript
// Lecture réactive — se met à jour quand les données changent
const result = useAtomValue(ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] }))

// Écriture — déclenche une mutation et invalide les queries avec la même reactivityKey
const removeItem = useAtomSet(ApiClient.mutation("items", "removeItemById"))
```

C'est exactement ce qu'on voit dans `packages/app/src/routes/items/index.tsx`.

### Pourquoi cette séparation en deux parties ?

La partie 1 isole la mécanique pure de `HttpApiClient` : on apprend à construire un client typé, à fournir un transport (`FetchHttpClient`), à intercepter les appels dans les tests. Pas de React, pas d'Atom — juste un Effect.

La partie 2 montre comment cette mécanique s'intègre dans une interface React. `AtomHttpApi.Tag` n'est pas une abstraction magique : c'est exactement `HttpApiClient` + un Atom de `@effect-atom/atom-react` qui gère le cycle de vie (loading, success, error, invalidation).

---

## Pourquoi ces deux exercices sont séparés dans le temps

On aurait pu tout mettre dans un seul exercice. On ne l'a pas fait pour trois raisons :

**1. Les contextes d'exécution sont différents.**
L'exercice 8 tourne dans Node.js (`packages/api`). L'exercice 11 tourne dans `jsdom` (`packages/app`, environnement de test navigateur). Les outils de test, les imports, les comportements par défaut diffèrent. Les mélanger dans le même fichier crée de la confusion.

**2. La progression pédagogique.**
Entre les exercices 8 et 11, il y a les exercices 9 (SQL/Drizzle) et 10 (Atom). L'exercice 11 réutilise ce qu'on a appris dans ces deux exercices : le repository pattern (exercice 9) alimente les données retournées par l'API, et `useAtomValue` (exercice 10) est le hook qu'on utilise pour consommer le client.

**3. Refléter la réalité d'un projet.**
Dans un vrai projet Effect fullstack, l'équipe backend et l'équipe frontend n'écrivent pas le même code en même temps. Le contrat dans `shared` est le point de synchronisation. Faire les exercices dans deux packages différents — avec un import `from "shared/api"` au milieu — reproduit cette dynamique.

---

## Récapitulatif

| | Exercice 8 | Exercice 11 |
|---|---|---|
| Package | `packages/api` | `packages/app` |
| Environnement | Node.js | Navigateur (jsdom) |
| Contrat | Défini localement (`MyApi`) | Importé depuis `shared/api` |
| Rôle | Définir + implémenter + tester le serveur | Consommer l'API depuis le front |
| Abstraction testée | `HttpLayerRouter.toWebHandler` | `HttpApiClient` + `AtomHttpApi.Tag` |
| Lien avec l'appli | `packages/api/http.ts` | `packages/app/src/lib/client.ts` |

:::tip Le fil conducteur
`HttpApi` → `HttpApiBuilder` → `HttpLayerRouter` (exercice 8) sont des briques serveur.
`HttpApiClient` → `AtomHttpApi.Tag` (exercice 11) sont des briques client.
Le contrat dans `shared/api.ts` est la colle qui garantit que les deux parlent le même langage.
:::
