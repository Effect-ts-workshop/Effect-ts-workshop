---
sidebar_position: 1
---

# Le type Effect

## Définition

<!-- prettier-ignore -->
```typescript
Effect.Effect<Succès, Erreur, Contexte>
```

Un `Effect` est une **description** d'un programme. Il n'exécute rien par lui-même — c'est comme une recette de cuisine. Le plat n'existe que quand on la cuisine.

Les trois paramètres de type décrivent tout ce que le programme peut faire :

| Paramètre  | Valeur par défaut | Signification                                       |
| ---------- | ----------------- | --------------------------------------------------- |
| `Succès`   | —                 | Le type de la valeur produite si tout va bien       |
| `Erreur`   | `never`           | Les types d'erreurs **typées** qui peuvent survenir |
| `Contexte` | `never`           | Les services/dépendances dont le programme a besoin |

`never` signifie "jamais" — `Erreur = never` veut dire "ne peut pas échouer", `Contexte = never` veut dire "n'a pas besoin de dépendances". Dans la documentation officielle, vous retrouvez la syntaxe anglaise Effect<A,E,R>

## Exemples de types

<!-- prettier-ignore -->
```typescript
// Produit un number, ne peut pas échouer, pas de dépendances
Effect.Effect<number>
// équivalent à Effect.Effect<number, never, never>

// Produit un string, peut échouer avec ErreurRéseau
Effect.Effect<string, ErreurRéseau>

// Produit un Item, peut échouer de deux façons, a besoin d'un HttpClient
Effect.Effect<Item, ErreurRéseau | NonTrouvé, HttpClient.HttpClient>
```

## Créer des Effects

### Valeur simple

<!-- prettier-ignore -->
```typescript
// Succès immédiat
const ok = Effect.succeed(42);
// Type : Effect<number>

// Erreur immédiate
const ko = Effect.fail(new MonErreur());
// Type : Effect<never, MonErreur>

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

### À partir de Promises

<!-- prettier-ignore -->
```typescript
// Sans gestion d'erreur (exceptions → défauts)
const p1 = Effect.promise(() => fetch("/api"));
// Type : Effect<Response>

// Avec gestion d'erreur (exceptions → erreurs typées)
const p2 = Effect.tryPromise({
  try: () => fetch("/api"),
  catch: (e) => new ErreurRéseau({ message: String(e) }),
});
// Type : Effect<Response, ErreurRéseau>
```

### Asynchrone avec durée

<!-- prettier-ignore -->
```typescript
import { Duration } from "effect";

const attente = Effect.sleep(Duration.seconds(2));
// Type : Effect<void>
```

## Exécuter des Effects

Un Effect ne fait rien jusqu'à ce qu'on l'exécute. Effect fournit plusieurs "runners" :

<!-- prettier-ignore -->
```typescript
// Pour les Effects entièrement synchrones
const valeur = Effect.runSync(monEffect);

// Pour les Effects potentiellement asynchrones
const promesse = Effect.runPromise(monEffect);

// Pour les Effects avec résultat sous forme d'Exit (succès ou échec)
const exit = Effect.runSyncExit(monEffect);
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

// Effet secondaire sans changer la valeur
Effect.tap(fn)

// Logger la valeur (pratique pour déboguer)
Effect.tap(Effect.log)
```

### Récupération sur échec

<!-- prettier-ignore -->
```typescript
// Fallback si l'Effect échoue — remplacer par un autre Effect
pipe(
  fetchJoke(),
  Effect.orElse(() => Effect.succeed("Blague par défaut"))
)
// Si fetchJoke() échoue → "Blague par défaut"
// Si fetchJoke() réussit → sa valeur originale

// Fallback avec une valeur simple (raccourci)
pipe(
  fetchJoke(),
  Effect.orElseSucceed(() => "Blague par défaut")
)
```

`Effect.orElse` est différent de `Effect.catchAll` : il remplace l'Effect entier sans inspecter l'erreur. `Effect.catchAll` reçoit l'erreur en argument et permet de la traiter.

## Combiner des Effects

### `Effect.all` — plusieurs Effects en parallèle

<!-- prettier-ignore -->
```typescript
import { Effect, pipe } from "effect"

// Objet — structure préservée dans le résultat
const program = pipe(
  Effect.all({
    users: fetchUsers(),
    config: loadConfig()
  })
  // → { users: User[], config: Config }
)

// Tableau
const results = yield* Effect.all([effect1, effect2, effect3])
// → [résultat1, résultat2, résultat3]
```

Par défaut, les Effects s'exécutent en parallèle. Si l'un échoue, les autres sont interrompus.

<!-- prettier-ignore -->
```typescript
// Séquentiel (un par un)
yield* Effect.all(effects, { concurrency: 1 })

// Parallèle limité
yield* Effect.all(effects, { concurrency: 3 })
```

Voir la fiche [Fibers et Concurrence](./13-fibers-concurrence.md) pour les détails sur la concurrence.
