---
sidebar_position: 8
---

# Scope et Ressources

## Le problème du cleanup

Quand un programme acquiert une ressource (connexion, fichier, lock…), il doit la libérer — même si une erreur survient. En TypeScript classique, on utilise `try/finally` :

<!-- prettier-ignore -->
```typescript
const conn = db.connect();
try {
  return await conn.query("SELECT 1");
} finally {
  conn.close(); // toujours exécuté
}
```

Ça fonctionne, mais ça ne se compose pas. Dès qu'on imbrique plusieurs ressources, le code devient difficile à lire — et si une Fiber est interrompue, `finally` n'est pas garanti.

Effect résout ça avec le **Scope**.

## Le Scope : un registre de cleanups

Un `Scope` est un conteneur qui enregistre des actions de nettoyage. À sa fermeture, **toutes les actions enregistrées s'exécutent**, dans l'ordre inverse, peu importe comment le programme s'est terminé.

```
Scope ouvert
  → cleanup A enregistré
  → cleanup B enregistré
  → programme en cours...
Scope fermé (succès / erreur / interruption)
  → cleanup B exécuté
  → cleanup A exécuté
```

## `Effect.addFinalizer` — enregistrer un cleanup

`Effect.addFinalizer` ajoute une action au Scope courant. Elle reçoit en option un `exit` qui décrit comment le programme s'est terminé.

<!-- prettier-ignore -->
```typescript
import { Effect, Exit } from "effect";

const program = Effect.gen(function* () {
  const conn = openConnection();

  yield* Effect.addFinalizer((exit) =>
    Effect.sync(() => {
      conn.close();
      if (Exit.isSuccess(exit)) console.log("terminé normalement");
      if (Exit.isFailure(exit)) console.log("terminé en erreur");
    })
  );

  return yield* conn.query("SELECT 1");
});
```

Le `exit` permet d'adapter le cleanup selon le résultat — typiquement : commit ou rollback d'une transaction.

## `Effect.acquireRelease` — paire explicite

Quand l'acquisition et le cleanup sont **logiquement liés**, `acquireRelease` est plus clair :

<!-- prettier-ignore -->
```typescript
import { Effect } from "effect";

const resource = Effect.acquireRelease(
  Effect.sync(() => openConnection()),     // acquire
  (conn) => Effect.sync(() => conn.close()) // release — toujours exécuté
);

const program = Effect.gen(function* () {
  const conn = yield* resource;
  return yield* conn.query("SELECT 1");
});
```

Le `release` est garanti dans **trois situations** :

- ✅ Succès normal
- ❌ Erreur (`Effect.fail`)
- ⚡ Interruption de la Fiber

## `Effect.scoped` — créer et fermer un Scope

`Effect.scoped` crée un Scope, exécute le programme, puis le ferme automatiquement :

<!-- prettier-ignore -->
```typescript
await Effect.runPromise(Effect.scoped(program));
// Le Scope est fermé ici — cleanups exécutés
```

Sans `Effect.scoped`, le Scope reste ouvert et doit être géré manuellement via `Scope.make` et `Scope.close`. En pratique, `Effect.scoped` couvre la grande majorité des cas.

## Cas d'usage typiques

### Connexion base de données

<!-- prettier-ignore -->
```typescript
const withConnection = Effect.acquireRelease(
  Effect.sync(() => db.connect()),
  (conn) => Effect.sync(() => conn.close())
);
```

### Lock distribué

<!-- prettier-ignore -->
```typescript
const withLock = (key: string) =>
  Effect.gen(function* () {
    yield* Effect.sync(() => redis.set(key, "locked"));
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => redis.del(key))
    );
  });
```

### Transaction SQL

<!-- prettier-ignore -->
```typescript
const withTransaction = Effect.acquireRelease(
  Effect.sync(() => db.beginTransaction()),
  (tx, exit) =>
    Exit.isSuccess(exit)
      ? Effect.sync(() => tx.commit())
      : Effect.sync(() => tx.rollback())
);
```

## Différence entre `addFinalizer` et `acquireRelease`

|                | `addFinalizer`                             | `acquireRelease`                                  |
| -------------- | ------------------------------------------ | ------------------------------------------------- |
| Style          | dans un `gen`, ad-hoc                      | paire acquire/release explicite                   |
| Lisibilité     | proche de `try/finally`                    | modélise une ressource                            |
| Accès à `exit` | oui                                        | oui                                               |
| Utiliser quand | cleanup conditionnel en cours de programme | ressource avec un cycle ouverture/fermeture clair |
