---
sidebar_position: 1
---

:::danger TODO

- [ ] remove multiply
- [ ] introduire le pipe dans `doc/companion/docs/exercices/01-premiers-pas/02-delay.md`
:::

# Exercice 1 — Addition synchrone

## Le problème avec les fonctions classiques

Regardez cette fonction TypeScript parfaitement ordinaire :

```typescript
function add(a: number, b: number): number {
  return a + b;
}

console.log(add(1, 2)); // 3
```

Elle fonctionne parfaitement. Mais que se passe-t-il si demain elle doit :

- Lire depuis une base de données ?
- Enregistrer des logs ?
- Échouer avec une erreur typée ?

Le type `number` ne changera pas. Il ne dit **rien** sur ce que fait la fonction, ni sur comment elle peut échouer.

## La solution : le type `Effect`

Effect-TS introduit un type qui décrit **tout** ce qu'un programme peut faire :

```typescript
Effect.Effect<Succès, Erreur, Contexte>;
```

- `Succès` — la valeur produite si tout se passe bien
- `Erreur` — les erreurs **typées** qui peuvent survenir
- `Contexte` — les dépendances dont le programme a besoin

Pour commencer simplement, on va ignorer `Erreur` et `Contexte`. Ils ont pour valeur par défaut `never` (jamais d'erreur, aucune dépendance).

## Votre premier Effect

```typescript
import { Effect } from "effect";

const add = (a: number, b: number): Effect.Effect<number> =>
  Effect.succeed(a + b);
```

Le type `Effect.Effect<number>` se lit : _"un programme qui produira un `number`, ne peut pas échouer, et n'a besoin de rien"_.

:::tip `Effect.succeed`
`Effect.succeed(valeur)` crée un Effect qui réussit immédiatement avec cette valeur. C'est l'équivalent de `Promise.resolve(valeur)` mais pour Effect.
:::

## Transformer le résultat avec `Effect.map`

On peut transformer la valeur d'un Effect sans l'exécuter, grâce à `Effect.map` :

```typescript
const résultat = add(1, 2).pipe(Effect.map((somme) => somme * 2));

// Type : Effect.Effect<number>
// Le résultat sera 6, mais on ne l'a pas encore calculé !
```

:::info Le `.pipe()`
`.pipe()` permet de chaîner des transformations. On en reparlera en détail dans la Partie 5.
Pour l'instant, lisez-le comme : _"prends ce Effect, et transforme-le avec..."_
:::

## Exécuter l'Effect

Un Effect ne fait rien tant qu'on ne l'**exécute** pas. Pour une opération synchrone, on utilise `Effect.runSync` :

```typescript
const valeur = Effect.runSync(résultat);
console.log(valeur); // 6
```

:::warning Quand utiliser `runSync` ?
`Effect.runSync` ne fonctionne que si l'Effect est **entièrement synchrone**. Pour les Effects asynchrones, on utilisera `Effect.runPromise` (exercice suivant).
:::

## Vue d'ensemble

```
Effect.succeed(a + b)   →   Effect<number>
       ↓ .pipe(Effect.map(...))
                        →   Effect<number>   (transformé)
       ↓ Effect.runSync(...)
                        →   number           (valeur finale)
```

## Exercice

Ouvrez le fichier `packages/exercises/01-add.ts`.

Transformez ces deux fonctions TypeScript classiques en utilisant Effect :

```typescript
// 1. Convertir en Effect
function add(a: number, b: number): number {
  return a + b;
}

// 2. Convertir en Effect
function multiply(a: number, b: number): number {
  return a * b;
}
```

**Objectif :** Les deux fonctions doivent retourner un `Effect.Effect<number>` et pouvoir être enchaînées avec `Effect.map`.

:::tip Ressources

- [Le type Effect](../../base-de-connaissance/01-le-type-effect.md)

:::

## Indice 1

<details>
  <summary>Si vous ne savez pas par où commencer...</summary>

Regardez la signature du type. Si la fonction retourne `number`, alors l'Effect retourne `Effect.Effect<number>`.

Pour créer un Effect qui contient une valeur, utilisez `Effect.succeed`.

</details>

## Indice 2

<details>
  <summary>Pour enchaîner les deux opérations...</summary>

```typescript
const résultat = add(3, 4).pipe(Effect.flatMap((somme) => multiply(somme, 2)));
```

`Effect.flatMap` sert à enchaîner deux Effects (comme `.then()` pour les Promises).
`Effect.map` sert à transformer la valeur avec une fonction ordinaire (pas un Effect).

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect } from "effect";

const add = (a: number, b: number): Effect.Effect<number> =>
  Effect.succeed(a + b);

const multiply = (a: number, b: number): Effect.Effect<number> =>
  Effect.succeed(a * b);

// Utilisation
const résultat = add(3, 4).pipe(Effect.flatMap((somme) => multiply(somme, 2)));

const valeur = Effect.runSync(résultat);
console.log(valeur); // 14
```

</details>
