---
sidebar_position: 4
---

# Exercice 6 — Erreurs vs Défauts

## Deux catégories d'échecs

Effect distingue deux types d'échecs fondamentalement différents :

### Les Erreurs (Failures)
Ce sont des **échecs attendus et récupérables**. Ils font partie du flux normal de votre programme.

Exemples : article non trouvé, validation incorrecte, utilisateur non autorisé.

Elles apparaissent dans le **type** : `Effect<A, MonErreur>`.

### Les Défauts (Defects)
Ce sont des **bugs inattendus et non récupérables**. Ils ne devraient pas se produire en fonctionnement normal.

Exemples : `TypeError: Cannot read property 'x' of null`, `RangeError: Maximum call stack size exceeded`.

Ils sont **invisibles dans le type**, mais peuvent interrompre le programme.

## `Effect.promise` vs `Effect.tryPromise`

C'est là que la distinction devient concrète.

### `Effect.tryPromise` — transforme les exceptions en erreurs

```typescript
import { Effect, Data } from "effect";

class ErreurRéseau extends Data.TaggedError("ErreurRéseau")<{
  message: string;
}> {}

const fetchSûr = (): Effect.Effect<Response, ErreurRéseau> =>
  Effect.tryPromise({
    try: () => fetch("http://localhost:3000/items"),
    catch: (e) => new ErreurRéseau({ message: String(e) }),
  });

// Type : Effect<Response, ErreurRéseau>
// Les rejections de la Promise → ErreurRéseau (erreur typée, récupérable)
```

### `Effect.promise` — toutes les exceptions deviennent des défauts

```typescript
const fetchSansGestion = (): Effect.Effect<Response> =>
  Effect.promise(() => fetch("http://localhost:3000/items"));

// Type : Effect<Response>
// Les rejections de la Promise → Défaut (non typé, non récupérable avec catchTag)
```

:::danger Quand utiliser `Effect.promise` ?
Utilisez `Effect.promise` **uniquement** pour des opérations que vous savez ne jamais pouvoir rejeter, ou quand vous voulez traiter tous les échecs comme des bugs (défauts).

Dans le doute, préférez `Effect.tryPromise` avec une gestion explicite des erreurs.
:::

## Visualisation

```
Effect.tryPromise({ try: ..., catch: ... })
    Promise résolue → ✅ Rail Succès
    Promise rejetée → ❌ Rail Erreur (typée, catchTag fonctionne)

Effect.promise(...)
    Promise résolue → ✅ Rail Succès
    Promise rejetée → 💥 Défaut (non typé, sort des rails)
```

## Récupérer des défauts

Les défauts ne se gèrent pas avec `catchTag` (ils ne sont pas dans le type). Pour les capturer quand même, Effect fournit des outils spéciaux :

```typescript
import { Effect, Cause } from "effect";

const sûr = fetchSansGestion().pipe(
  // Convertit les défauts en erreurs récupérables
  Effect.catchAllDefect((défaut) => {
    console.error("Défaut inattendu :", défaut);
    return Effect.succeed(new Response("[]"));
  })
);
```

:::info La règle pratique
- **Erreur** = quelque chose peut raisonnablement aller mal → `tryPromise` + `catchTag`
- **Défaut** = c'est un bug → laissez-le propager (ou loggez et relancez)
:::

## Exemple complet

```typescript
import { Effect, Data } from "effect";

class NonAutorisé extends Data.TaggedError("NonAutorisé")<{}> {}
class NonTrouvé extends Data.TaggedError("NonTrouvé")<{ id: string }> {}

// Erreurs connues → tryPromise avec catch précis
const getUser = (id: string): Effect.Effect<User, NonAutorisé | NonTrouvé> =>
  Effect.tryPromise({
    try: async () => {
      const res = await fetch(`/api/users/${id}`);
      if (res.status === 401) throw { type: "unauthorized" };
      if (res.status === 404) throw { type: "not_found" };
      if (!res.ok) throw new Error(`Unexpected: ${res.status}`);
      return res.json() as Promise<User>;
    },
    catch: (e: unknown) => {
      if (typeof e === "object" && e !== null) {
        if ("type" in e && e.type === "unauthorized") return new NonAutorisé();
        if ("type" in e && e.type === "not_found") return new NonTrouvé({ id });
      }
      // Les cas inattendus restent des erreurs typées
      return new NonAutorisé();
    },
  });
```

## Exercice

Comparez les deux approches sur un cas concret.

**Objectif :**
1. Implémentez `fetchAvecErreur` avec `Effect.tryPromise` qui transforme les erreurs HTTP en `ErreurHTTP`.
2. Implémentez `fetchAvecDéfaut` avec `Effect.promise` pour la même URL.
3. Observez la différence de type dans votre éditeur.
4. Essayez d'appeler `Effect.catchTag` sur les deux — lequel compile ? Pourquoi ?

:::tip Ressources

- [Erreurs et Défauts](../../base-de-connaissance/02-erreurs-et-defauts.md)

:::

## Indice 1

<details>
  <summary>Les signatures attendues</summary>

```typescript
// Avec tryPromise — erreur visible dans le type
const fetchAvecErreur = (): Effect.Effect<unknown, ErreurHTTP> =>
  Effect.tryPromise({ ... })

// Avec promise — pas d'erreur dans le type
const fetchAvecDéfaut = (): Effect.Effect<unknown> =>
  Effect.promise(() => ...)
```

</details>

## Indice 2

<details>
  <summary>Pourquoi catchTag ne compile pas sur fetchAvecDéfaut ?</summary>

`Effect.catchTag("ErreurHTTP", ...)` cherche `"ErreurHTTP"` dans le type d'erreur `E` de `Effect<A, E, R>`.

Si `E = never` (pas d'erreur typée), TypeScript refuse de compiler car il n'y a rien à attraper.

C'est une protection du compilateur : vous ne pouvez pas récupérer ce que vous n'avez pas déclaré.

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Data } from "effect";

class ErreurHTTP extends Data.TaggedError("ErreurHTTP")<{
  status: number;
  message: string;
}> {}

// Avec tryPromise — les erreurs sont typées
const fetchAvecErreur = (): Effect.Effect<unknown, ErreurHTTP> =>
  Effect.tryPromise({
    try: async () => {
      const res = await fetch("http://localhost:3000/items");
      if (!res.ok) throw { status: res.status, message: res.statusText };
      return res.json();
    },
    catch: (e: unknown) => {
      if (typeof e === "object" && e !== null && "status" in e) {
        return new ErreurHTTP({
          status: e.status as number,
          message: String((e as any).message),
        });
      }
      return new ErreurHTTP({ status: 0, message: String(e) });
    },
  });

// catchTag fonctionne ✅
const sûr = fetchAvecErreur().pipe(
  Effect.catchTag("ErreurHTTP", (e) => {
    console.error(`HTTP ${e.status}: ${e.message}`);
    return Effect.succeed([]);
  })
);

// Avec promise — les erreurs deviennent des défauts
const fetchAvecDéfaut = (): Effect.Effect<unknown> =>
  Effect.promise(() => fetch("http://localhost:3000/items").then((r) => r.json()));

// ❌ Ne compile pas :
// fetchAvecDéfaut().pipe(Effect.catchTag("ErreurHTTP", ...))
// Argument of type '"ErreurHTTP"' is not assignable to parameter of type 'never'
```

</details>
