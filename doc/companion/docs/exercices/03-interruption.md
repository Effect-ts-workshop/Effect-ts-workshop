---
sidebar_position: 3
---

# Exercice 3 — Interruption et ressources

Jusqu'ici nos programmes se terminent toujours : ils réussissent ou ils échouent. Mais il existe un troisième cas : l'interruption. Un utilisateur annule une requête, un timeout expire, un autre fiber termine en premier.

Effect traite l'interruption comme un citoyen de première classe. Ce qui veut dire : quand un program est interrompu, les ressources qu'il a ouvertes sont quand même libérées.

Fichier à compléter : `packages/api/_exercices/3-interruption.spec.ts`

---

## Interruption et `AbortSignal`

Les APIs Web (`fetch`, `XMLHttpRequest`) utilisent `AbortSignal` pour signaler une annulation. Effect peut propager son mécanisme d'interruption vers ces APIs via le signal disponible dans `Effect.tryPromise`.

La `try` de `Effect.tryPromise` reçoit un `signal` en paramètre — il suffit de le passer à la `Promise` sous-jacente :

<!-- prettier-ignore -->
```typescript
Effect.tryPromise({
  try: (signal) => readLargeFile("/data/export.csv", { signal }),
  catch: (e) => new ReadError({ error: e })
})
```

Quand le fiber est interrompu (`Fiber.interrupt`), Effect annule le `signal` — la `Promise` reçoit l'événement `abort` et peut se nettoyer proprement.

### Exercice

Complétez le `try` pour passer le `signal` à `slowFetch` :

<!-- prettier-ignore -->
```typescript
const program = Effect.tryPromise({
  try: () => slowFetch("https://api.chucknorris.io/jokes/random"),
  catch: (error) => new NetworkError({ error })
})
```

À vous de jouer !

:::tip Ressources

- [Fibers et Concurrence](../base-de-connaissance/13-fibers-concurrence.md)
- [Scope et Ressources](../base-de-connaissance/08-scope-et-ressources.md)

:::

#### Indice 1

<details>
  <summary>D'où vient le signal ?</summary>

La fonction passée à `try` peut recevoir un argument optionnel — le signal d'annulation qu'Effect gère pour vous.

<!-- prettier-ignore -->
```typescript
try: (signal) => /* ... */
```

Effect crée ce signal et l'annule automatiquement si le fiber est interrompu.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const program = Effect.tryPromise({
  try: (signal) => slowFetch("https://api.chucknorris.io/jokes/random", { signal }),
  catch: (error) => new NetworkError({ error })
})
```

</details>

---

## `Effect.addFinalizer` — le nettoyage garanti

En JavaScript classique, si une exception surgit entre l'ouverture et la fermeture d'une ressource, la fermeture ne se produit jamais. `try/finally` est la réponse — mais ça ne couvre pas l'interruption.

`Effect.addFinalizer` enregistre une action qui sera exécutée **quoi qu'il arrive** : succès, échec, ou interruption.

<!-- prettier-ignore -->
```typescript
Effect.gen(function*() {
  const conn = makeConnection()

  // Ce finalizer sera appelé à la fin du scope, dans tous les cas
  yield* Effect.addFinalizer(() => Effect.sync(() => conn.close()))

  return yield* conn.query("SELECT 1")
})
```

Il faut envelopper ce programme dans `Effect.scoped` pour définir la portée du finalizer :

<!-- prettier-ignore -->
```typescript
Effect.runPromise(Effect.scoped(program))
```

### Exercice

Implémentez `Effect.addFinalizer` dans chacun des tests suivants :

- **Connexion base de données** (`it.skip`) : retirez le `.skip` pour activer le test, puis enregistrez la fermeture de la connexion comme finalizer.
- **Lock distribué** (deux tests) : dans `runJobIfAvailable` et dans `longJob`, libérez le lock via `releaseLock` dès que l'acquisition réussit.
- **Fichier temporaire** : supprimez le fichier temporaire à la fin du scope via `deleteTempFile`.

Dans chaque cas, la structure est la même :

<!-- prettier-ignore -->
```typescript
yield* Effect.addFinalizer(() => /* l'action de nettoyage */)
```

À vous de jouer !

:::tip Ressources

- [Scope et Ressources](../base-de-connaissance/08-scope-et-ressources.md)

:::

#### Indice 1

<details>
  <summary>Quel type doit renvoyer le finalizer ?</summary>

`Effect.addFinalizer` attend une fonction `() => Effect<void>`. Pour envelopper une opération synchrone, utilisez `Effect.sync` :

<!-- prettier-ignore -->
```typescript
yield* Effect.addFinalizer(() => Effect.sync(() => conn.close()))
```

Certains helpers comme `releaseLock` ou `deleteTempFile` renvoient déjà un `Effect` — pas besoin de les envelopper.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

**Connexion base de données**

<!-- prettier-ignore -->
```typescript
yield* Effect.addFinalizer(() => Effect.sync(() => connection.close()))
```

**Lock distribué** (même solution pour les deux tests)

<!-- prettier-ignore -->
```typescript
yield* Effect.addFinalizer(() => releaseLock("job:send-emails"))
```

**Fichier temporaire**

<!-- prettier-ignore -->
```typescript
yield* Effect.addFinalizer(() => deleteTempFile(path))
```

</details>

---

## `Effect.acquireRelease` — coupler ouverture et fermeture

Quand une ressource a un cycle de vie clair (ouvrir / utiliser / fermer), `Effect.acquireRelease` couple explicitement les deux opérations. C'est l'équivalent Effect de `await using` (TypeScript 5.2) : dans les deux cas, l'ouverture et la fermeture sont définies au même endroit.

<!-- prettier-ignore -->
```typescript
// await using — fermeture couplée à l'ouverture
await using conn = getConnection() // conn[Symbol.asyncDispose]() appelé à la sortie du bloc
```

La différence : `await using` ne couvre pas l'interruption. `Effect.acquireRelease` garantit le `release` dans les trois cas — succès, échec, et interruption.

<!-- prettier-ignore -->
```typescript
const resource = Effect.acquireRelease(
  Effect.sync(() => makeConnection(log)), // acquire : ouvre la connexion
  (conn) => Effect.sync(() => conn.close()) // release : toujours exécuté
)

const program = Effect.gen(function*() {
  const conn = yield* resource
  return yield* conn.query("SELECT 1")
})

Effect.runPromise(Effect.scoped(program))
```

La différence avec `addFinalizer` : le `release` est défini au même endroit que le `acquire` — le couplage est explicite et la ressource est plus facilement réutilisable.

### Exercice

**Tests `"exécute le release après un succès"` et `"exécute le release même si une erreur survient"`**

Définissez `resource` avec `Effect.acquireRelease`. Dans le second test, la `query` doit échouer avec `new Error("timeout")` — pensez à étendre `makeConnection` en remplaçant uniquement cette méthode.

<!-- prettier-ignore -->
```typescript
const resource = ??? // À compléter
```

---

**Test `"exécute le release si le fiber est interrompu"`**

La ressource est déjà fournie. Il reste à déclencher l'interruption du fiber :

<!-- prettier-ignore -->
```typescript
await Effect.runPromise(???) // À compléter
```

À vous de jouer !

:::tip Ressources

- [Scope et Ressources](../base-de-connaissance/08-scope-et-ressources.md)
- [Fibers et Concurrence](../base-de-connaissance/13-fibers-concurrence.md)

:::

#### Indice 1

<details>
  <summary>Structure de `acquireRelease`</summary>

<!-- prettier-ignore -->
```typescript
Effect.acquireRelease(
  Effect.sync(() => /* ouvrir la ressource */), // acquire
  (resource) => Effect.sync(() => /* fermer la ressource */) // release
)
```

</details>

#### Indice 2

<details>
  <summary>Comment surcharger `query` dans le test "erreur" ?</summary>

Étendez `makeConnection` avec un spread et remplacez uniquement `query` :

<!-- prettier-ignore -->
```typescript
Effect.sync(() => ({
  ...makeConnection(log),
  query: () => Effect.fail(new Error("timeout"))
}))
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

**Succès**

<!-- prettier-ignore -->
```typescript
const resource = Effect.acquireRelease(
  Effect.sync(() => makeConnection(log)),
  (conn) => Effect.sync(() => conn.close())
)
```

**Erreur**

<!-- prettier-ignore -->
```typescript
const resource = Effect.acquireRelease(
  Effect.sync(() => ({
    ...makeConnection(log),
    query: () => Effect.fail(new Error("timeout"))
  })),
  (conn) => Effect.sync(() => conn.close())
)
```

**Interruption**

<!-- prettier-ignore -->
```typescript
await Effect.runPromise(Fiber.interrupt(fiber))
```

</details>

---

:::tip À retenir

- `Effect.addFinalizer` → nettoyage en fin de scope, peu importe comment le programme se termine
- `Effect.acquireRelease` → couple `acquire` et `release`, pour les ressources avec un cycle de vie explicite
- `Effect.scoped` → délimite le scope dans lequel les finalizers s'exécutent
- Les trois garanties : succès, erreur, **et interruption**

:::
