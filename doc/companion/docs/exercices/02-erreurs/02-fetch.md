---
sidebar_position: 2
---

:::danger TODO

- [ ] Change exercice to implement fetch with explicit errors `NetworkError` & `HTTPResponseError`
:::

# Exercice 4 — Requête réseau typée

## Les erreurs asynchrones sont pires

Dans le code classique, les erreurs d'un appel réseau sont encore moins visibles :

```typescript
async function fetchItem(id: string): Promise<InventoryItem> {
  const response = await fetch(`http://localhost:3000/items/${id}`);
  if (!response.ok) {
    throw new Error(`Article non trouvé : ${id}`);
  }
  return response.json();
}
```

Le type `Promise<InventoryItem>` est **mensonger** : la promesse peut rejeter avec n'importe quelle erreur, mais le type ne le dit pas.

## `Effect.tryPromise` — encapsuler une Promise avec des erreurs typées

Effect fournit `Effect.tryPromise` pour transformer une fonction qui retourne une `Promise` en Effect avec une erreur typée :

```typescript
import { Effect, Data } from "effect";

class ErreurRéseau extends Data.TaggedError("ErreurRéseau")<{
  message: string;
}> {}

const fetchItem = (id: string): Effect.Effect<InventoryItem, ErreurRéseau> =>
  Effect.tryPromise({
    try: () =>
      fetch(`http://localhost:3000/items/${id}`).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json() as Promise<InventoryItem>;
      }),
    catch: (erreur) => new ErreurRéseau({ message: String(erreur) }),
  });
```

Décortiquons :
- `try` — la fonction qui peut lancer une exception
- `catch` — comment **transformer** l'exception en erreur typée Effect

:::info Le rôle de `catch`
`catch` reçoit toujours un `unknown` (car TypeScript ne peut pas typer les exceptions).
C'est ici qu'on décide comment représenter l'erreur dans notre type Effect.
:::

## Plusieurs types d'erreurs

Une opération réseau peut échouer de plusieurs façons. Modélisons-les séparément :

```typescript
import { Data } from "effect";

class ErreurRéseau extends Data.TaggedError("ErreurRéseau")<{
  message: string;
}> {}

class NonTrouvé extends Data.TaggedError("NonTrouvé")<{
  id: string;
}> {}
```

On peut avoir **plusieurs erreurs** dans le type Effect en les unissant avec `|` :

```typescript
const fetchItem = (
  id: string
): Effect.Effect<InventoryItem, ErreurRéseau | NonTrouvé> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(`http://localhost:3000/items/${id}`);
      if (response.status === 404) throw { type: "not_found" };
      if (!response.ok) throw new Error(`${response.status}`);
      return response.json() as Promise<InventoryItem>;
    },
    catch: (erreur: unknown) => {
      if (
        typeof erreur === "object" &&
        erreur !== null &&
        "type" in erreur &&
        erreur.type === "not_found"
      ) {
        return new NonTrouvé({ id });
      }
      return new ErreurRéseau({ message: String(erreur) });
    },
  });
```

:::tip Union d'erreurs
`Effect.Effect<InventoryItem, ErreurRéseau | NonTrouvé>` signifie : _"peut réussir avec un `InventoryItem`, ou échouer avec soit une `ErreurRéseau`, soit un `NonTrouvé`."_

Plus tard, on pourra gérer chaque erreur séparément avec `Effect.catchTag`.
:::

## Lien avec l'application finale

Dans `packages/api/http.ts`, les handlers de l'API utilisent exactement ce pattern. Par exemple :

```typescript
// packages/api/http.ts (simplifié)
const getItemById = Effect.fn("getItemById")(function* (req) {
  const repo = yield* ItemRepositoryDrizzle;
  const item = yield* repo.findById(req.pathParams.itemId);
  return item;
});
```

Le `yield*` est la version générateur de `Effect.flatMap` — on en parlera dans la Partie 5 !

## Exercice

Implémentez une fonction `fetchTousLesItems` qui appelle l'API de l'atelier :

```
GET http://localhost:3000/items
→ { items: Array<{ id: string; brand: string; model: string }> }
```

**Objectif :**
1. Créer une classe `ErreurAPI` avec `Data.TaggedError`.
2. Écrire `fetchTousLesItems` qui retourne `Effect.Effect<{ items: Item[] }, ErreurAPI>`.
3. L'exécuter avec `Effect.runPromise`.

:::tip Ressources

- [Erreurs et Défauts](../../base-de-connaissance/02-erreurs-et-defauts.md)
- [Railway Pattern](../../base-de-connaissance/03-railway-pattern.md)

:::

## Indice 1

<details>
  <summary>La structure de base</summary>

```typescript
import { Effect, Data } from "effect";

type Item = { id: string; brand: string; model: string };

class ErreurAPI extends Data.TaggedError("ErreurAPI")<{
  message: string;
}> {}

const fetchTousLesItems = (): Effect.Effect<{ items: Item[] }, ErreurAPI> =>
  Effect.tryPromise({
    try: () => fetch("http://localhost:3000/items").then((r) => r.json()),
    catch: (e) => new ErreurAPI({ message: String(e) }),
  });
```

</details>

## Indice 2

<details>
  <summary>Comment vérifier que la réponse HTTP est un succès ?</summary>

La propriété `response.ok` est `true` si le statut HTTP est entre 200 et 299.

```typescript
try: async () => {
  const response = await fetch("http://localhost:3000/items");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<{ items: Item[] }>;
},
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Data } from "effect";

type Item = { id: string; brand: string; model: string };

class ErreurAPI extends Data.TaggedError("ErreurAPI")<{
  message: string;
}> {}

const fetchTousLesItems = (): Effect.Effect<{ items: Item[] }, ErreurAPI> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch("http://localhost:3000/items");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<{ items: Item[] }>;
    },
    catch: (erreur) => new ErreurAPI({ message: String(erreur) }),
  });

// Exécution (assurez-vous que l'API tourne sur localhost:3000)
Effect.runPromise(fetchTousLesItems()).then(console.log);
// { items: [...] }
```

</details>
