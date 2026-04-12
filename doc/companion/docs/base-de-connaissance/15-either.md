---
sidebar_position: 15
---

# Either

## Qu'est-ce qu'`Either` ?

`Either<A, E>` est un type qui représente **deux cas exclusifs** :

- `Right<A>` — le cas "succès" (la valeur `A`)
- `Left<E>` — le cas "échec" (la valeur `E`)

<!-- prettier-ignore -->
```typescript
import { Either } from "effect"

Either.right(42)          // Either<number, never>
Either.left("pas trouvé") // Either<never, string>
```


La convention : `Right` = bien, `Left` = problème. C'est l'inverse de l'ordre alphabétique — mnémotechnique : `Right` = correct.

`Either<A,E>` permet d'implémenter facilement le _railway pattern_ avec d'un côté le _happy path_ (`Right`) et de l'autre le canal des erreurs (`Left`)
---

## Quand utiliser `Either` plutôt qu'`Effect` ?

`Either` est synchrone et ne nécessite pas de runtime Effect. C'est le bon choix quand :

- Le résultat est **synchrone** et **immédiat**
- Il n'y a **pas de dépendances** (pas de services, pas de contexte)
- On veut **manipuler l'erreur comme une valeur** (la passer, la transformer, la combiner)

<!-- prettier-ignore -->
```typescript
// Either — synchrone, pas de runtime
const parseAge = (input: string): Either.Either<number, string> => {
  const n = parseInt(input)
  return isNaN(n) ? Either.left("pas un nombre") : Either.right(n)
}

// Effect — pour l'asynchrone, les dépendances, la composition
const fetchUser = (id: string): Effect.Effect<User, NotFound> => ...
```

---

## Créer un `Either`

<!-- prettier-ignore -->
```typescript
import { Either } from "effect"

Either.right(42)           // Right — succès
Either.left("erreur")      // Left — échec

// Depuis une valeur nullable
Either.fromNullable(value, () => "valeur manquante")
// null/undefined → Left("valeur manquante")
// sinon → Right(value)

// Depuis un prédicat
Either.liftPredicate(
  (n: number) => n > 0,
  (n) => `${n} n'est pas positif`
)(42)
// → Right(42) si 42 > 0, Left("...") sinon
```

---

## Tester le cas

<!-- prettier-ignore -->
```typescript
Either.isRight(result) // true si Right
Either.isLeft(result)  // true si Left

// Pattern matching
Either.match(result, {
  onLeft: (error) => `Erreur : ${error}`,
  onRight: (value) => `Succès : ${value}`
})
```

---

## Transformer un `Either`

Toutes les transformations sont **right-biased** : elles s'appliquent principalement à `Right` et laissent `Left` intact (sauf exceptions).

<!-- prettier-ignore -->
```typescript
// Transformer la valeur Right
pipe(
  Either.right(5),
  Either.map((n) => n * 2)
)
// → Right(10)

pipe(
  Either.left("erreur"),
  Either.map((n) => n * 2)
)
// → Left("erreur") — inchangé

// Transformer la valeur Left
pipe(
  Either.left("réseau"),
  Either.mapLeft((e) => `Erreur : ${e}`)
)
// → Left("Erreur : réseau")

// Transformer les deux
pipe(
  result,
  Either.mapBoth({
    onLeft: (e) => new Error(e),
    onRight: (n) => String(n)
  })
)
```

---

## Enchaîner avec `flatMap`

<!-- prettier-ignore -->
```typescript
const parseAndDouble = (input: string) =>
  pipe(
    parseAge(input),                  // Either<number, string>
    Either.flatMap((age) =>
      age > 150
        ? Either.left("âge irréaliste")
        : Either.right(age * 2)
    )
  )
```

Si le premier `Either` est `Left`, `flatMap` ne s'exécute pas — comportement identique à `Effect.flatMap`.

---

## Extraire la valeur

<!-- prettier-ignore -->
```typescript
Either.getOrElse(result, () => 0)       // valeur Right, ou 0 si Left
Either.getOrThrow(result)               // valeur Right, ou lève une exception
Either.getOrNull(result)                // valeur Right, ou null
Either.getOrUndefined(result)           // valeur Right, ou undefined
```

---

## `Either` dans l'atelier

### Validation avec Schema

`Schema.decodeUnknownEither` retourne un `Either` au lieu de lancer une exception :

<!-- prettier-ignore -->
```typescript
import { Either, Schema } from "effect"

const result = Schema.decodeUnknownEither(UserSchema)({ name: "Alice" })

if (Either.isLeft(result)) {
  // result.left est un ParseError
  const errors = ParseResult.ArrayFormatter.formatErrorSync(result.left)
} else {
  // result.right est un User valide
  const user = result.right
}
```

### Transformer l'erreur avec `mapLeft`

Pattern courant pour formater les erreurs de validation :

<!-- prettier-ignore -->
```typescript
const errors = pipe(
  Schema.decodeUnknownEither(schema)(data),
  Either.mapLeft(ParseResult.ArrayFormatter.formatErrorSync),
  Either.map(() => [] as never[]),
  Either.getOrElse((errs) => errs)
)
```

---

## Différence avec les autres types de résultat

| Type              | Usage                                               | Sync/Async |
| ----------------- | --------------------------------------------------- | ---------- |
| `Either<A, E>`    | Résultat qui peut réussir ou échouer                | Synchrone  |
| `Option<A>`       | Valeur qui peut être absente                        | Synchrone  |
| `Effect<A, E, R>` | Programme composable avec dépendances               | Les deux   |
| `Exit<A, E>`      | Comment une Fiber s'est terminée                    | —          |
| `Result<A, E>`    | État d'un Atom asynchrone (initial/success/failure) | —          |

:::tip `Either` vs `Effect`
Un `Either<A, E>` peut toujours être converti en `Effect<A, E>` avec `Effect.fromEither`. L'inverse (un Effect synchrone vers Either) est possible avec `Effect.runSyncExit` + conversion.

Dans la pratique, utilisez `Either` dans les fonctions utilitaires pures, `Effect` dès que vous avez besoin de composer avec du code Effect.
:::
