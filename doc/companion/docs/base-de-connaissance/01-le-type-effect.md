---
sidebar_position: 1
---

# Le type Effect

## Définition

<!-- prettier-ignore -->
```typescript
Effect.Effect<Value, Error, Context>
```

Un `Effect` est une **description** d'un programme. Il n'exécute rien par lui-même — c'est comme une recette de cuisine. Le plat n'existe que si l'on dispose des ingrédients et qu'on le cuisine.

Les trois paramètres de type `Effect` décrivent tout ce que le programme peut faire :

| Paramètre | Valeur par défaut | Signification                                       |
| --------- | ----------------- | --------------------------------------------------- |
| `Value`   | —                 | Le type de la valeur produite si tout va bien       |
| `Error`   | `never`           | Les types d'erreurs **typées** qui peuvent survenir |
| `Context` | `never`           | Les services/dépendances dont le programme a besoin |

`never` signifie "jamais" — `Error = never` veut dire "ne peut pas échouer", `Context = never` veut dire "n'a pas besoin de dépendances". Dans la documentation officielle, vous retrouvez la syntaxe abrégée `Effect<A, E, R>`

## Exemples de types

<!-- prettier-ignore -->
```typescript
// Produit un number, ne peut pas échouer, pas de dépendances
Effect.Effect<number>
// équivalent à Effect.Effect<number, never, never>

// Produit un string, peut échouer avec une erreur réseau
Effect.Effect<string, NetworkError>

// Produit un Item, peut échouer de deux façons, a besoin d'un HttpClient
Effect.Effect<Item, NetworkError | NotFound, HttpClient.HttpClient>
```

## Créer des Effects

### Valeur simple

<!-- prettier-ignore -->
```typescript
// Succès immédiat
const ok = Effect.succeed(42);
// Type : Effect<number>

// Erreur immédiate
const ko = Effect.fail(new MyError());
// Type : Effect<never, MyError>

// Calcul synchrone (peut lancer des exceptions — elles deviennent des défauts)
const calcul = Effect.sync(() => Math.random());
// Type : Effect<number>
```

### Calculs synchrones

<!-- prettier-ignore -->
```typescript
// Calcul synchrone sans risque d'erreur
const calcul = Effect.sync(() => Math.random())
// Type : Effect<number>
// La fonction est évaluée de façon lazy — pas immédiatement

// Calcul synchrone qui peut lancer une exception
const parse = Effect.try({
  try: () => JSON.parse(input),
  catch: (e) => new ParseError({ message: String(e) })
})
// Type : Effect<unknown, ParseError>
// Les exceptions deviennent des erreurs typées
```

`Effect.sync` est l'équivalent de `Effect.succeed` pour un calcul (pas une valeur déjà calculée). `Effect.try` est l'équivalent de `Effect.tryPromise` pour le code synchrone.

### À partir de Promesses

<!-- prettier-ignore -->
```typescript
// Sans gestion d'erreur (les exceptions sont des _defects_)
const p1 = Effect.promise(() => fetch("/api"));
// Type : Effect<Response>

// Avec gestion d'erreur (les exceptions sont des erreurs typées)
const p2 = Effect.tryPromise({
  try: () => fetch("/api"),
  catch: (e) => new NetworkError({ message: String(e) }),
});
// Type : Effect<Response, NetworkError>
```

### Asynchrone avec durée

<!-- prettier-ignore -->
```typescript
import { Duration } from "effect";

const wait = Effect.sleep(Duration.seconds(2));
// Type : Effect<void>
```

## Exécuter des Effects

Un Effect ne fait rien jusqu'à ce qu'on l'exécute. Effect fournit plusieurs "runners" :

<!-- prettier-ignore -->
```typescript
// Pour les Effects entièrement synchrones
const value = Effect.runSync(myEffect);

// Pour les Effects potentiellement asynchrones
const promise = Effect.runPromise(myEffect);

// Pour les Effects avec résultat sous forme d'Exit (succès ou échec)
const exit = Effect.runSyncExit(myEffect);
// Exit.Success<A> | Exit.Failure<E>
```

:::warning
N'appelez `Effect.run*` qu'**une seule fois**, au point d'entrée de votre programme. À l'intérieur d'Effect, composez les Effects avec `flatMap`, `gen`, etc. — ne les exécutez pas prématurément.
:::

## Transformer des Effects

<!-- prettier-ignore -->
```typescript
// Transformer la valeur de succès (A → B)
Effect.map(fn)

// Chaîner un autre Effect (A → Effect<B>)
Effect.flatMap(fn)

// Chaîner un Effect ou une valeur directe
Effect.andThen(fn)

// Effet secondaire sans changer la valeur par exemple Effect.tap(Effect.log)
Effect.tap(fn)
```

### Récupération sur échec

<!-- prettier-ignore -->
```typescript
// Si l'Effect échoue on peut le remplacer par un autre Effect
pipe(
  fetchJoke(),
  Effect.orElse(() => Effect.succeed("Blague par défaut"))
)
// Si fetchJoke() échoue → "Blague par défaut"
// Si fetchJoke() réussit → la valeur qu'il renvoie

// Ou dans sa version abrégée
pipe(
  fetchJoke(),
  Effect.orElseSucceed(() => "Blague par défaut")
)
```

`Effect.orElse` est différent de `Effect.catchAll` :

- `Effect.orElse` remplace l'Effect entier sans inspecter l'erreur.
- `Effect.catchAll` reçoit l'erreur en argument et permet de la traiter.

## Combiner des Effects

### `Effect.all` — déclarer plusieurs Effects en parallèle

<!-- prettier-ignore -->
```typescript
import { Effect, pipe } from "effect"

// La structure de l'objet sera préservée dans le résultat
const program = pipe(
  Effect.all({
    users: fetchUsers(),
    config: loadConfig()
  })
  // → { users: User[], config: Config }
)

// De même avec un ableau
const results = yield* Effect.all([effect1, effect2, effect3])
// → [result1, results2, result3]
```

Par défaut, lorsque les Effects s'exécutent en parallèle, si l'un échoue, les autres sont interrompus.

<!-- prettier-ignore -->
```typescript
// Séquentiel (un par un)
yield* Effect.all(effects, { concurrency: 1 })

// Parallèle limité
yield* Effect.all(effects, { concurrency: 3 })
```

Voir la fiche [Fibers et Concurrence](./13-fibers-concurrence.md) pour les détails sur la concurrence.
