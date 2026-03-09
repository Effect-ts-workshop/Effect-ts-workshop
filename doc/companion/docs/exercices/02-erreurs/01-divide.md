---
sidebar_position: 1
---

# Exercice 3 — Division typée

## Le problème des exceptions cachées

Voici une fonction de division classique :

```typescript
function diviser(a: number, b: number): number {
  if (b === 0) throw new Error("Division par zéro !");
  return a / b;
}
```

Le type de retour est `number`. Rien dans ce type n'indique que cette fonction **peut échouer**. Un développeur qui utilise cette fonction sans lire son code ne saura jamais qu'il doit gérer cette erreur.

```typescript
const résultat = diviser(10, 0);
// 💥 Exception à l'exécution — rien ne nous avertissait !
console.log(résultat);
```

## Le Railway Pattern

Imaginez deux rails de chemin de fer qui partent en parallèle :

```
          ✅ Succès ──────────────────────────────────→ résultat
         /
Entrée──<
         \
          ❌ Erreur ───────────────────────────────────→ erreur typée
```

Un Effect emprunte **toujours** l'un des deux rails. Et **les deux sont visibles dans le type** :

```typescript
Effect.Effect<number, DivisionParZéro>
//             ↑         ↑
//          Succès     Erreur
```

## Créer une erreur typée avec `Data.TaggedError`

Effect fournit `Data.TaggedError` pour créer des erreurs avec un **identifiant unique** (le tag) :

```typescript
import { Data } from "effect";

class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}
```

Décortiquons cette ligne :
- `class DivisionParZéro` — notre classe d'erreur
- `extends Data.TaggedError("DivisionParZéro")` — lui donne un tag `"DivisionParZéro"`
- `<{}>` — les données additionnelles (vide ici, on verra des exemples avec données dans le prochain exercice)

:::info Pourquoi un tag ?
Le tag permet à Effect de reconnaître et filtrer les erreurs précisément. C'est grâce à lui que `Effect.catchTag("DivisionParZéro", ...)` fonctionne (exercice 5).
:::

## Utiliser `Effect.fail`

Pour signaler une erreur, on utilise `Effect.fail` :

```typescript
import { Effect, Data } from "effect";

class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

const diviser = (a: number, b: number): Effect.Effect<number, DivisionParZéro> =>
  b === 0
    ? Effect.fail(new DivisionParZéro())
    : Effect.succeed(a / b);
```

Le type `Effect.Effect<number, DivisionParZéro>` se lit :
_"Un programme qui peut produire un `number` (succès) ou une `DivisionParZéro` (erreur)."_

## Observer le Railway en action

```typescript
const résultat1 = diviser(10, 2);
// Type : Effect<number, DivisionParZéro>
// Rail emprunté : ✅ Succès → 5

const résultat2 = diviser(10, 0);
// Type : Effect<number, DivisionParZéro>
// Rail emprunté : ❌ Erreur → DivisionParZéro
```

Les deux ont le **même type**. Effect ne sait pas encore quel rail sera emprunté — cela se décide à l'exécution.

## Exécuter et voir les deux cas

```typescript
// Cas succès
Effect.runSync(diviser(10, 2));
// → 5

// Cas erreur — Effect lance l'erreur si elle n'est pas gérée
Effect.runSync(diviser(10, 0));
// 💥 DivisionParZéro (on apprendra à la gérer dans l'exercice 5)
```

:::warning
`Effect.runSync` lance une exception si l'Effect est sur le rail d'erreur et que l'erreur n'est pas gérée. C'est normal — on verra comment récupérer les erreurs dans l'exercice 5.
:::

## Exercice

Transformez cette fonction classique en utilisant Effect avec une erreur typée :

```typescript
function racineCarrée(n: number): number {
  if (n < 0) throw new Error("Impossible de calculer la racine carrée d'un nombre négatif");
  return Math.sqrt(n);
}
```

**Objectif :**
1. Créer une classe `NombreNégatif` avec `Data.TaggedError`.
2. Transformer `racineCarrée` pour qu'elle retourne `Effect.Effect<number, NombreNégatif>`.

:::tip Ressources

- [Le type Effect](../../base-de-connaissance/01-le-type-effect.md)
- [Erreurs et Défauts](../../base-de-connaissance/02-erreurs-et-defauts.md)
- [Railway Pattern](../../base-de-connaissance/03-railway-pattern.md)

:::

## Indice 1

<details>
  <summary>Comment créer la classe d'erreur ?</summary>

```typescript
import { Data } from "effect";

class NombreNégatif extends Data.TaggedError("NombreNégatif")<{}> {}
```

Le `<{}>` signifie "pas de données additionnelles dans cette erreur". On pourrait y mettre le nombre qui pose problème :

```typescript
class NombreNégatif extends Data.TaggedError("NombreNégatif")<{
  valeur: number;
}> {}

// Utilisation : new NombreNégatif({ valeur: -5 })
```

</details>

## Indice 2

<details>
  <summary>Comment structurer la fonction ?</summary>

La structure est une condition ternaire :

```typescript
const racineCarrée = (n: number): Effect.Effect<number, NombreNégatif> =>
  n < 0
    ? Effect.fail(new NombreNégatif())
    : Effect.succeed(Math.sqrt(n));
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Data } from "effect";

class NombreNégatif extends Data.TaggedError("NombreNégatif")<{
  valeur: number;
}> {}

const racineCarrée = (n: number): Effect.Effect<number, NombreNégatif> =>
  n < 0
    ? Effect.fail(new NombreNégatif({ valeur: n }))
    : Effect.succeed(Math.sqrt(n));

// Tests
console.log(Effect.runSync(racineCarrée(9)));  // 3
console.log(Effect.runSync(racineCarrée(2)));  // 1.4142...
// Effect.runSync(racineCarrée(-1));            // 💥 NombreNégatif { valeur: -1 }
```

</details>
