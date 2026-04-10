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

```typescript
Effect.tryPromise({
  try: (signal) => fetch("https://api.example.com", { signal }),
  catch: (e) => new NetworkError({ error: e })
})
```

Quand le fiber est interrompu (`Fiber.interrupt`), Effect annule le `signal` — la `Promise` reçoit l'événement `abort` et peut se nettoyer proprement.

### Exercice

Complétez le `try` pour passer le `signal` à `slowFetch` :

```typescript
const program = Effect.tryPromise({
  try: () => slowFetch("https://api.chucknorris.io/jokes/random", { signal: ??? }),
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

La fonction passée à `try` peut recevoir un argument : le `signal` géré par Effect.

```typescript
try: (signal) => myFetch(url, { signal })
```

Effect crée ce signal et l'annule automatiquement si le fiber est interrompu.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

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

```typescript
Effect.gen(function*() {
  const conn = makeConnection()

  // Ce finalizer sera appelé à la fin du scope, dans tous les cas
  yield* Effect.addFinalizer(() => Effect.sync(() => conn.close()))

  return yield* conn.query("SELECT 1")
})
```

Il faut envelopper ce programme dans `Effect.scoped` pour définir la portée du finalizer :

```typescript
Effect.runPromise(Effect.scoped(program))
```

### Exemples à lire

Les tests suivants illustrent trois cas d'usage courants — ils sont déjà implémentés, lisez-les pour vous approprier le pattern :

**Connexion base de données** : le finalizer ferme la connexion même si la requête échoue.

**Lock distribué** : le lock est libéré dès que le program sort du scope — qu'il ait réussi ou pas. Un deuxième pod qui tente d'acquérir le même lock est proprement bloqué.

**Fichier temporaire** : le fichier `.tmp` est supprimé après traitement, même si le traitement échoue — pas de fichiers orphelins.

---

## `Effect.acquireRelease` — coupler ouverture et fermeture

Quand une ressource a un cycle de vie clair (ouvrir / utiliser / fermer), `Effect.acquireRelease` couple explicitement les deux opérations :

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

### Exemples à lire

Trois tests illustrent la garantie de `acquireRelease` :

**Succès** : la connexion est ouverte, la requête aboutit, la connexion est fermée.

**Échec** : la requête échoue (timeout), la connexion est fermée quand même — pas de connexion qui reste ouverte indéfiniment.

**Interruption** : le fiber est interrompu en cours de traitement, la connexion est fermée malgré tout.

Ces trois cas sont couverts _automatiquement_ par `Effect.scoped`. Vous n'avez rien à faire de spécial pour l'interruption.

---

:::tip À retenir

- `Effect.addFinalizer` → nettoyage en fin de scope, peu importe comment le programme se termine
- `Effect.acquireRelease` → couple `acquire` et `release`, pour les ressources avec un cycle de vie explicite
- `Effect.scoped` → délimite le scope dans lequel les finalizers s'exécutent
- Les trois garantis : succès, erreur, **et interruption**

:::
