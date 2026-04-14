---
sidebar_position: 6
---

# Exercice 6 — Schema

Les données entrent dans notre application depuis des sources qu'on ne contrôle pas : APIs, formulaires, fichiers JSON. Ces données sont `unknown` — on ne peut pas faire confiance à leur structure.

`Schema` d'Effect est une bibliothèque de validation qui résout deux problèmes à la fois : valider la structure _et_ inférer le type TypeScript. Un seul schema, zéro duplication.

Fichier à compléter : `packages/api/_exercices/6-schema.spec.ts`

---

## Valider la structure d'un objet

<!-- prettier-ignore -->
```typescript
const ProductSchema = Schema.Struct({
  model: Schema.String,
  price: Schema.Number,
  available: Schema.Boolean
})

type Product = typeof ProductSchema.Type
// { model: string; price: number; available: boolean }
```

`Schema.decodeUnknownSync` prend en paramètre un schéma et retourne une fonction qui valide les données et renvoie la valeur typée — ou lève une exception si la validation échoue.

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

Les erreurs de validation de `Schema` sont structurées. Pour les afficher d'une façon plus lisible on utilise par exemple `ParseResult.ArrayFormatter` qui renverra un tableau d'erreurs le cas échéant :

<!-- prettier-ignore -->
```typescript
const result = Schema.decodeUnknownEither(schema, { errors: "all" })(data)

if (Either.isLeft(result)) { // si la validation a échoué, result.left contient les erreurs formatées
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

Un même `Schema` peut encoder de TypeScript vers JSON et décoder de JSON vers TypeScript. La cohérence entre ce qu'envoie le _serializer_ au _deserializer_ est garantir par construction. 

<!-- prettier-ignore -->
```typescript
const EventSchema = Schema.Struct({ occurredAt: Schema.Date })
const event = { occurredAt: new Date("2025-01-15") }

// Encode : Date → string ISO
const eventDto = pipe(event, Schema.encodeSync(EventSchema))
// { occurredAt: "2025-01-15T00:00:00.000Z" }

// Decode : string ISO → Date
const decoded = pipe(eventDto, Schema.decodeSync(EventSchema))
// { occurredAt: Date }
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

## Générer des données de test automatiquement

Pour les tests property-based, `Arbitrary.make` génère automatiquement des données aléatoires conformes à un schema qui lui est fourni. On peut tester que l'on récupère bien des valeurs de même validité que les originales après sérialisation et désérialisation :

<!-- prettier-ignore -->
```typescript
const arbitrary = Arbitrary.make(EventSchema)

fc.assert(
  fc.property(arbitrary, (event) => {
    // event est valide selon EventSchema — garanti par la génération
    const dto = pipe(event, Schema.encodeSync(EventSchema))
    const back = pipe(dto, Schema.decodeSync(EventSchema))
    expect(event).toEqual(back)
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

## Créer un schema personnalisé

Pour valider une email, un UUID, un numéro de téléphone, on combine `Schema.pattern` (regex) avec `Schema.fromBrand` (type opaque) :

<!-- prettier-ignore -->
```typescript
type Port = number & Brand.Brand<"Port">
const Port = Brand.nominal<Port>()

const PortSchema = pipe(
  Schema.Int,                      // entier uniquement
  Schema.between(1, 65535),        // plage valide
  Schema.fromBrand(Port)           // retourne un type Port (opaque)
)
```

`Schema.fromBrand` garantit qu'un `Port` ne peut être créé qu'à partit d'un numéro valide'.

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
const Product = Schema.Struct({
  title: Schema.String.annotations({ identifier: "Title" }),
  price: Schema.Number.annotations({ identifier: "Price" })
}).annotations({ identifier: "Product" })
```

Sans annotations : `"Expected string, actual undefined"`
Avec annotations : `"Expected Title, actual undefined"` dans le contexte `Product`

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

#### Indice 1

<details>
  <summary>L'ordre de déclaration des propriétés influe sur l'ordre des clés  erreurs</summary>

```typescript
const badProduct = { price: '10€'}

const Product = Schema.Struct({
  title: Schema.String.annotations({ identifier: "Title" }), // [0]
  price: Schema.Number.annotations({ identifier: "Price" })  // [1]
}).annotations({ identifier: "Product" })

// Formatted errors
// [
//   {
//     "path": ["title"],
//    ...
//   },
//   {
//     "path": ["price"],
//    ...
//   }
// ]
```
</details>

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
  <summary>L'ordre des cas compte</summary>

Placez `Match.when(Match.null, ...)` avant `Match.when(Match.string, ...)` — `null` pourrait autrement être absorbé par un cas trop large.

</details>

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

## Raffinements et messages personnalisés

Les raffinements ajoutent des contraintes au-delà du type :

<!-- prettier-ignore -->
```typescript
// Schema.NonEmptyString :  string != ''
const Name = Schema.NonEmptyString

// Message personnalisé
const NormalizedRange = pipe(
  Schema.Number,
  Schema.between((-1, 1), { message: () => "out of range" })
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

Créez `Person` avec un champ `strength` limité à 9000 et personnalisez la sortie du validateur si `strength` est supérieur à 9000 :

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
