---
sidebar_position: 2
---

# Exercice 2 — Délai asynchrone

## Le problème de l'asynchronicité classique

Voici une fonction qui attend avant de retourner une valeur :

```typescript
async function addAvecDélai(a: number, b: number): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return a + b;
}

addAvecDélai(1, 2).then(console.log); // 3 (après 1 seconde)
```

Ça fonctionne, mais remarquez :
- La fonction est marquée `async` — elle **force** un contexte asynchrone.
- Elle retourne `Promise<number>` — impossible de la composer facilement avec une fonction synchrone.
- `setTimeout` n'est pas typé : quelle unité ? Des millisecondes ? Des secondes ?

## La magie d'Effect : un seul type pour tout

Avec Effect, une opération asynchrone a **exactement le même type** qu'une opération synchrone :

```typescript
import { Effect, Duration } from "effect";

const attendre = (ms: number): Effect.Effect<void> =>
  Effect.sleep(Duration.millis(ms));
```

`Effect.Effect<void>` — le même type que dans l'exercice 1 ! Effect cache si l'opération est synchrone ou non.

:::info `Duration`
Effect utilise le module `Duration` pour exprimer des durées de façon lisible et sans ambiguïté :
- `Duration.millis(500)` — 500 millisecondes
- `Duration.seconds(1)` — 1 seconde
- `Duration.minutes(5)` — 5 minutes
:::

## Enchaîner avec `Effect.andThen`

Pour exécuter un Effect **après** un autre, on utilise `Effect.andThen` :

```typescript
const addAvecDélai = (a: number, b: number): Effect.Effect<number> =>
  Effect.sleep(Duration.seconds(1)).pipe(
    Effect.andThen(() => Effect.succeed(a + b))
  );
```

Lecture : _"Attends 1 seconde, **puis** calcule la somme."_

:::tip `Effect.andThen` vs `Effect.flatMap`
Ces deux fonctions font la même chose : exécuter un Effect après un autre.
- `Effect.andThen` accepte **les deux** : une fonction qui retourne un Effect OU une valeur directe.
- `Effect.flatMap` n'accepte que **des fonctions qui retournent un Effect**.

Préférez `Effect.andThen` pour sa flexibilité.
:::

## Exécuter un Effect asynchrone

Pour un Effect qui peut être asynchrone, on utilise `Effect.runPromise` :

```typescript
Effect.runPromise(addAvecDélai(1, 2)).then(console.log); // 3 (après 1 seconde)
```

`Effect.runPromise` retourne une `Promise` standard, compatible avec tout le reste de votre code JavaScript.

## Pourquoi c'est mieux ?

Comparez les deux approches :

| | TypeScript classique | Effect |
|--|--|--|
| Sync | `() => number` | `() => Effect<number>` |
| Async | `() => Promise<number>` | `() => Effect<number>` |
| Erreurs typées | Impossible | `() => Effect<number, MonErreur>` |
| Dépendances visibles | Impossible | `() => Effect<number, never, MonService>` |

Avec Effect, **un seul type** décrit toutes les situations. La composition devient uniforme.

## Exercice

Transformez cette fonction en utilisant Effect :

```typescript
async function attendre(ms: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return `Attente de ${ms}ms terminée !`;
}

// Utilisation attendue :
attendre(500).then(console.log); // "Attente de 500ms terminée !" (après 500ms)
```

**Objectif :** La fonction doit retourner un `Effect.Effect<string>` et être exécutée avec `Effect.runPromise`.

:::tip Ressources

- [Le type Effect](../../base-de-connaissance/01-le-type-effect.md)

:::

## Indice 1

<details>
  <summary>Comment créer un délai dans Effect ?</summary>

Utilisez `Effect.sleep` avec `Duration` :

```typescript
import { Effect, Duration } from "effect";

const monDélai = Effect.sleep(Duration.millis(500));
// Type : Effect.Effect<void>
```

</details>

## Indice 2

<details>
  <summary>Comment enchaîner le délai avec la valeur de retour ?</summary>

`Effect.andThen` exécute un Effect **après** un autre. Le résultat du premier Effect est ignoré, le second Effect est exécuté ensuite.

```typescript
const résultat = Effect.sleep(Duration.millis(500)).pipe(
  Effect.andThen(() => Effect.succeed("terminé !"))
);
```

Ou plus simplement, `Effect.andThen` accepte directement une valeur :

```typescript
const résultat = Effect.sleep(Duration.millis(500)).pipe(
  Effect.andThen("terminé !")
);
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Duration } from "effect";

const attendre = (ms: number): Effect.Effect<string> =>
  Effect.sleep(Duration.millis(ms)).pipe(
    Effect.andThen(`Attente de ${ms}ms terminée !`)
  );

// Exécution
Effect.runPromise(attendre(500)).then(console.log);
// "Attente de 500ms terminée !" (après 500ms)
```

**Bonus :** Enchaînez deux délais pour voir qu'ils s'additionnent :

```typescript
const deuxDélais = attendre(300).pipe(
  Effect.andThen(() => attendre(200))
);

Effect.runPromise(deuxDélais).then(console.log);
// "Attente de 200ms terminée !" (après 500ms au total)
```

</details>
