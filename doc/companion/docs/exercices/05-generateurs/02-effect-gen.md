---
sidebar_position: 2
---

# Exercice 11 — Effect.gen : écrire comme async/await

## Le problème du `pipe` complexe

Le `pipe` est puissant, mais il peut devenir difficile à lire quand la logique se complique :

```typescript
// Avec pipe — lisible pour 3 étapes, mais...
const traiterCommande = (id: string) =>
  fetchItem(id).pipe(
    Effect.flatMap((item) =>
      vérifierStock(item).pipe(
        Effect.flatMap((stock) =>
          calculerPrix(item, stock).pipe(
            Effect.map((prix) => ({ item, stock, prix }))
          )
        )
      )
    ),
    Effect.catchTag("NonTrouvé", () => Effect.fail(new CommandeImpossible())),
    Effect.catchTag("StockVide", () => Effect.fail(new CommandeImpossible()))
  );
```

Ce code ressemble au fameux "callback hell" d'avant `async/await`. Il est difficile à lire et à maintenir.

## `Effect.gen` — la syntaxe générateur

`Effect.gen` vous permet d'écrire des Effects comme si vous utilisiez `async/await`, mais avec **toute la puissance d'Effect** :

```typescript
import { Effect } from "effect";

// Même logique, beaucoup plus lisible !
const traiterCommande = (id: string) =>
  Effect.gen(function* () {
    const item = yield* fetchItem(id);      // comme await
    const stock = yield* vérifierStock(item); // comme await
    const prix = yield* calculerPrix(item, stock); // comme await

    return { item, stock, prix };
  }).pipe(
    Effect.catchTags({
      NonTrouvé: () => Effect.fail(new CommandeImpossible()),
      StockVide: () => Effect.fail(new CommandeImpossible()),
    })
  );
```

`yield*` fait exactement ce que `await` fait avec les Promises :
- Il extrait la valeur d'un Effect
- Il propage les erreurs automatiquement (sur le rail d'erreur)

## Comparer `async/await` et `Effect.gen`

```typescript
// Avec async/await
async function fetchEtAfficher(id: string): Promise<void> {
  const item = await fetchItem(id);      // await extrait la valeur
  const message = `${item.brand} - ${item.model}`;
  console.log(message);
}

// Avec Effect.gen
const fetchEtAfficher = (id: string): Effect.Effect<void, ErreurAPI> =>
  Effect.gen(function* () {
    const item = yield* fetchItem(id);   // yield* extrait la valeur
    const message = `${item.brand} - ${item.model}`;
    yield* Effect.log(message);          // Les effets aussi passent par yield*
  });
```

La structure est presque identique, mais `Effect.gen` :
- Trackle les **erreurs dans le type** (`ErreurAPI` apparaît)
- Gère le **contexte** (les dépendances remontent automatiquement)
- Est **composable** avec `.pipe()` après

## Les erreurs se propagent automatiquement

Dans `async/await`, vous devez utiliser `try/catch` pour gérer les erreurs. Dans `Effect.gen`, les erreurs se propagent automatiquement sur le rail d'erreur :

```typescript
const programme = Effect.gen(function* () {
  const a = yield* diviser(10, 0);  // ❌ DivisionParZéro — s'arrête ici !
  const b = yield* diviser(20, 4);  // Cette ligne ne s'exécute jamais
  return a + b;
});

// Type : Effect<number, DivisionParZéro>
// Si diviser(10, 0) échoue, l'erreur remonte directement
```

## `Effect.gen` avec le contexte

Le contexte (les dépendances) se gère aussi avec `yield*` :

```typescript
const monProgramme = Effect.gen(function* () {
  // Récupérer un service du contexte
  const httpClient = yield* HttpClient.HttpClient;
  const logger = yield* LoggingService;

  // Utiliser les services
  const response = yield* httpClient.get("http://localhost:3000/items");
  yield* logger.log("Requête effectuée !");

  return yield* response.json;
});

// Type : Effect<unknown, ..., HttpClient.HttpClient | LoggingService>
// Les deux dépendances apparaissent dans le contexte !
```

## Exercice

Réécrivez le programme de l'exercice 10 (pipe) en utilisant `Effect.gen`.

**Objectif :**
```typescript
// Ce programme en pipe :
const programme = add(3, 4).pipe(
  Effect.flatMap((somme) => diviser(somme, 2)),
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0)),
  Effect.flatMap((quotient) => multiply(quotient, 10)),
  Effect.tap((résultat) => Effect.log(`Résultat : ${résultat}`))
);

// Doit devenir avec Effect.gen :
const programmeGen = Effect.gen(function* () {
  // ... votre code ici
});
```

:::tip Ressources

- [Générateurs et Pipe](../../base-de-connaissance/07-generateurs.md)

:::

## Indice 1

<details>
  <summary>La structure de base de Effect.gen</summary>

```typescript
const programmeGen = Effect.gen(function* () {
  const somme = yield* add(3, 4);
  // Continuer ici...
});
```

</details>

## Indice 2

<details>
  <summary>Comment gérer l'erreur DivisionParZéro dans Effect.gen ?</summary>

Les erreurs dans `Effect.gen` se gèrent avec `.pipe(Effect.catchTag(...))` **après** le bloc générateur :

```typescript
const programmeGen = Effect.gen(function* () {
  const somme = yield* add(3, 4);
  const quotient = yield* diviser(somme, 2); // Peut échouer avec DivisionParZéro
  return quotient * 10;
}).pipe(
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
);
```

Ou vous pouvez encapsuler juste la partie qui peut échouer :

```typescript
const programmeGen = Effect.gen(function* () {
  const somme = yield* add(3, 4);

  // Gérer l'erreur inline
  const quotient = yield* diviser(somme, 2).pipe(
    Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
  );

  return quotient * 10;
});
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Data } from "effect";

const add = (a: number, b: number): Effect.Effect<number> =>
  Effect.succeed(a + b);

class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

const diviser = (a: number, b: number): Effect.Effect<number, DivisionParZéro> =>
  b === 0
    ? Effect.fail(new DivisionParZéro())
    : Effect.succeed(a / b);

const multiply = (a: number, b: number): Effect.Effect<number> =>
  Effect.succeed(a * b);

// Version Effect.gen — beaucoup plus lisible !
const programmeGen = Effect.gen(function* () {
  const somme = yield* add(3, 4);

  const quotient = yield* diviser(somme, 2).pipe(
    Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
  );

  const résultat = yield* multiply(quotient, 10);

  yield* Effect.log(`Résultat : ${résultat}`);

  return résultat;
});

// Exécuter
Effect.runSync(programmeGen);
// [LOG] Résultat : 35
```

**Bonus :** comparez la lisibilité avec la version `pipe` — laquelle préférez-vous ?

```typescript
// Version pipe (exercice 10)
const programmePipe = add(3, 4).pipe(
  Effect.flatMap((somme) => diviser(somme, 2)),
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0)),
  Effect.flatMap((quotient) => multiply(quotient, 10)),
  Effect.tap((résultat) => Effect.log(`Résultat : ${résultat}`))
);

// Les deux sont équivalents ! Choisissez selon la lisibilité.
```

</details>
