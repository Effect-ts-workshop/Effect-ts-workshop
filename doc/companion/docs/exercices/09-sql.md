---
sidebar_position: 9
---

# Exercice 9 — SQL

Nos services utilisent une base de données PostgreSQL. Cet exercice couvre deux niveaux d'abstraction : le SQL natif avec `@effect/sql`, et le query builder Drizzle.

Les tests de cet exercice démarrent un vrai conteneur PostgreSQL via `testcontainers`. Pas de mocks — les requêtes s'exécutent contre une vraie base.

Fichier à compléter : `packages/api/_exercices/9-sql.spec.ts`

:::warning Prérequis

Cet exercice démarre un conteneur PostgreSQL via `testcontainers`. **Docker doit être installé et démarré** sur votre machine avant de lancer les tests.

:::

---

## SQL natif — template literal

`@effect/sql` fournit un client SQL (`SqlClient.SqlClient`) utilisable comme service Effect. Les requêtes s'écrivent avec des template literals :

<!-- prettier-ignore -->
```typescript
const getAll = Effect.fn("getAll")(function*() {
  const sql = yield* SqlClient.SqlClient   // récupère le client depuis le contexte

  const rows = yield* sql`SELECT * FROM items ORDER BY id`
  return rows
})
```

Le template literal est _safe_ par construction : les variables interpolées sont automatiquement paramétrées — pas d'injection SQL possible.

### Exercice

Complétez `getAll` pour exécuter `SELECT * FROM items ORDER BY id` :

<!-- prettier-ignore -->
```typescript
const getAll = Effect.fn("getAll")(function*() {
  const sql = yield* SqlClient.SqlClient
  const items = ??? // À compléter
  return items
})
```

À vous de jouer !

:::tip Ressources

- [SQL avec @effect/sql](../base-de-connaissance/14-sql.md)

:::

#### Indice 1

<details>
  <summary>Exécuter une requête SQL</summary>

Le client `sql` s'utilise comme un template literal :

<!-- prettier-ignore -->
```typescript
const rows = yield* sql`SELECT * FROM ma_table`
```

`yield*` attend le résultat de la requête avant de continuer.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const getAll = Effect.fn("getAll")(function*() {
  const sql = yield* SqlClient.SqlClient
  const items = yield* sql`
    SELECT *
    FROM items
    ORDER BY id
  `
  return items
})
```

</details>

---

## `Model.Class` + `Model.makeRepository` — CRUD automatique

Pour les opérations CRUD classiques, `Model.Class` et `Model.makeRepository` génèrent le repository automatiquement à partir d'un schema :

<!-- prettier-ignore -->
```typescript
class DbItem extends Model.Class<DbItem>("DbItem")({
  id: InventoryItemIdSchema,
  brand: Schema.String,
  model: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate
}) {}

const repoConfig = {
  tableName: "items",
  idColumn: "id" as const,
  spanPrefix: "ItemRepository"
}

const repository = yield* Model.makeRepository(DbItem, repoConfig)
```

Le `repository` expose `insert`, `findById`, `findAll`, `update`, `delete` — typés selon `DbItem`.

### Exercice

Complétez `getCrud` pour créer un repository `DbItem` :

<!-- prettier-ignore -->
```typescript
const getCrud = Effect.fn("getCrud")(function*() {
  const repository = ??? // À compléter
  return repository
})
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Les arguments de `makeRepository`</summary>

<!-- prettier-ignore -->
```typescript
yield* Model.makeRepository(LaClasse, {
  tableName: "nom_de_la_table",
  idColumn: "id" as const,
  spanPrefix: "PrefixeDuSpan"
})
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const getCrud = Effect.fn("getCrud")(function*() {
  const repository = yield* Model.makeRepository(DbItem, {
    tableName: "items",
    idColumn: "id" as const,
    spanPrefix: "ItemRepository"
  })
  return repository
})
```

</details>

---

## Drizzle — query builder typé

Pour les requêtes plus complexes, Drizzle offre un query builder qui reste dans le monde Effect via le service `Database` :

<!-- prettier-ignore -->
```typescript
const add = Effect.fn("add")(function*(item: InferInsertModel<typeof items>) {
  const db = yield* Database
  return yield* db.insert(items).values(item)
})

const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
  const db = yield* Database
  return yield* db.select().from(items).where(eq(items.brand, brand))
})
```

`db` est une instance Drizzle wrappée dans Effect — toutes les opérations sont des `Effect`, pas des `Promise`.

### Exercice

Complétez `add` (insert) et `findByBrand` (select + where) :

<!-- prettier-ignore -->
```typescript
const add = Effect.fn("add")(function*(item: InferInsertModel<typeof items>) {
  const db = yield* Database
  return ??? // À compléter : insérer item dans la table items
})

const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
  const db = yield* Database
  return ??? // À compléter : sélectionner tous les items où brand === brand
})
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Syntaxe Drizzle pour l'insert</summary>

<!-- prettier-ignore -->
```typescript
db.insert(table).values(item)
```

</details>

#### Indice 2

<details>
  <summary>Syntaxe Drizzle pour le select avec where</summary>

<!-- prettier-ignore -->
```typescript
db.select().from(table).where(eq(table.champ, valeur))
```

`eq` est importé de `drizzle-orm`.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const add = Effect.fn("add")(function*(item: InferInsertModel<typeof items>) {
  const db = yield* Database
  return yield* db.insert(items).values(item)
})

const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
  const db = yield* Database
  return yield* db.select().from(items).where(eq(items.brand, brand))
})
```

</details>
