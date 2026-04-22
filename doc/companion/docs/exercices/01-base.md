---
sidebar_position: 1
---

# Exercice 1 - Les bases

Cet exercice ne cherche pas à vous faire mémoriser des API. Il pose deux idées qui vont changer votre façon de lire et d'écrire du TypeScript.

La première : `pipe`, pour composer des transformations dans l'ordre naturel de lecture. La deuxième : `Effect`, pour rendre explicite dans le type ce qu'une fonction peut faire - réussir ou échouer, aussi bien de maniere synchrone qu'asynchrone.

Ces deux idées sont indépendantes pour l'instant. Elles s'assemblent dès l'exercice suivant.

Fichier à compléter : `packages/api/_exercices/1-base.spec.ts`

---

## Partie 1 - FP utils

### Transformer une fonction en curried function

Certaines fonctions prennent plusieurs arguments en une fois :

<!-- prettier-ignore -->
```typescript
const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
greet("Hello", "Alice"); // "Hello, Alice!"
```

Une **curried function** prend les mêmes arguments, mais un par un. Chaque appel partiel renvoie une nouvelle fonction :

<!-- prettier-ignore -->
```typescript
const greet = (greeting: string) => (name: string) => `${greeting}, ${name}!`;

greet("Hello");         // (name: string) => "Hello, " + name + "!"
greet("Hello")("Alice") // "Hello, Alice!"
```

`greet("Hello")` ne produit pas encore de résultat - elle fixe le premier argument et attend le second.

#### Exercice

Transformez `add` et `multiply` en curried functions :

<!-- prettier-ignore -->
```typescript
const add = (a: number, b: number) => a + b;
const multiply = (a: number, b: number) => a * b;

const currifiedAdd = ??? // À compléter
const currifiedMultiply = ??? // À compléter

expect(add(4, 6)).toEqual(currifiedAdd(4)(6));
expect(multiply(4, 6)).toEqual(currifiedMultiply(4)(6));
```

À vous de jouer !

#### Indice 1

<details>
  <summary>La structure d'une curried function à deux arguments</summary>

<!-- prettier-ignore -->
```typescript
const fn = (a: number) => (b: number) => /* résultat */;
```

Le premier appel fixe `a`. Le second appel fournit `b` et produit le résultat.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const currifiedAdd = (a: number) => (b: number) => a + b;
const currifiedMultiply = (a: number) => (b: number) => a * b;
```

</details>

---

### Composer des transformations avec `pipe`

Pour transformer une valeur en enchaînant plusieurs fonctions, on pourrait les imbriquer :

<!-- prettier-ignore -->
```typescript
const trim = (s: string) => s.trim();
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const result = capitalize(trim("  alice  ")); // "Alice"
```

Ça fonctionne, mais ça se lit de l'intérieur vers l'extérieur. Avec trois transformations, ça devient vite illisible.

`pipe` inverse l'ordre de lecture. La valeur entre en premier, les transformations suivent de gauche à droite :

<!-- prettier-ignore -->
```typescript
import { pipe } from "effect";

const result = pipe(
  "  alice  ",
  trim,       // "alice"
  capitalize, // "Alice"
);
```

Et avec des curried functions, plus besoin de lambda intermédiaire - on passe directement la fonction partiellement appliquée :

<!-- prettier-ignore -->
```typescript
const add = (a: number) => (b: number) => a + b;
const multiply = (a: number) => (b: number) => a * b;

pipe(4, add(6), multiply(4)); // 40
//       ^           ^
//  add(6) renvoie une fonction (b) => 6 + b
//  multiply(4) renvoie une fonction (b) => 4 * b
```

#### Exercice

Les fonctions `add` et `multiply` sont déjà currifiées. Complétez le `pipe` pour obtenir `40` :

<!-- prettier-ignore -->
```typescript
const add = (a: number) => (b: number) => a + b;
const multiply = (a: number) => (b: number) => a * b;

const result = pipe(
  4,
  add(6),
  // À compléter
);

expect(result).toEqual(40);
```

À vous de jouer !

:::tip Ressources

- [Le type Effect - Transformer des Effects](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>Qu'est-ce que `add(6)` renvoie exactement ?</summary>

`add(6)` renvoie une fonction - pas un nombre. `pipe` va appeler cette fonction avec `4`, ce qui donne `10`.

Il suffit de faire la même chose avec `multiply`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const result = pipe(
  4,
  add(6),
  multiply(4)
);
```

</details>

---

## Partie 2 - Effect basics

Une question avant de coder : _qu'est-ce que le type d'une fonction vous dit vraiment ?_

<!-- prettier-ignore -->
```typescript
const fetchUser = (id: string): Promise<User> => { ... }
```

Elle peut réussir. Elle peut échouer sur le réseau. Elle peut dépendre d'une connexion base de données. Mais son type `Promise<User>` n'en dit rien. L'erreur possible est invisible. Les dépendances sont cachées.

Effect rend tout ça explicite :

<!-- prettier-ignore -->
```typescript
Effect.Effect<Value, Error, Requirements>;
//              ^      ^         ^
//          ce qu'on  ce qui   ce dont
//          obtient   peut     on a besoin
//                    rater
```

Ce n'est pas juste un wrapper - c'est un nouveau contrat. La fonction dit ce qu'elle produit, ce qui peut rater, et ce dont elle a besoin. Plus de surprises à l'exécution.

Et justement : un `Effect` est une **description** d'un programme. Il ne s'exécute pas tout seul - on le lance explicitement.

<!-- prettier-ignore -->
```typescript
const myEffect = Effect.succeed(42); // description - ne fait rien

Effect.runSync(myEffect); // exécution - produit 42
```

Retenez cette distinction. Elle est au cœur de tout ce que vous ferez avec Effect.

---

### Envelopper une valeur dans un Effect

La brique de base : envelopper une valeur dans un `Effect`.

<!-- prettier-ignore -->
```typescript
const result: Effect.Effect<number> = Effect.succeed(42);
```

C'est la façon de dire : _"ce programme, quand il s'exécute, produit 42 sans risque d'erreur"_.

#### Exercice

La fonction `add` calcule une somme, mais sa signature attend un `Effect.Effect<number>`. Enveloppez le résultat avec `Effect.succeed` :

<!-- prettier-ignore -->
```typescript
const add = (a: number, b: number): Effect.Effect<number> => {
  const result = a + b;
  // À compléter : retourner result dans un Effect
};

expect(Effect.runSync(add(2, 8))).toEqual(10);
```

À vous de jouer !

:::tip Ressources

- [Le type Effect - Créer des Effects](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>L'équivalent de `Promise.resolve` pour Effect</summary>

`Effect.succeed` prend une valeur et la place dans un Effect. C'est le pendant de `Promise.resolve` dans le monde Effect.

<!-- prettier-ignore -->
```typescript
Effect.succeed(myValue);
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const add = (a: number, b: number): Effect.Effect<number> => {
  const result = a + b;
  return Effect.succeed(result);
};
```

</details>

---

### Transformer la valeur d'un Effect

On a un `Effect` et on veut transformer la valeur à l'intérieur - sans en sortir. C'est le rôle de `map`.

<!-- prettier-ignore -->
```typescript
pipe(
  Effect.succeed("alice"),
  Effect.map((name) => name.toUpperCase()),
);
// → Effect<string> qui contient "ALICE"
```

`map` ne déclenche pas l'exécution. Il construit une nouvelle description : _"prends la valeur, applique cette transformation, remets-la dans un Effect"_.

#### Exercice

Transformez `Effect.succeed(2)` avec la fonction `add(8)` en utilisant `Effect.map` :

<!-- prettier-ignore -->
```typescript
const add = (a: number) => (b: number) => a + b;

const result = pipe(
  Effect.succeed(2),
  // À compléter
);

expect(Effect.runSync(result)).toEqual(10);
```

À vous de jouer !

:::tip Ressources

- [Le type Effect - Transformer des Effects](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>`add(8)` est déjà une fonction prête à l'emploi</summary>

`add` est currifiée : `add(8)` renvoie une fonction `(b: number) => 8 + b`.

`Effect.map` attend précisément une fonction de ce type - pas besoin de lambda supplémentaire.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const result = pipe(
  Effect.succeed(2), 
  Effect.map(add(8))
);
```

</details>

---

### Enchaîner des transformations qui produisent un Effect

Que se passe-t-il si la fonction qu'on passe à `map` renvoie elle-même un `Effect` ?

<!-- prettier-ignore -->
```typescript
const double = (n: number) => Effect.succeed(n * 2);
//                            ^
//                     renvoie un Effect !

pipe(
  Effect.succeed(5),
  Effect.map(double), // ← produit Effect<Effect<number>> 😱
);
```

On se retrouve avec un `Effect` imbriqué dans un autre. `flatMap` règle ça : il applique la transformation _et_ aplatit le résultat.

<!-- prettier-ignore -->
```typescript
pipe(
  Effect.succeed(5),
  Effect.flatMap(double), // ← Effect<number> ✓
);
```

Règle simple : si la fonction renvoie un `Effect`, utilisez `flatMap`. Si elle renvoie une valeur, utilisez `map`.

#### Exercice

`greet` renvoie un `Effect.succeed`. Utilisez `flatMap` pour obtenir `"Hello, World!"` :

<!-- prettier-ignore -->
```typescript
const greet = (greeting: string) => (name: string) => Effect.succeed(`${greeting}, ${name}!`);

const result = pipe(
  Effect.succeed("World"),
  // À compléter
);

expect(Effect.runSync(result)).toEqual("Hello, World!");
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Regardez le type de retour de `greet`</summary>

`greet("Hello")` renvoie une fonction `(name: string) => Effect.succeed(...)`. La transformation renvoie un `Effect`.

Avec `map`, TypeScript inférerait `Effect<Effect<string>>`. Avec `flatMap`, il aplatit : `Effect<string>`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const result = pipe(
  Effect.succeed("World"),
  Effect.flatMap(greet("Hello"))
);
```

</details>

---

### Intégrer une opération asynchrone

Pour intégrer du code asynchrone existant (`Promise`) dans Effect, on utilise `Effect.promise`.

Une subtilité importante : on passe une **fonction** qui renvoie la `Promise`, pas la `Promise` directement.

<!-- prettier-ignore -->
```typescript
// ❌ La Promise démarre immédiatement - Effect ne contrôle plus rien
Effect.promise(fetch("https://api.example.com"));

// ✓ La Promise ne démarre que quand Effect l'exécute
Effect.promise(() => fetch("https://api.example.com"));
```

C'est cohérent avec l'idée d'Effect : une description, pas une exécution immédiate.

#### Exercice

`add` renvoie une `Promise` après un délai. Enveloppez-la avec `Effect.promise` :

<!-- prettier-ignore -->
```typescript
const add = (a: number, b: number) =>
  new Promise((resolve) => setTimeout(() => resolve(a + b), 200));

const addWithDelay = (a: number, b: number): Effect.Effect<number> => {
  // À compléter
};

await expect(Effect.runPromise(addWithDelay(2, 8))).resolves.toEqual(10);
```

À vous de jouer !

:::tip Ressources

- [Le type Effect - À partir de Promises](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>Une fonction qui renvoie une Promise</summary>

`Effect.promise` attend `() => Promise<T>` - une fonction qui retourne une Promise, pas la Promise elle-même.

Les arguments `a` et `b` sont déjà disponibles dans la closure de `addWithDelay`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const addWithDelay = (a: number, b: number): Effect.Effect<number> => {
  return Effect.promise(() => add(a, b));
};
```

</details>

---

### Modéliser une opération asynchrone faillible

:::note Test optionnel
Ce test est marqué `[OPTIONAL]` dans la spec - passez-le si vous manquez de temps.
:::

`Effect.promise` suppose que la `Promise` ne peut jamais rejeter. Mais dans la réalité, la plupart des operations asynchrones peuvent échouer. Si on prend l'exemple de `fetch`, le réseau ou le serveur peut être indisponible.

`Effect.tryPromise` modélise cette faillibilité. Il prend deux fonctions : `try` pour la `Promise`, et `catch` pour transformer l'exception en une erreur **typée** :

<!-- prettier-ignore -->
```typescript
Effect.tryPromise({
  try: () => fetch(url),
  catch: (_error) => new Error("La requête a échoué"),
});
// Type : Effect.Effect<Response, Error>
//                                ^
//                       l'erreur est visible dans le type
```

C'est la différence fondamentale avec `Promise` : l'erreur ne disparaît plus dans un `catch` invisible - elle fait partie du contrat de la fonction.

Vous venez de découvrir les deux premiers parametres du type `Effect` : succès, erreur. L'exercice suivant approfondit la gestion d'erreurs - comment les modéliser, les distinguer, et s'en remettre proprement.

#### Exercice

Implémentez la fonction `fetch` avec `Effect.tryPromise`. Utilisez `baseFetch` pour la `Promise`, et renvoyez `new Error("meh")` en cas d'échec :

<!-- prettier-ignore -->
```typescript
import type { fetch as baseFetch } from "undici";

type Fetch = (
  ...args: Parameters<typeof baseFetch>
) => Effect.Effect<Response, Error>;

const fetch: Fetch = (input, init) => {
  // À compléter
};
```

À vous de jouer !

:::tip Ressources

- [Le type Effect - À partir de Promises](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>La structure de `tryPromise`</summary>

<!-- prettier-ignore -->
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

`baseFetch` est le vrai `fetch` importé de `undici`. Les arguments `input` et `init` sont déjà disponibles dans la closure - ce sont exactement les arguments à transmettre à `baseFetch`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const fetch: Fetch = (input, init) => {
  return Effect.tryPromise({
    try: () => baseFetch(input, init),
    catch: (_error) => new Error("meh"),
  });
};
```

</details>
