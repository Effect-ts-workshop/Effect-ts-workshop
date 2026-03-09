---
sidebar_position: 1
---

# Exercice 10 — Pipe : devenir plombier

## Le problème du code imbriqué

Imaginez que vous devez :
1. Calculer `add(3, 4)` → 7
2. Diviser le résultat → `diviser(7, 2)` → 3.5
3. Multiplier par 10 → 35

En TypeScript classique, on imbrique les appels :

```typescript
// Lisible ? Pas vraiment — il faut lire de l'intérieur vers l'extérieur
const résultat = multiply(diviser(add(3, 4), 2), 10);
```

Ou on crée des variables intermédiaires :

```typescript
const somme = add(3, 4);         // 7
const quotient = diviser(somme, 2); // 3.5
const final = multiply(quotient, 10); // 35
```

C'est lisible, mais verbeux. Et avec Effect, la composition devient encore plus importante.

## `pipe` — la tuyauterie de données

`pipe` est une fonction qui prend une valeur et la passe dans une série de transformations, de gauche à droite :

```typescript
import { pipe, Effect } from "effect";

const résultat = pipe(
  7,               // valeur initiale
  (n) => n / 2,    // 3.5
  (n) => n * 10    // 35
);
// 35
```

Chaque fonction reçoit le résultat de la précédente. Vous lisez **de haut en bas**, dans l'ordre d'exécution.

## Le plombier

Imaginez un réseau de tuyaux :

```
  Source d'eau (valeur initiale)
       ↓
  [Filtre 1] (première transformation)
       ↓
  [Filtre 2] (deuxième transformation)
       ↓
  [Sortie]   (résultat final)
```

C'est exactement ce que fait `pipe`. La donnée "coule" de haut en bas à travers chaque transformation.

## `pipe` avec Effect

`pipe` est particulièrement utile avec Effect car la plupart des fonctions Effect sont **curryées** (on y reviendra), ce qui les rend parfaites pour `pipe` :

```typescript
import { pipe, Effect, Data } from "effect";

class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

const diviser = (a: number, b: number): Effect.Effect<number, DivisionParZéro> =>
  b === 0 ? Effect.fail(new DivisionParZéro()) : Effect.succeed(a / b);

// Sans pipe — difficile à lire
const résultat1 = Effect.catchTag(
  Effect.map(diviser(10, 2), (n) => n * 3),
  "DivisionParZéro",
  () => Effect.succeed(0)
);

// Avec pipe — lisible de haut en bas
const résultat2 = pipe(
  diviser(10, 2),
  Effect.map((n) => n * 3),
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
);
```

## La syntaxe `.pipe()` — le raccourci

Effect fournit aussi une méthode `.pipe()` directement sur les Effects, ce qui évite d'importer `pipe` :

```typescript
const résultat = diviser(10, 2).pipe(
  Effect.map((n) => n * 3),
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
);
```

C'est **exactement identique** à `pipe(diviser(10, 2), ...)`. C'est juste plus pratique.

:::info Currying — pourquoi `Effect.map(n => n * 3)` sans le premier argument ?
En JavaScript classique : `Effect.map(effect, fn)` prend deux arguments.

Avec le currying, `Effect.map(fn)` retourne une **nouvelle fonction** qui attend l'Effect. Ça permet de l'utiliser dans un `pipe`.

Effect utilise une "dual API" — vous pouvez utiliser les deux formes :
```typescript
// Forme "data-first" (l'Effect est le premier argument)
Effect.map(monEffect, (n) => n * 3)

// Forme "data-last" (curryée, parfaite pour pipe)
monEffect.pipe(Effect.map((n) => n * 3))
```
:::

## Exercice

Combinez les fonctions des exercices précédents avec `pipe`.

**Objectif :**
Écrivez un programme qui, en utilisant uniquement `pipe` ou `.pipe()` :
1. Démarre avec `add(3, 4)` → 7
2. Divise par 2 avec `diviser` → 3.5 (ou 0 si division par zéro)
3. Multiplie par 10 → 35
4. Affiche le résultat avec `Effect.tap(n => Effect.log(String(n)))`
5. Exécute avec `Effect.runSync`

:::tip Ressources

- [Générateurs et Pipe](../../base-de-connaissance/07-generateurs.md)

:::

## Indice 1

<details>
  <summary>La structure générale</summary>

```typescript
const programme = add(3, 4).pipe(
  Effect.flatMap((somme) => diviser(somme, 2)),
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0)),
  Effect.map((n) => n * 10),
  Effect.tap((n) => Effect.log(String(n)))
);

Effect.runSync(programme);
```

</details>

## Indice 2

<details>
  <summary>Pourquoi `Effect.flatMap` et pas `Effect.map` pour la division ?</summary>

`Effect.map` attend une fonction `(a: A) => B` (une valeur simple).
`Effect.flatMap` attend une fonction `(a: A) => Effect<B, E, R>` (un Effect).

`diviser` retourne un `Effect<number, DivisionParZéro>`, donc il faut `flatMap`.

Règle simple :
- La transformation retourne une valeur simple → `Effect.map`
- La transformation retourne un Effect → `Effect.flatMap` (ou `Effect.andThen`)

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

const programme = add(3, 4).pipe(
  // (3 + 4) = 7, puis on divise par 2
  Effect.flatMap((somme) => diviser(somme, 2)),
  // Si division par zéro, on retourne 0
  Effect.catchTag("DivisionParZéro", () => Effect.succeed(0)),
  // Multiplier par 10
  Effect.flatMap((quotient) => multiply(quotient, 10)),
  // Afficher le résultat (side effect)
  Effect.tap((résultat) => Effect.log(`Résultat : ${résultat}`))
);

// Exécuter
Effect.runSync(programme);
// [LOG] Résultat : 35
```

</details>
