---
sidebar_position: 3
---

# Exercice 5 — Récupérer des erreurs

## L'erreur n'est pas une fin

Dans les exercices précédents, on a appris à **signaler** des erreurs. Mais le vrai pouvoir d'Effect vient de la capacité à **récupérer** de ces erreurs de façon précise et typée.

Reprenons la fonction `diviser` de l'exercice 3 :

```typescript
import { Effect, Data } from "effect";

class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

const diviser = (a: number, b: number): Effect.Effect<number, DivisionParZéro> =>
  b === 0
    ? Effect.fail(new DivisionParZéro())
    : Effect.succeed(a / b);
```

## `Effect.catchTag` — récupérer une erreur spécifique

`Effect.catchTag` intercepte une erreur par son **tag** et retourne un Effect de remplacement :

```typescript
const diviserSûrement = (a: number, b: number): Effect.Effect<number> =>
  diviser(a, b).pipe(
    Effect.catchTag("DivisionParZéro", (_erreur) => Effect.succeed(0))
  );
```

Remarquez le type de retour : `Effect.Effect<number>` — **plus d'erreur dans le type !**

Effect sait qu'on a géré l'erreur `DivisionParZéro`, donc il l'enlève du type.

```
diviser(10, 0)                     →  Effect<number, DivisionParZéro>
   ↓ .pipe(Effect.catchTag(...))
                                   →  Effect<number>   (erreur disparue du type !)
```

## Accéder aux données de l'erreur

Le deuxième argument de `Effect.catchTag` reçoit l'erreur avec toutes ses données :

```typescript
class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{
  numérateur: number;
}> {}

const diviser = (a: number, b: number): Effect.Effect<number, DivisionParZéro> =>
  b === 0
    ? Effect.fail(new DivisionParZéro({ numérateur: a }))
    : Effect.succeed(a / b);

const diviserAvecLog = diviser(42, 0).pipe(
  Effect.catchTag("DivisionParZéro", (erreur) => {
    console.log(`Tentative de diviser ${erreur.numérateur} par zéro !`);
    return Effect.succeed(0);
  })
);
```

## Gérer plusieurs erreurs avec `Effect.catchTags`

Quand un Effect peut échouer de plusieurs façons, `Effect.catchTags` permet de les gérer toutes en une seule fois :

```typescript
class ErreurRéseau extends Data.TaggedError("ErreurRéseau")<{
  message: string;
}> {}

class NonTrouvé extends Data.TaggedError("NonTrouvé")<{
  id: string;
}> {}

const fetchItem = (id: string): Effect.Effect<Item, ErreurRéseau | NonTrouvé> =>
  /* ... */;

const fetchSûrement = (id: string): Effect.Effect<Item | null> =>
  fetchItem(id).pipe(
    Effect.catchTags({
      ErreurRéseau: (erreur) => {
        console.error("Problème réseau :", erreur.message);
        return Effect.succeed(null);
      },
      NonTrouvé: (_erreur) => Effect.succeed(null),
    })
  );
```

:::tip Gestion exhaustive
TypeScript vous avertira si vous oubliez de gérer une erreur dans `Effect.catchTags`. C'est le compilateur qui vérifie que vous n'avez rien manqué !
:::

## Gérer toutes les erreurs avec `Effect.catchAll`

Pour une gestion générique de toutes les erreurs :

```typescript
const fetchSûrement = (id: string): Effect.Effect<Item | null> =>
  fetchItem(id).pipe(
    Effect.catchAll((_erreur) => Effect.succeed(null))
  );
```

:::warning Quand utiliser `catchAll` ?
`Effect.catchAll` masque toutes les erreurs, même celles que vous n'aviez pas prévues. Préférez `Effect.catchTag` ou `Effect.catchTags` pour ne gérer que ce que vous comprenez.
:::

## Lien avec l'application finale

Dans `packages/api/http.ts`, les handlers gèrent les erreurs de façon précise :

```typescript
// packages/api/http.ts (simplifié)
Effect.catchTag("ItemNotFound", () =>
  HttpServerResponse.json({ error: "Not found" }, { status: 404 })
)
```

Exactement le même pattern que ce que vous venez d'apprendre !

## Exercice

Reprenez les fonctions `diviser` (exercice 3) et `fetchTousLesItems` (exercice 4).

**Objectif :**
1. Créer une version "sûre" de `diviser` qui retourne `0` en cas de division par zéro.
2. Créer une version "sûre" de `fetchTousLesItems` qui retourne un tableau vide `{ items: [] }` en cas d'erreur.
3. Bonus : afficher un message d'erreur dans la console avant de retourner la valeur de fallback.

:::tip Ressources

- [Erreurs et Défauts](../../base-de-connaissance/02-erreurs-et-defauts.md)
- [Railway Pattern](../../base-de-connaissance/03-railway-pattern.md)

:::

## Indice 1

<details>
  <summary>Structure pour la division sûre</summary>

```typescript
const diviserSûrement = (a: number, b: number): Effect.Effect<number> =>
  diviser(a, b).pipe(
    Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
  );
```

</details>

## Indice 2

<details>
  <summary>Comment afficher un message avant de retourner la valeur ?</summary>

`Effect.tap` exécute un effet secondaire (comme un log) **sans changer la valeur** de l'Effect :

```typescript
Effect.catchTag("DivisionParZéro", () =>
  Effect.log("Division par zéro détectée, retour de 0").pipe(
    Effect.andThen(Effect.succeed(0))
  )
)
```

Ou plus simplement avec `console.log` (qui n'est pas un Effect) :

```typescript
Effect.catchTag("DivisionParZéro", () => {
  console.log("Division par zéro !");
  return Effect.succeed(0);
})
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Data } from "effect";

// --- Exercice 3 : Division ---
class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

const diviser = (a: number, b: number): Effect.Effect<number, DivisionParZéro> =>
  b === 0
    ? Effect.fail(new DivisionParZéro())
    : Effect.succeed(a / b);

const diviserSûrement = (a: number, b: number): Effect.Effect<number> =>
  diviser(a, b).pipe(
    Effect.catchTag("DivisionParZéro", () => {
      console.log("Division par zéro détectée, retour de 0");
      return Effect.succeed(0);
    })
  );

// Tests
console.log(Effect.runSync(diviserSûrement(10, 2))); // 5
console.log(Effect.runSync(diviserSûrement(10, 0))); // 0

// --- Exercice 4 : Fetch ---
type Item = { id: string; brand: string; model: string };

class ErreurAPI extends Data.TaggedError("ErreurAPI")<{ message: string }> {}

const fetchTousLesItems = (): Effect.Effect<{ items: Item[] }, ErreurAPI> =>
  Effect.tryPromise({
    try: () => fetch("http://localhost:3000/items").then((r) => r.json()),
    catch: (e) => new ErreurAPI({ message: String(e) }),
  });

const fetchSûrement = (): Effect.Effect<{ items: Item[] }> =>
  fetchTousLesItems().pipe(
    Effect.catchTag("ErreurAPI", (erreur) => {
      console.error("Erreur API :", erreur.message);
      return Effect.succeed({ items: [] });
    })
  );

Effect.runPromise(fetchSûrement()).then(console.log);
```

</details>
