---
sidebar_position: 10
---

# Schema — Validation, Codec et Tests

## Qu'est-ce qu'un Schema ?

Un `Schema` dans Effect est une description de la forme d'une donnée. Il remplace à la fois :

- **Zod** — validation de données inconnues
- **class-transformer** — sérialisation/désérialisation
- **Test data builder** — génération de données pour les tests (cf _property-based testing_)

La différence clé : un seul Schema fait les trois.

:::tip Vous pouvez utiliser Schema en dehors d'Effect

Effect Schema n'a **aucune dépendance avec le runtime Effect** (fibers, scheduler, etc.).

Vous pouvez adopter Effect Schema puis migrer progressivement vers Effect si le besoin s'en fait sentir. Les schemas restent valides dans les deux contextes.
:::

## Validation

`Schema.decodeUnknownSync` valide une valeur de type `unknown`. Les champs inconnus sont **filtrés automatiquement** :

<!-- prettier-ignore -->
```typescript
import { Schema } from "effect";

const UserSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
});

const user = Schema.decodeUnknownSync(UserSchema)({
  name: "Alice",
  age: 30,
  role: "admin" // champ inconnu → retiré
});
// → { name: "Alice", age: 30 }
```

### Choisir le mode d'exécution

| Fonction              | Comportement en erreur             |
| --------------------- | ---------------------------------- |
| `decodeUnknownSync`   | lève une exception                 |
| `decodeUnknownEither` | retourne `Either.Left(ParseError)` |
| `decodeUnknown`       | retourne un `Effect`               |

Utilisez `Either` ou `Effect` pour traiter les erreurs proprement dans votre code.

### Messages d'erreur

<!-- prettier-ignore -->
```typescript
const result = Schema.decodeUnknownEither(UserSchema, { errors: "all" })({})
// → Either.Left avec :
// { readonly name: string; readonly age: number }
// ├─ ["name"]
// │  └─ is missing
// └─ ["age"]
//    └─ is missing
```

`{ errors: "all" }` reporte **toutes** les erreurs en une seule fois.

Pour un traitement programmatique (formulaires), `ParseResult.ArrayFormatter` produit un tableau à partir du message d'erreur :

<!-- prettier-ignore -->
```typescript
import { Either, ParseResult, Schema } from "effect";

const errors = Either.isLeft(result)
  ? ParseResult.ArrayFormatter.formatErrorSync(result.left)
  : [];

// errors[0] → { path: ["name", "age"], message: "is missing" }
```

## Codec : Encode / Decode

Nous utilisons le mot Codec pour regrouper les deux opérations inverses (1) encode (transformer une valeur typée vers une représentation externe, ex: JSON) et (2) decode (parser/valider une donnée brute vers un type sûr), garantissant ainsi une cohérence bidirectionnelle.

Certains types ont une forme **sérialisée** (JSON) différente de leur forme **TypeScript**. `Schema.Date` en est l'exemple canonique :

```
Date TypeScript  ←→  string ISO (JSON)
new Date("2026-04-22")  ←→  "2026-04-22T00:00:00.000Z"
```

<!-- prettier-ignore -->
```typescript
import { Schema } from "effect";

const DataSchema = Schema.Struct({ createdAt: Schema.Date });

// Encode : TypeScript → JSON
const dto = Schema.encodeSync(DataSchema)({ createdAt: new Date("2026-04-22") });
// → { createdAt: "2026-04-22T00:00:00.000Z" }

// Decode : JSON → TypeScript
const data = Schema.decodeSync(DataSchema)(dto);
// → { createdAt: Date }
```

Le voyage aller-retour `encode → decode` produit une valeur identique à l'originale.

:::info `Schema.Option` en JSON
`Option.some(42)` s'encode en `{ _tag: "Some", value: 42 }` et `Option.none()` en `{ _tag: "None" }`. `HttpApiClient` gère cette conversion automatiquement quand le contrat déclare `Schema.Option(...)`.
:::

## Génération de données : property-based testing

`Arbitrary.make` génère un arbitraire `fast-check` à partir d'un Schema. Chaque valeur générée respecte les contraintes du Schema :

<!-- prettier-ignore -->
```typescript
import { Arbitrary, Schema } from "effect";
import fc from "fast-check";

const GuestSchema = Schema.Struct({
  name: Schema.String,
});

const EventSchema = Schema.Struct({
  date: Schema.Date,
  guests: Schema.Array(GuestSchema)
});

const arbitrary = Arbitrary.make(EventSchema)

fc.assert(
  fc.property(arbitrary, (event) => {
    // event est garanti par génération comme valide selon EventSchema — 
    const dto = pipe(event, Schema.encodeSync(EventSchema))
    const back = pipe(dto, Schema.decodeSync(EventSchema))
    expect(event).toEqual(back)
  })
)
```

:::tip Pourquoi c'est puissant ?
Au lieu de tester 3 cas manuels, on vérifie qu'une **propriété tient pour des milliers de valeurs valides**. Les bugs de cas limites sont découverts automatiquement.
:::

## Schemas personnalisés avec Brand

`Brand` crée des types nominaux — des types TypeScript **incompatibles** avec leur type de base, même s'ils ont la même structure :

<!-- prettier-ignore -->
```typescript
import { Brand, Schema, pipe } from "effect";

// Définir le brand
type Port = number & Brand.Brand<"Port">
const Port = Brand.nominal<Port>()

const PortSchema = pipe(
  Schema.Int,                      // entier uniquement
  Schema.between(1, 65535),        // plage valide
  Schema.fromBrand(Port)           // retourne un type Port (opaque)
)

const port = Schema.decodeUnknownSync(PortSchema)(80);
// port est de type Port (pas juste number)
// Impossible de passer une nombre qui ne soit pas un n° de port valide
```

Cela empêche de mélanger accidentellement un `number` quelconque avec un `Port` validé.

## Annotations

Les annotations enrichissent un Schema sans changer son comportement de validation :

<!-- prettier-ignore -->
```typescript
const NameSchema = Schema.NonEmptyString.annotations({
  identifier: "Name",                // Nom dans les messages d'erreur
  description: "Prénom de l'utilisateur",
  message: () => "Le prénom ne peut pas être vide"
});
```

Avec `identifier`, le message d'erreur affiche `Expected Name, actual null` au lieu du type technique.

## Compatibilité Standard Schema

Effect Schema implémente la spécification [Standard Schema v1](https://standardschema.dev) — un standard communautaire d'interopérabilité entre bibliothèques de schemas TypeScript.

Concrètement : tout outil compatible Standard Schema (tRPC v11+, TanStack Form, Hono, Valibot…) accepte directement un Schema Effect **sans adaptateur** :

<!-- prettier-ignore -->
```typescript
import { Schema } from "effect";
import { initTRPC } from "@trpc/server";

const UserSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  email: Schema.String.pipe(Schema.pattern(/@/))
});

// tRPC v11 accepte directement le Schema Effect
const t = initTRPC.create();
const router = t.router({
  createUser: t.procedure
    .input(UserSchema) // ← pas de conversion nécessaire
    .mutation(({ input }) => createUser(input))
});
```

L'interface Standard Schema est exposée via la propriété `~standard` sur chaque schema — les outils compatibles l'utilisent automatiquement.

:::tip Pourquoi c'est important ?
Vous pouvez définir vos schemas Effect une seule fois dans `packages/shared` et les réutiliser à la fois dans le serveur Effect, le client React (TanStack Form, React Hook Form…), et les routes tRPC — sans duplication ni conversion.
:::

## Récapitulatif

| Besoin                                  | Fonction / Mécanisme                             |
| --------------------------------------- | ------------------------------------------------ |
| Valider une valeur inconnue             | `Schema.decodeUnknownSync` / `Either` / `Effect` |
| Sérialiser pour l'API                   | `Schema.encodeSync`                              |
| Désérialiser depuis l'API               | `Schema.decodeSync`                              |
| Générer des données de test             | `Arbitrary.make` + `fc.assert`                   |
| Type nominal validé                     | `Brand` + `Schema.fromBrand`                     |
| Personnaliser les erreurs               | `.annotations({ identifier, message })`          |
| Utiliser sans runtime Effect            | Variantes `Sync` / `Either` — aucune dépendance  |
| Interop avec tRPC, TanStack Form, Hono… | Standard Schema v1 via propriété `~standard`     |
