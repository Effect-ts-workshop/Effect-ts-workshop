---
sidebar_position: 7
---

# Exercice 7 — Schema

Les données entrent dans notre application depuis des sources qu'on ne contrôle pas : APIs, formulaires, fichiers JSON. Ces données sont `unknown` — on ne peut pas faire confiance à leur structure.

`Schema` d'Effect est une bibliothèque de validation qui résout deux problèmes à la fois : valider la structure _et_ inférer le type TypeScript. Un seul schema, zéro duplication.

Fichier à compléter : `packages/api/_exercices/7-schema.spec.ts`

---

## `Schema.Struct` — valider un objet

<!-- prettier-ignore -->
```typescript
const PersonSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  isActive: Schema.Boolean
})

type Person = typeof PersonSchema.Type
// { name: string; age: number; isActive: boolean }
```

`Schema.decodeUnknownSync` valide les données et renvoie la valeur typée — ou lève une exception si la validation échoue.

### Exercice

Créez un schema qui valide `{ name: string, age: number, isActive: boolean }` :

<!-- prettier-ignore -->
```typescript
const schema = ??? // À compléter

const result = pipe(rawData, Schema.decodeUnknownSync(schema))
// rawData contient aussi un champ "unknown" qui doit être éliminé
```

À vous de jouer !

:::tip Ressources

- [Schema avancé](../base-de-connaissance/10-schema-avance.md)

:::

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const schema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  isActive: Schema.Boolean
})
```

Les champs non déclarés (`unknown`) sont automatiquement éliminés à la validation.

</details>

---

## Erreurs lisibles

Les erreurs de validation de `Schema` sont structurées. Pour les afficher proprement, on utilise `decodeUnknownEither` + `ParseResult.ArrayFormatter` :

<!-- prettier-ignore -->
```typescript
const result = Schema.decodeUnknownEither(schema, { errors: "all" })(data)

if (Either.isLeft(result)) {
  const errors = ParseResult.ArrayFormatter.formatErrorSync(result.left)
  // [ { path: ["user", "id"], message: "is missing" }, ... ]
}
```

`{ errors: "all" }` force la collecte de toutes les erreurs, pas seulement la première.

### Exercice

Formatez les erreurs en tableau en utilisant `Either.mapLeft` et `ParseResult.ArrayFormatter.formatErrorSync` :

<!-- prettier-ignore -->
```typescript
const errors = pipe(
  result,
  Either.mapLeft(???), // À compléter
  Either.map(() => []),
  Either.getOrElse((error) => error)
)
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const errors = pipe(
  result,
  Either.mapLeft(ParseResult.ArrayFormatter.formatErrorSync),
  Either.map(() => []),
  Either.getOrElse((error) => error)
)
```

</details>

---

## Encode et decode — aller-retour de sérialisation

Un `Schema` peut encoder (TypeScript → JSON) et décoder (JSON → TypeScript) :

<!-- prettier-ignore -->
```typescript
const DataSchema = Schema.Struct({ createdAt: Schema.Date })
const originalData = { createdAt: new Date("2026-04-22") }

// Encode : Date → string ISO
const dto = pipe(originalData, Schema.encodeSync(DataSchema))
// { createdAt: "2026-04-22T00:00:00.000Z" }

// Decode : string ISO → Date
const back = pipe(dto, Schema.decodeSync(DataSchema))
// { createdAt: Date }
```

### Exercice

Encodez `originalData` en DTO, puis redecodez le DTO :

<!-- prettier-ignore -->
```typescript
const dataDto = pipe(originalData, ???(DataSchema)) // À compléter
const decodedData = pipe(dataDto, ???(DataSchema))  // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const dataDto = pipe(originalData, Schema.encodeSync(DataSchema))
const decodedData = pipe(dataDto, Schema.decodeSync(DataSchema))
```

</details>

---

## `Arbitrary.make` — générer des données de test

Pour les tests property-based, `Arbitrary.make` génère automatiquement des données aléatoires conformes à un schema :

<!-- prettier-ignore -->
```typescript
const arbitrary = Arbitrary.make(DataSchema)

fc.assert(
  fc.property(arbitrary, (data) => {
    // data est valide selon DataSchema — garanti par la génération
    const dto = pipe(data, Schema.encodeSync(DataSchema))
    const back = pipe(dto, Schema.decodeSync(DataSchema))
    expect(data).toEqual(back)
  })
)
```

### Exercice

Créez un `arbitrary` à partir de `DataSchema` :

<!-- prettier-ignore -->
```typescript
const arbitrary = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const arbitrary = Arbitrary.make(DataSchema)
```

</details>

---

## Schemas personnalisés — `Schema.pattern` et `Schema.fromBrand`

Pour valider une email, un UUID, un numéro de téléphone, on combine `Schema.pattern` (regex) avec `Schema.fromBrand` (type opaque) :

<!-- prettier-ignore -->
```typescript
type Email = string & Brand.Brand<"email">
const Email = Brand.nominal<Email>()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EmailSchema = pipe(
  Schema.String,
  Schema.pattern(emailPattern),  // vérifie le format
  Schema.fromBrand(Email)        // retourne un type Email (opaque)
)
```

`Schema.fromBrand` garantit qu'un `Email` ne peut être créé qu'en passant par la validation.

### Exercice

Créez `EmailSchema` à partir des éléments ci-dessus :

<!-- prettier-ignore -->
```typescript
const EmailSchema = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const EmailSchema = pipe(
  Schema.String,
  Schema.pattern(emailPattern),
  Schema.fromBrand(Email)
)
```

</details>

---

## Annotations — identifier et clarifier les erreurs

Les annotations enrichissent les messages d'erreur pour les rendre exploitables :

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  name: Schema.String.annotations({ identifier: "Name" }),
  age: Schema.Number.annotations({ identifier: "Age" })
}).annotations({ identifier: "Person" })
```

Sans annotations : `"Expected string, actual undefined"`
Avec annotations : `"Expected Name, actual undefined"` dans le contexte `Person`

### Exercice A — Annoter le type

Annotez le schema avec `{ identifier: "Person" }` :

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({}).annotations(???) // À compléter
```

### Exercice B — Annoter les champs

Annotez les champs `name` (identifier: "Name") et `age` (identifier: "Age") :

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  name: ???, // À compléter
  age: ???   // À compléter
}).annotations({ identifier: "Person" })
```

À vous de jouer !

#### Solution A

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({}).annotations({ identifier: "Person" })
```

</details>

#### Solution B

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  name: Schema.String.annotations({ identifier: "Name" }),
  age: Schema.Number.annotations({ identifier: "Age" })
}).annotations({ identifier: "Person" })
```

</details>

---

## Raffinements — `Schema.Positive` et messages personnalisés

Les raffinements ajoutent des contraintes au-delà du type :

<!-- prettier-ignore -->
```typescript
// Schema.Positive = nombre > 0
const AgeSchema = Schema.Positive

// Message personnalisé
const StrengthSchema = pipe(
  Schema.Number,
  Schema.lessThanOrEqualTo(9000, { message: () => "is over 9000 !!!" })
)
```

### Exercice A

Créez `Person` avec un champ `age` contraint à être positif :

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  age: ??? // À compléter
}).annotations({ identifier: "Person" })
```

### Exercice B

Créez `Person` avec un champ `strength` limité à 9000, avec le message `"is over 9000 !!!"` :

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  strength: ??? // À compléter
}).annotations({ identifier: "Person" })
```

À vous de jouer !

#### Solution A

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  age: Schema.Positive
}).annotations({ identifier: "Person" })
```

</details>

#### Solution B

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const Person = Schema.Struct({
  strength: pipe(
    Schema.Number,
    Schema.lessThanOrEqualTo(9000, { message: () => "is over 9000 !!!" })
  )
}).annotations({ identifier: "Person" })
```

</details>
