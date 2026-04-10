---
sidebar_position: 2
---

# Exercice 2 — Erreurs

Dans l'exercice précédent, toutes nos fonctions réussissaient. Dans la réalité, une requête réseau peut échouer, une valeur peut être invalide, un service peut être indisponible.

En TypeScript classique, les erreurs sont des exceptions : invisibles dans les types, propagées via `throw`, rattrapées avec `try/catch`. Effect propose une autre approche : les erreurs font partie du type, elles sont _explicites_.

Fichier à compléter : `packages/api/_exercices/2-errors.spec.ts`

---

## `Effect.fail` — l'échec explicite

Quand `Effect.succeed` crée un Effect qui réussit, `Effect.fail` crée un Effect qui échoue :

```typescript
// Succès
const ok: Effect.Effect<number> = Effect.succeed(42)

// Échec explicite
const ko: Effect.Effect<never, Error> = Effect.fail(new Error("quelque chose a mal tourné"))
```

Le deuxième paramètre de type — `Error` — est visible dans la signature. L'appelant _sait_ que ça peut rater.

### Exercice

Complétez `racineCarrée` pour qu'elle échoue explicitement quand `n < 0` :

```typescript
function racineCarrée(n: number): Effect.Effect<number, Error> {
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

```typescript
Effect.fail(new Error("message"))
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
function racineCarrée(n: number): Effect.Effect<number, Error> {
  if (n < 0) {
    return Effect.fail(new Error("toto"))
  }
  return Effect.succeed(Math.sqrt(n))
}
```

</details>

---

## Plusieurs types d'erreurs

Une même fonction peut échouer de plusieurs façons. Effect le modélise avec une union dans le type d'erreur :

```typescript
type Fetch = (...args: Parameters<typeof baseFetch>) =>
  Effect.Effect<Response, NetworkError | HTTPResponseError>
```

`NetworkError | HTTPResponseError` signifie : cette fonction peut échouer de ces deux façons précises — et rien d'autre. C'est un contrat.

`Effect.filterOrFail` permet de convertir un cas de succès partiel en échec :

```typescript
pipe(
  Effect.tryPromise({ try: () => fetch(url), catch: (e) => new NetworkError(String(e)) }),
  Effect.filterOrFail(
    (response) => response.ok,           // condition de succès
    (response) => new HTTPResponseError(response.statusText) // sinon : échec
  )
)
```

### Exercice

Complétez les deux `TODO` dans `catch` et dans `filterOrFail` :

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

`NetworkError` et `HTTPResponseError` sont des classes. Elles s'instancient avec `new`.

- `catch` reçoit l'exception brute (une `unknown`) → à passer à `NetworkError`
- `filterOrFail` reçoit la response HTTP → à passer à `HTTPResponseError`

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const fetch: Fetch = (input, init) =>
  pipe(
    Effect.tryPromise({
      try: () => baseFetch(input, init),
      catch: (error) => new NetworkError(String(error))
    }),
    Effect.filterOrFail(
      (response) => response.ok,
      (response) => new HTTPResponseError(response.statusText)
    )
  )
```

</details>

---

## `Data.TaggedError` — des erreurs identifiables

Les classes d'erreur classiques ont un problème : impossible de les distinguer par leur type à l'exécution si on n'a que `instanceof`. `Data.TaggedError` ajoute une propriété `_tag` qui sert d'identifiant :

```typescript
class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}
class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}

const e = new NetworkError({ error: "timeout" })
e._tag // "NetworkError" — identifiant garanti
```

Le paramètre générique `<{ ... }>` définit les données portées par l'erreur.

### Exercice

Définissez `NetworkError` et `HTTPResponseError` avec `Data.TaggedError` :

```typescript
const NetworkError = ??? // _tag: "NetworkError", data: { error: unknown }
const HTTPResponseError = ??? // _tag: "HTTPResponseError", data: { response: Response }
```

À vous de jouer !

:::tip Ressources

- [Erreurs et défauts](../base-de-connaissance/02-erreurs-et-defauts.md)

:::

#### Indice 1

<details>
  <summary>La syntaxe de `Data.TaggedError`</summary>

```typescript
class MonErreur extends Data.TaggedError("MonErreur")<{ champ: string }> {}
```

Le premier argument est le `_tag`. Le générique est l'objet de données associé.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
class NetworkError extends Data.TaggedError("NetworkError")<{ error: unknown }> {}
class HTTPResponseError extends Data.TaggedError("HTTPResponseError")<{ response: Response }> {}
```

</details>

---

## `Effect.catchTag` — attraper une erreur précise

`Effect.catchTag` intercepte une erreur par son `_tag` et permet de la gérer — sans toucher aux autres :

```typescript
pipe(
  getJoke(), // Effect<string, HTTPResponseError | NetworkError>
  Effect.catchTag("HTTPResponseError", () => Effect.succeed("Blague de secours"))
  // Effect<string, NetworkError>  ← HTTPResponseError est "consommée", NetworkError reste
)
```

Le type de l'erreur est mis à jour automatiquement : `HTTPResponseError` disparaît du type.

### Exercice

Rattrapez l'erreur `"HTTPResponseError"` et renvoyez `"Fallback joke"` :

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

```typescript
Effect.catchTag("LeTag", (erreur) => EffectDeRemplacement)
```

Le handler reçoit l'erreur typée correspondant au tag.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const program = pipe(
  getJoke(),
  Effect.catchTag("HTTPResponseError", () => Effect.succeed("Fallback joke"))
)
```

</details>

---

## `Effect.catchTags` — attraper plusieurs erreurs d'un coup

Quand on veut gérer plusieurs tags, `Effect.catchTags` évite d'enchaîner les `catchTag` :

```typescript
pipe(
  getJoke(),
  Effect.catchTags({
    HTTPResponseError: () => Effect.succeed("Blague de secours"),
    NetworkError: () => Effect.succeed("Blague de secours")
  })
)
```

Chaque clé est un tag, chaque valeur est le handler correspondant.

### Exercice

Gérez `HTTPResponseError` et `NetworkError` ensemble, en renvoyant `"Fallback joke"` dans les deux cas :

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

```typescript
const program = pipe(
  getJoke(),
  Effect.catchTags({
    HTTPResponseError: () => Effect.succeed("Fallback joke"),
    NetworkError: () => Effect.succeed("Fallback joke")
  })
)
```

</details>

---

## `Effect.catchAll` — tout rattraper

Quand on veut éliminer _toutes_ les erreurs typées d'un Effect, `Effect.catchAll` est le bon outil :

```typescript
pipe(
  getJoke(),
  Effect.catchAll(() => Effect.succeed("Blague de secours"))
  // Effect<string, never> ← plus d'erreur possible
)
```

`never` signifie que le programme ne peut plus échouer.

### Exercice

Rattrapez toutes les erreurs de `getJoke()` et renvoyez `"Fallback joke"` :

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

```typescript
const program = pipe(
  getJoke(),
  Effect.catchAll(() => Effect.succeed("Fallback joke"))
)
```

</details>

---

## `Effect.catchAllDefect` — les erreurs inattendues

Il existe deux catégories d'échecs dans Effect :

| | Type | Exemple | Rattrapable avec |
|---|---|---|---|
| **Erreur** | Dans le type `Effect<_, E, _>` | `NetworkError`, `HTTPResponseError` | `catchTag`, `catchAll`… |
| **Défaut** | Hors du type (imprévu) | `throw`, bug, `dieMessage` | `catchAllDefect` |

Un défaut (`defect`) est une erreur qu'on n'avait pas prévue — l'équivalent d'une exception non gérée. `Effect.catchAllDefect` permet de s'en remettre proprement :

```typescript
pipe(
  trustMe(), // lève un défaut avec Effect.dieMessage
  Effect.catchAllDefect(() => Effect.succeed("Je suis en vie"))
)
```

### Exercice

Rattrapez le défaut levé par `trustMe()` et renvoyez `"I'm alive"` :

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

```typescript
const program = pipe(
  trustMe(),
  Effect.catchAllDefect(() => Effect.succeed("I'm alive"))
)
```

</details>
