---
sidebar_position: 1
---

# Exercice 7 — Schema

## Qu'est-ce qu'un Schema ?

Un **Schema** dans Effect est une description de la forme d'une donnée. Il sert à la fois de :

- **validateur** : vérifie qu'une valeur inconnue correspond au type attendu
- **codec** : transforme une représentation sérialisée (JSON, string…) en type TypeScript, et inversement
- **générateur de données arbitraires** : produit des exemples valides pour les tests property-based

Un seul Schema remplace à la fois Zod, class-transformer, et une librairie de property testing.

## Validation avec `decodeUnknownSync`

`Schema.decodeUnknownSync` prend une valeur de type `unknown` et la valide. Les champs inconnus sont **filtrés automatiquement** :

```typescript
import { Schema } from "effect"

const schema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

const result = Schema.decodeUnknownSync(schema)({
  name: "Alice",
  age: 30,
  unknown: "stripped" // ce champ est ignoré
})
// → { name: "Alice", age: 30 }
```

### Messages d'erreur lisibles

En cas d'erreur, Effect génère un message précis qui indique **exactement** quel champ pose problème :

```typescript
const result = Schema.decodeUnknownEither(schema, { errors: "all" })({ user: {} })
// → Left avec un message du type :
// { readonly id: string; readonly name: NonEmptyString }
// └─ ["id"]
//    └─ is missing
// └─ ["name"]
//    └─ is missing
```

`{ errors: "all" }` force Effect à reporter **toutes** les erreurs en une seule fois, au lieu de s'arrêter à la première.

### Format tableau avec `ArrayFormatter`

Pour traiter les erreurs de façon programmatique (afficher dans un formulaire, par exemple), `ParseResult.ArrayFormatter` produit un tableau structuré :

```typescript
import { ParseResult, Schema, Either } from "effect"

const result = Schema.decodeUnknownEither(schema)(input)

const errors = Either.isLeft(result)
  ? ParseResult.ArrayFormatter.formatErrorSync(result.left)
  : []

// errors[0] → { path: ["user", "id"], message: "is missing" }
```

## Encode / Decode

Certains types nécessitent une transformation entre leur forme sérialisée et leur forme TypeScript. `Schema.Date` est l'exemple canonique : une `Date` JavaScript devient une string ISO en JSON.

```typescript
const DataSchema = Schema.Struct({ createdAt: Schema.Date })
const originalData = { createdAt: new Date("2026-04-22") }

// Encode : Date → string ISO
const dataDto = Schema.encodeSync(DataSchema)(originalData)
// → { createdAt: "2026-04-22T00:00:00.000Z" }

// Decode : string ISO → Date
const decodedData = Schema.decodeSync(DataSchema)(dataDto)
// → { createdAt: Date("2026-04-22") }
```

Le voyage aller-retour `encode → decode` produit une valeur identique à l'originale.

## Génération de données arbitraires

Effect s'intègre avec `fast-check` via le module `Arbitrary` pour générer des données de test à partir d'un Schema. Chaque donnée générée respecte les contraintes du Schema — idéal pour le **property-based testing** :

```typescript
import { Arbitrary, Schema } from "effect"
import fc from "fast-check"

const DataSchema = Schema.Struct({
  createdAt: Schema.DateFromString,
  name: Schema.NonEmptyTrimmedString
})

const arbitrary = Arbitrary.make(DataSchema)

fc.assert(
  fc.property(arbitrary, (data) => {
    const dto = Schema.encodeSync(DataSchema)(data)
    const decoded = Schema.decodeSync(DataSchema)(dto)
    // La propriété à vérifier : encode → decode doit être idempotent
    expect(data).toEqual(decoded)
  })
)
```

:::tip Property-based testing
Au lieu de tester avec des valeurs fixes, on vérifie qu'une **propriété** tient pour toutes les valeurs valides du Schema. Ici : "encoder puis décoder ne perd pas de données".
:::

## Créer un Schema personnalisé avec Brand

Effect permet de créer des types nominaux — des types TypeScript qui ne sont pas juste des alias :

```typescript
import { Brand, Schema, pipe } from "effect"

type Email = string & Brand.Brand<"email">
const Email = Brand.nominal<Email>()

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EmailSchema = pipe(
  Schema.String,
  Schema.pattern(emailPattern),
  Schema.fromBrand(Email)
)

const data = Schema.decodeUnknownSync(EmailSchema)("user@example.com")
// data est de type Email (et non juste string)
```

`Brand.Brand<"email">` rend `Email` incompatible avec `string` ordinaire au niveau des types TypeScript. Impossible d'utiliser une string non validée là où un `Email` est attendu.

## Exercice

Fichier de test : `packages/api/_exercices/7-schema.spec.ts`

Les tests couvrent cinq cas :

1. **Valider et filtrer** — `decodeUnknownSync` sur un `Schema.Struct`
2. **Messages d'erreur** — affichage arborescent avec `{ errors: "all" }`
3. **Format tableau** — `ParseResult.ArrayFormatter` pour les erreurs
4. **Encode/Decode** — `Schema.Date` entre `Date` et string ISO
5. **Données arbitraires** — property-based testing avec `Arbitrary.make` et `fast-check`
6. **Schema personnalisé** — `Brand` + `Schema.pattern` pour un type `Email`

:::tip Ressources

- [Schema dans la doc Effect](https://effect.website/docs/schema/introduction)
- [fast-check](https://fast-check.dev/)

:::

## Indice 1

<details>
  <summary>Comment valider une valeur inconnue et filtrer les champs inconnus ?</summary>

```typescript
import { Schema } from "effect"

const schema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

// Filtrage automatique des champs inconnus
const result = Schema.decodeUnknownSync(schema)({ name: "Alice", age: 30, extra: "ignored" })
// → { name: "Alice", age: 30 }
```

</details>

## Indice 2

<details>
  <summary>Comment générer des données arbitraires depuis un Schema ?</summary>

```typescript
import { Arbitrary, Schema } from "effect"
import fc from "fast-check"

const arbitrary = Arbitrary.make(VotreSchema)

fc.assert(
  fc.property(arbitrary, (data) => {
    // vérifier une propriété sur data
  })
)
```

`Arbitrary.make` prend un Schema et retourne un arbitraire `fast-check` compatible.

</details>

## Indice 3

<details>
  <summary>Comment créer un type Email avec Brand ?</summary>

```typescript
import { Brand, Schema, pipe } from "effect"

type Email = string & Brand.Brand<"email">
const Email = Brand.nominal<Email>()

const EmailSchema = pipe(
  Schema.String,
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.fromBrand(Email)
)
```

`Schema.fromBrand` applique le brand nominal après la validation du pattern.

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

**Validation et filtrage :**
```typescript
const schema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  isActive: Schema.Boolean
})

const result = Schema.decodeUnknownSync(schema)({
  name: "anyString",
  age: 42,
  isActive: true,
  unknown: "stripped"
})
// → { name: "anyString", age: 42, isActive: true }
```

**Encode/Decode :**
```typescript
const DataSchema = Schema.Struct({ createdAt: Schema.Date })
const original = { createdAt: new Date("2026-04-22") }

const dto = Schema.encodeSync(DataSchema)(original)
// → { createdAt: "2026-04-22T00:00:00.000Z" }

const decoded = Schema.decodeSync(DataSchema)(dto)
// → { createdAt: Date }
```

**Données arbitraires :**
```typescript
import { Arbitrary, Schema } from "effect"
import fc from "fast-check"

const DataSchema = Schema.Struct({
  createdAt: Schema.DateFromString,
  name: Schema.NonEmptyTrimmedString
})

const arbitrary = Arbitrary.make(DataSchema)

fc.assert(
  fc.property(arbitrary, (data) => {
    const dto = Schema.encodeSync(DataSchema)(data)
    const decoded = Schema.decodeSync(DataSchema)(dto)
    expect(data).toEqual(decoded)
  })
)
```

**Schema personnalisé :**
```typescript
type Email = string & Brand.Brand<"email">
const Email = Brand.nominal<Email>()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EmailSchema = pipe(
  Schema.String,
  Schema.pattern(emailPattern),
  Schema.fromBrand(Email)
)

const valid = Schema.decodeUnknownSync(EmailSchema)("user@example.com")
// valid est de type Email

const invalid = Schema.decodeUnknownEither(EmailSchema)("not-an-email")
// → Either.left(ParseError)
```

</details>
