---
sidebar_position: 3
---

# Exercice 12 — Effect.fn : fonctions avec traçage

## Le problème du débogage en production

Vous avez un bug en production. Le programme plante, mais comment savoir **quelle fonction** est en cause ? Dans une stack trace, vous voyez :

```
Error: DivisionParZéro
  at anonymous (bundle.js:1:2847)
  at anonymous (bundle.js:1:3291)
  at anonymous (bundle.js:1:4102)
```

Pas très utile. Le code minifié masque les noms des fonctions.

## `Effect.fn` — fonctions nommées avec traçage automatique

`Effect.fn` est un wrapper autour d'`Effect.gen` qui :
1. **Nomme** la fonction pour qu'elle apparaisse dans les traces
2. **Ajoute automatiquement un span de traçage** (OpenTelemetry)

Comparez :

```typescript
// Avec Effect.gen classique
const processItem = (id: string) =>
  Effect.gen(function* () {
    // ...
  });

// Avec Effect.fn — même fonctionnalité + traçage !
const processItem = Effect.fn("processItem")(function* (id: string) {
  // ...
});
```

La seule différence : le nom `"processItem"` et la syntaxe légèrement différente.

## Syntaxe de `Effect.fn`

```typescript
import { Effect } from "effect";

const maFonction = Effect.fn("maFonction")(function* (
  arg1: string,
  arg2: number
) {
  // Exactement comme Effect.gen — yield*, gestion d'erreurs, contexte...
  const résultat = yield* autreEffect(arg1);
  return résultat + arg2;
});

// Type : (arg1: string, arg2: number) => Effect<number, ...>
```

Le premier appel `Effect.fn("maFonction")` prend le nom de la trace.
Le deuxième appel prend la fonction générateur avec les arguments.

## Dans l'application finale

Dans `packages/api/http.ts`, **tous les handlers HTTP** utilisent `Effect.fn` :

```typescript
// packages/api/http.ts (simplifié)
const addItem = Effect.fn("addItem")(function* (req) {
  const repo = yield* ItemRepositoryDrizzle;
  return yield* repo.add(req.payload);
});

const getAllItems = Effect.fn("getAllItems")(function* () {
  const repo = yield* ItemRepositoryDrizzle;
  return yield* repo.getAll();
});

const getItemById = Effect.fn("getItemById")(function* (req) {
  const repo = yield* ItemRepositoryDrizzle;
  return yield* repo.findById(req.pathParams.itemId);
});
```

Chaque handler :
- A un **nom** dans les traces (Signoz à http://localhost:9999)
- Reçoit des **arguments typés**
- Utilise `yield*` pour accéder aux services et chaîner les Effects
- Propage les erreurs automatiquement

## Traçage distribué

Avec `Effect.fn`, chaque appel de fonction crée un **span** dans la trace distribuée. Vous pouvez voir dans Signoz :

```
→ HTTP POST /items                    [50ms]
    → addItem                         [45ms]
        → ItemRepositoryDrizzle.add   [40ms]
            → SQL: INSERT INTO items  [35ms]
```

Toute la chaîne d'appels est visible, avec les durées.

:::tip Signoz dans l'atelier
Pour voir les traces, lancez :
```bash
docker-compose up -d
npm run dev
```
Puis accédez à http://localhost:9999 (admin@signoz.local / admin123).
:::

## Exercice

Réécrivez les fonctions de l'exercice précédent en utilisant `Effect.fn`.

**Objectif :**
1. Transformer `add` et `diviser` en fonctions `Effect.fn`.
2. Écrire un programme complet `calculer` avec `Effect.fn`.
3. Connecter au service `ItemService` de l'exercice 8 : écrire `getItemById` avec `Effect.fn`.

:::tip Ressources

- [Générateurs et Pipe](../../base-de-connaissance/07-generateurs.md)

:::

## Indice 1

<details>
  <summary>Transformer add en Effect.fn</summary>

```typescript
import { Effect } from "effect";

// Avant
const add = (a: number, b: number): Effect.Effect<number> =>
  Effect.succeed(a + b);

// Après
const add = Effect.fn("add")(function* (a: number, b: number) {
  return a + b;
});
```

Notez que dans `Effect.fn`, vous pouvez retourner une valeur directement (pas besoin de `Effect.succeed`). Effect s'en charge automatiquement.

</details>

## Indice 2

<details>
  <summary>Transformer diviser en Effect.fn</summary>

```typescript
import { Effect, Data } from "effect";

class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

const diviser = Effect.fn("diviser")(function* (a: number, b: number) {
  if (b === 0) return yield* Effect.fail(new DivisionParZéro());
  return a / b;
});
```

</details>

## Indice 3

<details>
  <summary>Utiliser un service avec Effect.fn</summary>

```typescript
import { Context } from "effect";

const ItemService = Context.GenericTag<ItemService>("ItemService");

const getItemById = Effect.fn("getItemById")(function* (id: string) {
  const service = yield* ItemService;
  const items = yield* service.getAll();
  return items.find((i) => i.id === id) ?? null;
});
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Effect, Data, Context, Layer, Option } from "effect";

// --- Types ---
type Item = { id: string; brand: string; model: string };

// --- Erreurs ---
class DivisionParZéro extends Data.TaggedError("DivisionParZéro")<{}> {}

// --- Fonctions avec Effect.fn ---
const add = Effect.fn("add")(function* (a: number, b: number) {
  return a + b;
});

const diviser = Effect.fn("diviser")(function* (a: number, b: number) {
  if (b === 0) return yield* Effect.fail(new DivisionParZéro());
  return a / b;
});

const calculer = Effect.fn("calculer")(function* (
  a: number,
  b: number,
  diviseur: number
) {
  const somme = yield* add(a, b);
  const résultat = yield* diviser(somme, diviseur).pipe(
    Effect.catchTag("DivisionParZéro", () => Effect.succeed(0))
  );
  yield* Effect.log(`calculer(${a}, ${b}, ${diviseur}) = ${résultat}`);
  return résultat;
});

Effect.runSync(calculer(3, 4, 2)); // [LOG] calculer(3, 4, 2) = 3.5

// --- Service ItemService avec Effect.fn ---
interface ItemService {
  getAll: () => Effect.Effect<Item[]>;
}
const ItemService = Context.GenericTag<ItemService>("ItemService");

const getItemById = Effect.fn("getItemById")(function* (id: string) {
  const service = yield* ItemService;
  const items = yield* service.getAll();
  const item = items.find((i) => i.id === id);
  return Option.fromNullable(item);
});

// Utilisation avec mock
const ItemServiceMock = Layer.succeed(ItemService, {
  getAll: () =>
    Effect.succeed([
      { id: "1", brand: "Nike", model: "Air Max" },
      { id: "2", brand: "Adidas", model: "Stan Smith" },
    ]),
});

const programme = Effect.gen(function* () {
  const item = yield* getItemById("1");
  yield* Effect.log(
    Option.match(item, {
      onNone: () => "Non trouvé",
      onSome: (i) => `${i.brand} - ${i.model}`,
    })
  );
});

Effect.runSync(programme.pipe(Effect.provide(ItemServiceMock)));
// [LOG] Nike - Air Max
```

</details>
