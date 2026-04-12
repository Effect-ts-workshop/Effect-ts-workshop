---
sidebar_position: 10
---

# Schema — Validation, Codec et Tests

## Qu'est-ce qu'un Schema ?

Un `Schema` dans Effect est une description de la forme d'une donnée. Il remplace à la fois :

- **Zod** — validation de données inconnues
- **class-transformer** — sérialisation/désérialisation
- **fast-check** — génération de données pour les tests

La différence clé : un seul Schema fait les trois.

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

Pour un traitement programmatique (formulaires), `ParseResult.ArrayFormatter` produit un tableau :

<!-- prettier-ignore -->
```typescript
import { Either, ParseResult, Schema } from "effect";

const errors = Either.isLeft(result)
  ? ParseResult.ArrayFormatter.formatErrorSync(result.left)
  : [];

// errors[0] → { path: ["name"], message: "is missing" }
```

## Codec : Encode / Decode

Nous utilisons le mot Codec pour regrouper les deux opérations inverses encode (transformer une valeur typée vers une représentation externe, ex: JSON) et decode (parser/valider une donnée brute vers un type sûr), garantissant ainsi une cohérence bidirectionnelle.

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

const PersonSchema = Schema.Struct({
  name: Schema.NonEmptyTrimmedString,
  age: Schema.Number.pipe(Schema.between(0, 120))
});

const arbitrary = Arbitrary.make(PersonSchema);

fc.assert(
  fc.property(arbitrary, (person) => {
    // Cette propriété doit tenir pour toutes les valeurs générées
    const dto = Schema.encodeSync(PersonSchema)(person);
    const decoded = Schema.decodeSync(PersonSchema)(dto);
    expect(person).toEqual(decoded);
  })
);
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
type Email = string & Brand.Brand<"email">;
const Email = Brand.nominal<Email>();

// Construire le Schema
const EmailSchema = pipe(
  Schema.String,
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.fromBrand(Email)
);

const email = Schema.decodeUnknownSync(EmailSchema)("alice@example.com");
// email est de type Email (pas juste string)
// Impossible de passer une string ordinaire où Email est attendu
```

Cela empêche de mélanger accidentellement un `string` quelconque avec un `Email` validé.

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

## Récapitulatif

| Besoin                      | Fonction                                         |
| --------------------------- | ------------------------------------------------ |
| Valider une valeur inconnue | `Schema.decodeUnknownSync` / `Either` / `Effect` |
| Sérialiser pour l'API       | `Schema.encodeSync`                              |
| Désérialiser depuis l'API   | `Schema.decodeSync`                              |
| Générer des données de test | `Arbitrary.make` + `fc.assert`                   |
| Type nominal validé         | `Brand` + `Schema.fromBrand`                     |
| Personnaliser les erreurs   | `.annotations({ identifier, message })`          |
