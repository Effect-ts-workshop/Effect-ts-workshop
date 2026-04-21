---
sidebar_position: 2
---

# Exercice 2 — Erreurs

Dans l'exercice précédent, toutes nos fonctions réussissaient. Dans la réalité, une requête réseau peut échouer, une valeur peut être invalide, un service peut être indisponible.

En TypeScript classique, les erreurs sont des exceptions : invisibles dans les types, propagées via `throw`, rattrapées avec `try/catch`. Effect propose une autre approche : les erreurs font partie du type, elles sont _explicites_.

Fichier à compléter : `packages/api/_exercices/2-errors.spec.ts`

---

## Modéliser un échec explicite

Quand `Effect.succeed` crée un Effect qui réussit, `Effect.fail` crée un Effect qui échoue :

<!-- prettier-ignore -->
```typescript
// Succès
const ok: Effect.Effect<number> = Effect.succeed(42);

// Échec explicite
const failure: Effect.Effect<never, Error> = Effect.fail(
  new Error("something went wrong"),
);
```

Le deuxième paramètre de type — `Error` — est visible dans la signature. L'appelant _sait_ que ça peut rater.

### Exercice

Complétez `squareRoot` pour qu'elle échoue explicitement quand `n < 0` :

<!-- prettier-ignore -->
```typescript
function squareRoot(n: number): Effect.Effect<number, Error> {
  if (n < 0) {
    return ??? // À compléter
  }
  return Effect.succeed(Math.sqrt(n))
}
```

À vous de jouer !

:::tip Ressources

- [Le type Effect](../base-de-connaissance/01-le-type-effect.md)

:::

#### Indice 1

<details>
  <summary>Le pendant de `Effect.succeed`</summary>

Comme `Effect.succeed` emballe une valeur de succès, `Effect.fail` emballe une valeur d'erreur.

<!-- prettier-ignore -->
```typescript
Effect.fail(new Error("message"));
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
function squareRoot(n: number): Effect.Effect<number, Error> {
  if (n < 0) {
    return Effect.fail(new Error("toto"));
  }
  return Effect.succeed(Math.sqrt(n));
}
```

</details>

---

## Créer des erreurs identifiables

Les classes d'erreur classiques ont un problème : impossible de les distinguer par leur type à l'exécution si on n'a que `instanceof`. `Data.TaggedError` ajoute une propriété `_tag` qui sert d'identifiant :

<!-- prettier-ignore -->
```typescript
class ReadError extends Data.TaggedError("ReadError")<{ path: string }> {}
class InvalidFormatError extends Data.TaggedError("InvalidFormatError")<{
  message: string;
}> {}

const e = new ReadError({ path: "/data/users.csv" });
e._tag; // "ReadError" — identifiant garanti
```

Le paramètre générique `<{ ... }>` définit les données portées par l'erreur.

### Exercice

Définissez `NetworkError` et `HTTPResponseError` avec `Data.TaggedError` :

<!-- prettier-ignore -->
```typescript
class NetworkError extends ??? {} // _tag: "NetworkError", data: { error: unknown }
class HTTPResponseError extends ??? {} // _tag: "HTTPResponseError", data: { response: Response }
```

À vous de jouer !

:::tip Ressources

- [Erreurs et défauts](../base-de-connaissance/02-erreurs-et-defauts.md)

:::

#### Indice 1

<details>
  <summary>La syntaxe de `Data.TaggedError`</summary>

<!-- prettier-ignore -->
```typescript
class MyError extends Data.TaggedError("MyError")<{ field: string }> {}
```

Le premier argument est le `_tag`. Le générique est l'objet de données associé.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
class NetworkError extends Data.TaggedError("NetworkError")<{
  error: unknown;
}> {}
class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{
  response: Response;
}> {}
```

</details>

---

## Plusieurs types d'erreurs

Une même fonction peut échouer de plusieurs façons. Effect le modélise avec une union dans le type d'erreur :

<!-- prettier-ignore -->
```typescript
type ParseCSV = (
  path: string,
) => Effect.Effect<string[], ReadError | InvalidFormatError>;
```

`ReadError | InvalidFormatError` signifie : cette fonction peut échouer de ces deux façons précises — et rien d'autre. C'est un contrat.

`Effect.filterOrFail` permet de convertir un cas de succès partiel en échec :

<!-- prettier-ignore -->
```typescript
pipe(
  Effect.tryPromise({
    try: () => readFile(path),
    catch: (e) => new ReadError({ path: String(e) }),
  }),
  Effect.filterOrFail(
    (content) => content.startsWith("id,"), // condition de succès
    (content) => new InvalidFormatError({ message: content }), // sinon : échec
  ),
);
```

### Exercice

Complétez les deux `TODO` dans `catch` et dans `filterOrFail` :

<!-- prettier-ignore -->
```typescript
const fetch: Fetch = (input, init) =>
  pipe(
    Effect.tryPromise({
      try: () => baseFetch(input, init),
      catch: (error) => {
        return ??? // À compléter : transformer en NetworkError
      }
    }),
    Effect.filterOrFail(
      (response) => response.ok,
      (response) => {
        return ??? // À compléter : transformer en HTTPResponseError
      }
    )
  )
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Les deux erreurs attendent leurs arguments</summary>

`NetworkError` et `HTTPResponseError` sont des `Data.TaggedError`. Regardez le générique défini pour chacune : il indique le type de l'objet à passer à `new`.

- `catch` reçoit l'exception brute (une `unknown`) — elle correspond au champ `error` de `NetworkError`
- `filterOrFail` reçoit la response HTTP — elle correspond au champ `response` de `HTTPResponseError`

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const fetch: Fetch = (input, init) =>
  pipe(
    Effect.tryPromise({
      try: () => baseFetch(input, init),
      catch: (error) => new NetworkError({ error }),
    }),
    Effect.filterOrFail(
      (response) => response.ok,
      (response) => new HTTPResponseError({ response }),
    ),
  );
```

</details>

---

## Attraper une erreur précise

`Effect.catchTag` intercepte une erreur par son `_tag` et permet de la gérer — sans toucher aux autres :

<!-- prettier-ignore -->
```typescript
pipe(
  parseCSV(), // Effect<string[], InvalidFormatError | ReadError>
  Effect.catchTag("InvalidFormatError", () => Effect.succeed([])),
  // Effect<string[], ReadError>  ← InvalidFormatError est "consommée", ReadError reste
);
```

Le type de l'erreur est mis à jour automatiquement : `InvalidFormatError` disparaît du type.

### Exercice

Rattrapez l'erreur `HTTPResponseError` et renvoyez `"Fallback joke"` :

<!-- prettier-ignore -->
```typescript
const program = pipe(
  getJoke(), // Effect<string, HTTPResponseError | NetworkError>
  ??? // À compléter
)
// Le type résultant doit être Effect<string, NetworkError>
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Signature de `catchTag`</summary>

<!-- prettier-ignore -->
```typescript
Effect.catchTag("TheTag", (error) => fallbackEffect);
```

Le handler reçoit l'erreur typée correspondant au tag.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const program = pipe(
  getJoke(),
  Effect.catchTag("HTTPResponseError", () => Effect.succeed("Fallback joke")),
);
```

</details>

---

## Gérer plusieurs erreurs en une fois

Quand on veut gérer plusieurs tags, `Effect.catchTags` évite d'enchaîner les `catchTag` :

<!-- prettier-ignore -->
```typescript
pipe(
  parseCSV(),
  Effect.catchTags({
    InvalidFormatError: () => Effect.succeed([]),
    ReadError: () => Effect.succeed([]),
  }),
);
```

Chaque clé est un tag, chaque valeur est le handler correspondant.

### Exercice

Gérez `HTTPResponseError` et `NetworkError` ensemble. Chaque tag a son propre message de fallback :

- `HTTPResponseError` → `"Fallback joke from HTTPResponseError"`
- `NetworkError` → `"Fallback joke from NetworkError"`

<!-- prettier-ignore -->
```typescript
const program = pipe(
  getJoke(), // Effect<string, UnknownException | HTTPResponseError | NetworkError>
  ??? // À compléter — résultat attendu : Effect<string, UnknownException>
)
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const program = pipe(
  getJoke(),
  Effect.catchTags({
    HTTPResponseError: () => Effect.succeed("Fallback joke from HTTPResponseError"),
    NetworkError: () => Effect.succeed("Fallback joke from NetworkError"),
  }),
);
```

</details>

---

## Rattraper toutes les erreurs

Quand on veut éliminer _toutes_ les erreurs typées d'un Effect, `Effect.catchAll` est le bon outil :

<!-- prettier-ignore -->
```typescript
pipe(
  parseCSV(),
  Effect.catchAll(() => Effect.succeed([])),
  // Effect<string[], never> ← plus d'erreur possible
);
```

`never` signifie que le programme ne peut plus échouer.

### Exercice

Rattrapez toutes les erreurs de `getJoke()` et renvoyez `"Fallback joke"` :

<!-- prettier-ignore -->
```typescript
const program = pipe(
  getJoke(), // Effect<string, UnknownException | HTTPResponseError | NetworkError>
  ??? // À compléter — résultat : Effect<string, never>
)
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const program = pipe(
  getJoke(),
  Effect.catchAll(() => Effect.succeed("Fallback joke")),
);
```

</details>

---

## Se remettre d'une erreur inattendue

Il existe deux catégories d'échecs dans Effect :

|            | Type                           | Exemple                             | Rattrapable avec        |
| ---------- | ------------------------------ | ----------------------------------- | ----------------------- |
| **Erreur** | Dans le type `Effect<_, E, _>` | `NetworkError`, `HTTPResponseError` | `catchTag`, `catchAll`… |
| **Defect** | Hors du type (imprévu)         | `throw`, bug, `dieMessage`          | `catchAllDefect`        |

Un `defect` est une erreur qu'on n'avait pas prévue — l'équivalent d'une exception non gérée. Si vous venez de Rust, c'est l'analogue d'un `panic!` : quelque chose d'inattendu s'est produit, le programme ne sait pas comment continuer. En Java, ce serait une `RuntimeException` non déclarée.

La différence avec Effect : `catchAllDefect` permet de s'en remettre proprement plutôt que de crasher :

<!-- prettier-ignore -->
```typescript
pipe(
  compute(), // lève un defect avec Effect.dieMessage
  Effect.catchAllDefect(() => Effect.succeed("recovered")),
);
```

### Exercice

Rattrapez le defect levé par `trustMe()` et renvoyez `"I'm alive"` :

<!-- prettier-ignore -->
```typescript
const program = pipe(
  trustMe(),
  ??? // À compléter
)
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const program = pipe(
  trustMe(),
  Effect.catchAllDefect(() => Effect.succeed("I'm alive")),
);
```

</details>
