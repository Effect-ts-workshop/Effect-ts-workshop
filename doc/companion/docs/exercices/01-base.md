---
sidebar_position: 1
---

# Exercice 1 — Les bases

Avant d'écrire notre première ligne d'Effect, il faut poser deux briques fondamentales que vous allez utiliser dans _chaque_ exercice de l'atelier : la composition de fonctions avec `pipe`, et la création d'effects avec `Effect.succeed`.

Fichier à compléter : `packages/api/_exercices/1-base.spec.ts`

---

## Partie 1 — FP utils

### `pipe`

Imaginons deux fonctions :

```typescript
const add = (a: number, b: number) => a + b
const multiply = (a: number, b: number) => a * b
```

Pour additionner 4 et 6, puis multiplier par 4, on pourrait écrire :

```typescript
const result = multiply(add(4, 6), 4) // 40
```

Ça fonctionne, mais ça se lit de l'intérieur vers l'extérieur. Avec trois transformations, ça devient vite illisible.

`pipe` inverse l'ordre de lecture. La valeur entre en premier, les transformations suivent de gauche à droite :

```typescript
import { pipe } from "effect"

const result = pipe(
  add(4, 6),         // 10 — valeur de départ
  (a) => multiply(a, 4) // 40 — transformation
)
```

Chaque étape reçoit le résultat de la précédente.

#### Exercice

Complétez le `pipe` pour que `result` vaille `40` :

```typescript
const add = (a: number, b: number) => a + b
const multiply = (a: number, b: number) => a * b

const result = pipe(
  add(4, 6),
  // À compléter
)

expect(result).toEqual(40)
```

À vous de jouer !

:::tip Ressources

- [Le type Effect — Transformer des Effects](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>Que reçoit la deuxième étape du pipe ?</summary>

`add(4, 6)` produit `10`. La deuxième étape reçoit `10` et doit renvoyer `40`.

`multiply` prend deux arguments — il faut en fixer un et laisser `pipe` fournir l'autre.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const result = pipe(
  add(4, 6),
  (a) => multiply(a, 4)
)
```

</details>

---

### `pipe` avec des curried functions

Il existe une façon d'écrire des fonctions qui s'intègrent encore plus naturellement dans un `pipe` : les **curried functions**.

Au lieu de prendre tous les arguments en une fois, une curried function les prend un par un :

```typescript
// Fonction normale — tous les arguments d'un coup
const add = (a: number, b: number) => a + b

// Curried — un argument à la fois
const add = (a: number) => (b: number) => a + b
```

Ce que ça change dans un `pipe` : `add(6)` renvoie une fonction `(b: number) => 6 + b`. On peut la passer directement, sans lambda :

```typescript
const result = pipe(
  4,
  add(6),    // (b) => 6 + b  → produit 10
  multiply(4) // (b) => 4 * b  → produit 40
)
```

Plus de `(a) => ...` — les étapes sont plus lisibles.

#### Exercice

Les fonctions `add` et `multiply` sont déjà currifiées. Complétez le `pipe` pour obtenir `40` :

```typescript
const add = (a: number) => (b: number) => a + b
const multiply = (a: number) => (b: number) => a * b

const result = pipe(
  4,
  add(6),
  // À compléter
)

expect(result).toEqual(40)
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Qu'est-ce que `add(6)` renvoie exactement ?</summary>

`add(6)` renvoie une fonction — pas un nombre. `pipe` va appeler cette fonction avec `4`, ce qui donne `10`.

Il suffit de faire la même chose avec `multiply`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const result = pipe(
  4,
  add(6),
  multiply(4)
)
```

</details>

---

## Partie 2 — Effect basics

Avant de coder, une minute pour comprendre _pourquoi_ Effect existe.

En TypeScript, une fonction peut réussir, échouer, ou être asynchrone — mais rien dans son type ne le dit clairement. Une fonction `async` qui peut lancer une erreur est typée `Promise<T>`. L'erreur est invisible.

Effect rend tout explicite dans le type :

```typescript
Effect.Effect<Succès, Erreur, Contexte>
//              ^        ^         ^
//          ce qu'on   ce qui   ce dont
//          obtient    peut     on a besoin
//                     rater
```

Un `Effect` est une **description** d'un programme. Il ne s'exécute pas tout seul — on le lance explicitement :

```typescript
const monEffect = Effect.succeed(42) // description — ne fait rien

Effect.runSync(monEffect) // exécution — produit 42
```

Cette distinction est fondamentale pour la suite.

---

### `Effect.succeed`

La brique de base : envelopper une valeur dans un `Effect`.

```typescript
const result: Effect.Effect<number> = Effect.succeed(42)
```

C'est la façon de dire : _"ce programme, quand il s'exécute, produit 42 sans risque d'erreur"_.

#### Exercice

La fonction `add` calcule une somme, mais sa signature attend un `Effect.Effect<number>`. Enveloppez le résultat avec `Effect.succeed` :

```typescript
const add = (a: number, b: number): Effect.Effect<number> => {
  const result = a + b
  // À compléter : retourner result dans un Effect
}

expect(Effect.runSync(add(2, 8))).toEqual(10)
```

À vous de jouer !

:::tip Ressources

- [Le type Effect — Créer des Effects](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>L'équivalent de `Promise.resolve` pour Effect</summary>

`Effect.succeed` prend une valeur et la place dans un Effect. C'est le pendant de `Promise.resolve` dans le monde Effect.

```typescript
Effect.succeed(maValeur)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const add = (a: number, b: number): Effect.Effect<number> => {
  const result = a + b
  return Effect.succeed(result)
}
```

</details>

---

### `Effect.map`

On a un `Effect<number>` et on veut transformer la valeur à l'intérieur — sans en sortir. C'est le rôle de `map`.

```typescript
pipe(
  Effect.succeed(5),
  Effect.map((n) => n * 2)
)
// → Effect<number> qui contient 10
```

`map` ne déclenche pas l'exécution. Il construit une nouvelle description : _"prends la valeur, applique cette transformation, remets-la dans un Effect"_.

#### Exercice

Transformez `Effect.succeed(2)` avec la fonction `add(8)` en utilisant `Effect.map` :

```typescript
const add = (a: number) => (b: number) => a + b

const result = pipe(
  Effect.succeed(2),
  // À compléter
)

expect(Effect.runSync(result)).toEqual(10)
```

À vous de jouer !

:::tip Ressources

- [Le type Effect — Transformer des Effects](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>`add(8)` est déjà une fonction prête à l'emploi</summary>

`add` est currifiée. `add(8)` renvoie une fonction `(b: number) => 8 + b`.

C'est exactement ce qu'attend `Effect.map` : une fonction qui prend la valeur et la transforme.

```typescript
Effect.map(add(8))
// équivalent à
Effect.map((n) => add(8)(n))
// équivalent à
Effect.map((n) => 8 + n)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const result = pipe(
  Effect.succeed(2),
  Effect.map(add(8))
)
```

</details>

---

### `Effect.flatMap`

Que se passe-t-il si la fonction qu'on passe à `map` renvoie elle-même un `Effect` ?

```typescript
const add = (a: number) => (b: number) => Effect.succeed(a + b)
//                                         ^
//                                  renvoie un Effect !

pipe(
  Effect.succeed(2),
  Effect.map(add(8)) // ← produit Effect<Effect<number>> 😱
)
```

On se retrouve avec un `Effect` imbriqué dans un autre. `flatMap` règle ça : il applique la transformation _et_ aplatit le résultat.

```typescript
pipe(
  Effect.succeed(2),
  Effect.flatMap(add(8)) // ← Effect<number> ✓
)
```

Règle simple : si la fonction renvoie un `Effect`, utilisez `flatMap`. Si elle renvoie une valeur, utilisez `map`.

#### Exercice

`add` renvoie maintenant un `Effect.succeed`. Remplacez `map` par `flatMap` :

```typescript
const add = (a: number) => (b: number) => Effect.succeed(a + b)

const result = pipe(
  Effect.succeed(2),
  // À compléter
)

expect(Effect.runSync(result)).toEqual(10)
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Regardez le type de retour de `add`</summary>

`add(8)` renvoie `(b: number) => Effect.succeed(8 + b)`. La transformation renvoie un `Effect`.

Avec `map`, TypeScript inférerait `Effect<Effect<number>>`. Avec `flatMap`, il aplatit : `Effect<number>`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const result = pipe(
  Effect.succeed(2),
  Effect.flatMap(add(8))
)
```

</details>

---

### `Effect.promise`

Pour intégrer du code asynchrone existant (`Promise`) dans Effect, on utilise `Effect.promise`.

Une subtilité importante : on passe une **fonction** qui renvoie la `Promise`, pas la `Promise` directement.

```typescript
// ❌ La Promise démarre immédiatement — Effect ne contrôle plus rien
Effect.promise(fetch("https://api.example.com"))

// ✓ La Promise ne démarre que quand Effect l'exécute
Effect.promise(() => fetch("https://api.example.com"))
```

C'est cohérent avec l'idée d'Effect : une description, pas une exécution immédiate.

#### Exercice

`add` renvoie une `Promise` après un délai. Enveloppez-la avec `Effect.promise` :

```typescript
const add = (a: number, b: number) =>
  new Promise((resolve) => setTimeout(() => resolve(a + b), 200))

const addWithDelay = (a: number, b: number): Effect.Effect<number> => {
  // À compléter
}

await expect(Effect.runPromise(addWithDelay(2, 8))).resolves.toEqual(10)
```

À vous de jouer !

:::tip Ressources

- [Le type Effect — À partir de Promises](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>Une fonction qui renvoie une Promise</summary>

`Effect.promise` attend `() => Promise<T>`.

`() => add(a, b)` est une fonction qui renvoie la Promise de `add`. C'est exactement ce qu'il faut.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const addWithDelay = (a: number, b: number): Effect.Effect<number> => {
  return Effect.promise(() => add(a, b))
}
```

</details>

---

### `Effect.tryPromise`

`Effect.promise` suppose que la `Promise` ne peut jamais rejeter. Mais dans la réalité, un `fetch` peut échouer réseau, un serveur peut être indisponible.

`Effect.tryPromise` modélise cette faillibilité. Il prend deux fonctions : `try` pour la `Promise`, et `catch` pour transformer l'exception en une erreur **typée** :

```typescript
Effect.tryPromise({
  try: () => fetch(url),
  catch: (_error) => new Error("La requête a échoué")
})
// Type : Effect.Effect<Response, Error>
//                                ^
//                       l'erreur est visible dans le type
```

C'est la différence fondamentale avec `Promise` : l'erreur ne disparaît plus dans un `catch` invisible — elle fait partie du contrat de la fonction.

#### Exercice

Implémentez la fonction `fetch` avec `Effect.tryPromise`. Utilisez `baseFetch` pour la `Promise`, et renvoyez `new Error("meh")` en cas d'échec :

```typescript
import type { fetch as baseFetch } from "undici"

type Fetch = (
  ...args: Parameters<typeof baseFetch>
) => Effect.Effect<Response, Error>

const fetch: Fetch = (input, init) => {
  // À compléter
}
```

À vous de jouer !

:::tip Ressources

- [Le type Effect — À partir de Promises](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>La structure de `tryPromise`</summary>

```typescript
Effect.tryPromise({
  try: () => /* la Promise ici */,
  catch: (_error) => /* l'erreur typée ici */
})
```

`_error` est l'exception brute lancée par la Promise. On la transforme en une valeur qu'on contrôle.

</details>

#### Indice 2

<details>
  <summary>Quel `fetch` appeler à l'intérieur ?</summary>

`baseFetch` est le vrai `fetch` importé de `undici`. Les arguments `input` et `init` sont déjà disponibles dans la closure de votre fonction.

```typescript
const fetch: Fetch = (input, init) => {
  return Effect.tryPromise({
    try: () => baseFetch(input, init),
    // ...
  })
}
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const fetch: Fetch = (input, init) => {
  return Effect.tryPromise({
    try: () => baseFetch(input, init),
    catch: (_error) => new Error("meh")
  })
}
```

</details>
