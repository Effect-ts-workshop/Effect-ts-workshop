---
sidebar_position: 1
---

# Exercice 9 — SQL et bases de données

:::tip Prérequis

Cet exercice nécessite une base de données PostgreSQL. Lancez-la avec :

```bash
docker compose up -d
```

:::

## L'approche Effect pour les bases de données

Effect propose deux niveaux d'abstraction pour accéder à une base de données SQL :

1. **`@effect/sql` — SQL brut et repository pattern**
   Un client SQL générique qui expose des tagged templates et un pattern de repository typé.

2. **Drizzle ORM — query builder typé**
   Drizzle s'intègre nativement avec Effect : chaque requête Drizzle retourne un `Effect` quand elle est fournie via le service `Database`.

Les deux approches s'utilisent avec les mêmes mécaniques Effect : `yield*`, `Effect.fn`, `Layer.provide`.

## Partie 1 — SQL brut avec `SqlClient`

`SqlClient.SqlClient` est le service Effect qui représente la connexion à la base de données. On l'obtient dans un générateur avec `yield*`, comme n'importe quel autre service :

```typescript
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

const getAll = Effect.fn("getAll")(function*() {
  const sql = yield* SqlClient.SqlClient

  const rows = yield* sql`SELECT * FROM items ORDER BY id`
  return rows
})
```

La syntaxe `` sql`...` `` est un tagged template. Elle retourne un `Effect` qui exécute la requête quand le service `SqlClient` est fourni dans le contexte.

## Partie 2 — CRUD avec `Model.Class` et `Model.makeRepository`

`@effect/sql` propose un système de repository qui génère automatiquement les opérations CRUD à partir d'un `Model.Class` :

```typescript
import { Model } from "@effect/sql"
import { Schema } from "effect"

class DbItem extends Model.Class<DbItem>("DbItem")({
  id: Schema.String,
  brand: Schema.String,
  model: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate
}) {}
```

`Model.DateTimeInsertFromDate` et `Model.DateTimeUpdateFromDate` sont des helpers qui gèrent automatiquement `created_at` et `updated_at` lors des insertions et mises à jour.

```typescript
const getCrud = Effect.fn("getCrud")(function*() {
  return yield* Model.makeRepository(DbItem, {
    tableName: "items",
    idColumn: "id",
    spanPrefix: "ItemRepository"
  })
})
```

Le repository généré expose : `insert`, `findById`, `update`, `delete`…

## Partie 3 — Drizzle ORM avec Effect

Drizzle ORM peut être intégré comme un service Effect. Chaque requête Drizzle devient un `Effect` en utilisant le service `Database` :

```typescript
const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
  const db = yield* Database

  return yield* db.select().from(items).where(eq(items.brand, brand))
})
```

L'avantage : les requêtes Drizzle sont **typées** (le compilateur vérifie les colonnes et les types de retour) et s'intègrent naturellement dans la composition Effect.

## Exercice

Fichier de test : `packages/api/_exercices/9-sql.spec.ts`

Les tests couvrent trois cas :

1. **SQL brut** — lire toutes les lignes avec `` sql`SELECT...` ``
2. **CRUD avec `Model.makeRepository`** — insérer et retrouver un item
3. **Drizzle** — insérer avec `db.insert` et rechercher avec `db.select().where(...)`

:::tip Ressources

- [`@effect/sql` dans la doc Effect](https://effect.website/docs/sql/introduction)
- [Drizzle ORM](https://orm.drizzle.team/)

:::

## Indice 1

<details>
  <summary>Comment fournir le service SqlClient dans les tests ?</summary>

Le layer `SqlLive` est déjà configuré dans `packages/api/database.ts`. Il fournit `SqlClient.SqlClient` connecté à la base PostgreSQL locale.

```typescript
import { SqlLive } from "../database"
import { MigratorLive } from "../migrator"

const layer = Layer.mergeAll(SqlLive, MigratorLive)

const program = pipe(monEffect, Effect.provide(layer))
```

`MigratorLive` exécute les migrations au démarrage pour s'assurer que les tables existent.

</details>

## Indice 2

<details>
  <summary>Comment créer un repository CRUD complet en quelques lignes ?</summary>

```typescript
class DbItem extends Model.Class<DbItem>("DbItem")({
  id: InventoryItemIdSchema,
  brand: Schema.String,
  model: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,  // géré auto à l'insert
  updatedAt: Model.DateTimeUpdateFromDate   // géré auto à chaque update
}) {}

const crud = yield* Model.makeRepository(DbItem, {
  tableName: "items",
  idColumn: "id" as const,
  spanPrefix: "ItemRepository"
})

// Usage
const inserted = yield* crud.insert({ id: ..., brand: "...", model: "...", createdAt: undefined, updatedAt: undefined })
const found = yield* (yield* crud.findById(inserted.id))
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

**SQL brut :**
```typescript
const getAll = Effect.fn("getAll")(function*() {
  const sql = yield* SqlClient.SqlClient
  const items = yield* sql`SELECT * FROM items ORDER BY id`
  return items
})

const program = pipe(getAll(), Effect.provide(layer))
```

**CRUD avec repository :**
```typescript
const program = pipe(
  Effect.gen(function*() {
    const crud = yield* getCrud()
    const inserted = yield* crud.insert({
      id: InventoryItemId(crypto.randomUUID()),
      brand: "NEW BRAND",
      model: "NEW MODEL",
      createdAt: undefined,
      updatedAt: undefined
    })
    const found = yield* (yield* crud.findById(inserted.id))
    return { inserted, found }
  }),
  Effect.provide(layer)
)
```

**Drizzle :**
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
