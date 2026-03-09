---
sidebar_position: 1
---

# Exercice 7 — Contexte et Services

## Le problème des dépendances cachées

Voici une fonction qui fait un appel réseau :

```typescript
// Où est l'implémentation HTTP ? Mystère total.
async function fetchItems(): Promise<Item[]> {
  const response = await fetch("http://localhost:3000/items");
  return response.json();
}
```

Cette fonction dépend implicitement de `fetch` (API du navigateur). Si vous la testez côté serveur, ou si vous voulez l'intercepter dans les tests, vous n'avez aucun moyen propre de le faire.

## La solution : déclarer les dépendances dans le type

Le troisième paramètre de type `Effect.Effect<A, E, R>` s'appelle le **Contexte** (ou Requirements) :

```
Effect.Effect<InventoryItem, ErreurAPI, HttpClient.HttpClient>
//                                      ↑
//                          "J'ai besoin d'un HttpClient"
```

Ce type dit : _"Je ne peux pas m'exécuter seul. Donne-moi un `HttpClient` et je ferai mon travail."_

## Utiliser `HttpClient` d'Effect

Effect Platform fournit un service `HttpClient` prêt à l'emploi :

```typescript
import { HttpClient } from "@effect/platform";
import { Effect } from "effect";

const fetchItems = Effect.gen(function* () {
  // On "demande" le HttpClient au contexte
  const client = yield* HttpClient.HttpClient;

  // On l'utilise
  const response = yield* client.get("http://localhost:3000/items");
  const data = yield* response.json;

  return data as { items: Item[] };
});

// Type : Effect<{ items: Item[] }, RequestError | ResponseError, HttpClient.HttpClient>
//                                                                ↑
//                                              HttpClient requis dans le contexte !
```

:::info `yield*` — votre nouvel ami
`yield*` dans un `Effect.gen` fait deux choses :
1. **Extrait la valeur** d'un Effect (comme `await` pour les Promises)
2. **Propage les erreurs** automatiquement sur le rail d'erreur

On reviendra en détail sur `Effect.gen` dans la Partie 5.
:::

## Pourquoi c'est puissant ?

Le compilateur **empêche** d'exécuter cet Effect sans fournir un `HttpClient` :

```typescript
// ❌ Erreur de compilation !
Effect.runPromise(fetchItems);
// Argument of type 'Effect<..., ..., HttpClient.HttpClient>' is not assignable
// to parameter of type 'Effect<..., ..., never>'.
```

Vous êtes **obligé** de fournir les dépendances. Plus de dépendances cachées.

## Lien avec l'application finale

Dans `packages/app/lib/client.ts`, le client HTTP est configuré exactement comme ça :

```typescript
// packages/app/lib/client.ts (simplifié)
import { FetchHttpClient } from "@effect/platform";

// FetchHttpClient.layer fournit l'implémentation pour le navigateur
const program = fetchItems.pipe(
  Effect.provide(FetchHttpClient.layer)
);
```

Le frontend utilise `FetchHttpClient` (basé sur l'API `fetch` du navigateur). En tests, on pourrait fournir un `HttpClient` factice.

## Créer votre propre service

Vous n'êtes pas limité à `HttpClient`. Vous pouvez créer n'importe quel service :

```typescript
import { Context, Effect } from "effect";

// 1. Définir l'interface du service
interface LoggingService {
  log: (message: string) => Effect.Effect<void>;
}

// 2. Créer un Tag pour identifier le service dans le contexte
const LoggingService = Context.GenericTag<LoggingService>("LoggingService");

// 3. Utiliser le service
const monProgram = Effect.gen(function* () {
  const logger = yield* LoggingService;
  yield* logger.log("Hello !");
});

// Type : Effect<void, never, LoggingService>
```

:::tip `Context.GenericTag`
Le `Tag` est l'identifiant du service. Effect utilise ce tag pour retrouver l'implémentation dans le contexte lors de l'exécution.
:::

## Exercice

Refactorez `fetchTousLesItems` de l'exercice 4 pour utiliser `HttpClient.HttpClient` d'Effect Platform au lieu de `fetch` directement.

**Objectif :**
1. Utiliser `HttpClient.HttpClient` dans un `Effect.gen`.
2. Observer le troisième paramètre de type (`HttpClient.HttpClient` apparaît dans le contexte).
3. Tenter d'exécuter l'Effect avec `Effect.runPromise` — observez l'erreur de compilation.

:::tip Ressources

- [Contexte et Services](../../base-de-connaissance/04-contexte-et-services.md)

:::

:::info Installation
Pour utiliser `@effect/platform`, il est déjà installé dans le projet :
```bash
# Déjà disponible dans packages/api et packages/app
import { HttpClient } from "@effect/platform"
```
:::

## Indice 1

<details>
  <summary>La structure avec Effect.gen et HttpClient</summary>

```typescript
import { HttpClient } from "@effect/platform";
import { Effect } from "effect";

const fetchTousLesItems = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  // client.get retourne un Effect<ClientResponse, RequestError, never>
  const response = yield* client.get("http://localhost:3000/items");

  // response.json retourne un Effect<unknown, ResponseError, never>
  const data = yield* response.json;

  return data as { items: Item[] };
});
```

</details>

## Indice 2

<details>
  <summary>Les erreurs qui apparaissent automatiquement</summary>

En utilisant `HttpClient`, Effect gère automatiquement les erreurs réseau. Elles apparaissent dans le type :

- `HttpClientError.RequestError` — erreur lors de la requête (réseau)
- `HttpClientError.ResponseError` — erreur lors de la lecture de la réponse

Vous n'avez pas besoin de `try/catch` !

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { HttpClient, HttpClientError } from "@effect/platform";
import { Effect } from "effect";

type Item = { id: string; brand: string; model: string };

// Effect avec HttpClient dans le contexte
const fetchTousLesItems: Effect.Effect<
  { items: Item[] },
  HttpClientError.HttpClientError,
  HttpClient.HttpClient
> = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get("http://localhost:3000/items");
  const data = yield* response.json;
  return data as { items: Item[] };
});

// ❌ Ne compile pas — HttpClient manquant :
// Effect.runPromise(fetchTousLesItems)

// ✅ On verra comment fournir la dépendance dans l'exercice suivant !
console.log("Type correct — HttpClient requis dans le contexte.");
```

</details>
