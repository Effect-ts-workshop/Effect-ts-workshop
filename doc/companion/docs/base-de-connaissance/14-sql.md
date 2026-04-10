---
sidebar_position: 14
---

# SQL avec `@effect/sql`

## Vue d'ensemble

`@effect/sql` intègre les bases de données relationnelles dans le monde Effect. Les requêtes sont des Effects — elles bénéficient automatiquement de la gestion d'erreurs typée, de la composition, et du tracing distribué.

Deux niveaux d'abstraction sont disponibles :
- **SQL natif** — requêtes SQL directes avec le template literal `sql`
- **Drizzle** — query builder typé, intégré via le service `Database`

---

## Le service `SqlClient`

`SqlClient.SqlClient` est le service de base. On le récupère depuis le contexte comme n'importe quel service Effect :

```typescript
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

const getAll = Effect.fn("getAll")(function*() {
  const sql = yield* SqlClient.SqlClient
  return yield* sql`SELECT * FROM items ORDER BY id`
})
```

Le service est fourni via `SqlLive`, un Layer qui gère la connexion PostgreSQL et son cycle de vie.

---

## Template literals SQL — requêtes paramétrées

Le client `sql` s'utilise comme un template literal. Les variables interpolées sont **automatiquement paramétrées** — pas d'injection SQL possible.

```typescript
const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
  const sql = yield* SqlClient.SqlClient
  return yield* sql`
    SELECT *
    FROM items
    WHERE brand = ${brand}
    ORDER BY id
  `
  // ${brand} → paramètre préparé, jamais injecté directement
})
```

Le résultat est un tableau de lignes brutes. Le type est `ReadonlyArray<unknown>` — à valider avec Schema si besoin.

---

## `Model.Class` — définir un modèle typé

`Model.Class` définit la forme d'un objet en base, avec des types spéciaux pour les timestamps :

```typescript
import { Model, Schema } from "@effect/sql"

class DbItem extends Model.Class<DbItem>("DbItem")({
  id: InventoryItemIdSchema,
  brand: Schema.String,
  model: Schema.String,
  createdAt: Model.DateTimeInsertFromDate, // géré automatiquement à l'insert
  updatedAt: Model.DateTimeUpdateFromDate  // géré automatiquement à l'update
}) {}
```

- `Model.DateTimeInsertFromDate` — la colonne est remplie automatiquement à la création
- `Model.DateTimeUpdateFromDate` — la colonne est mise à jour automatiquement à chaque modification

---

## `Model.makeRepository` — CRUD automatique

`Model.makeRepository` génère un repository complet à partir d'un `Model.Class` :

```typescript
import { Model } from "@effect/sql"

const getCrud = Effect.fn("getCrud")(function*() {
  const repository = yield* Model.makeRepository(DbItem, {
    tableName: "items",
    idColumn: "id" as const,
    spanPrefix: "ItemRepository" // préfixe pour les spans de tracing
  })
  return repository
})
```

Le repository expose :
- `insert(values)` → insère une ligne, retourne la ligne insérée
- `findById(id)` → retourne `Option<DbItem>`
- `update(values)` → met à jour, retourne la ligne modifiée
- `delete(id)` → supprime

Toutes ces opérations sont des Effects typés.

---

## Drizzle — query builder

Pour des requêtes plus complexes (jointures, sous-requêtes, agrégations), Drizzle offre un query builder qui reste dans le monde Effect via le service `Database` :

```typescript
import { Database } from "../database-drizzle"
import { eq } from "drizzle-orm"

const add = Effect.fn("add")(function*(item: NewItem) {
  const db = yield* Database
  return yield* db.insert(items).values(item)
})

const findByBrand = Effect.fn("findByBrand")(function*(brand: string) {
  const db = yield* Database
  return yield* db.select().from(items).where(eq(items.brand, brand))
})
```

`db` est une instance Drizzle wrappée dans Effect : toutes les opérations retournent des Effects, pas des Promises.

### Schéma Drizzle

Les tables sont définies séparément, dans `db/item.sql.ts` :

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
})
```

---

## Setup des tests avec `testcontainers`

Les tests SQL démarrent un vrai conteneur PostgreSQL via `testcontainers` — pas de mock en mémoire. Cela garantit que les requêtes fonctionnent contre une vraie base.

```typescript
import { GenericContainer, Wait } from "testcontainers"

const it = itBase.extend("pgConfig", async ({}, { onCleanup }) => {
  const container = await new GenericContainer("postgres:18.1")
    .withEnvironment({ POSTGRES_USER: "test", POSTGRES_PASSWORD: "test", POSTGRES_DB: "test" })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start()

  onCleanup(async () => container.stop())

  return ConfigProvider.fromMap(new Map([
    ["DB_HOST", container.getHost()],
    ["DB_PORT", String(container.getMappedPort(5432))],
    // ...
  ]))
})
```

`ConfigProvider.fromMap` injecte la configuration du conteneur dans l'application Effect via `Layer.setConfigProvider`.

---

## Layers SQL

```typescript
// Layer minimal pour les tests
const databaseLayer = Layer.mergeAll(SqlLive, MigratorLive)

// Avec configuration injectée (pour les tests)
const testLayer = pipe(
  databaseLayer,
  Layer.provide(Layer.setConfigProvider(pgConfig))
)
```

- `SqlLive` — connexion PostgreSQL (lit `DB_HOST`, `DB_PORT`, `DB_NAME`, etc.)
- `MigratorLive` — applique les migrations au démarrage
- `DatabaseLive` — service Drizzle (dépend de `SqlLive`)

---

## Récapitulatif

| Besoin | API |
|---|---|
| Requête SQL brute | `` sql`SELECT ...` `` (template literal) |
| CRUD simple | `Model.Class` + `Model.makeRepository` |
| Requêtes complexes | Drizzle via service `Database` |
| Connexion gérée | `SqlLive` + `MigratorLive` |
| Tests avec vraie base | `testcontainers` + `Layer.setConfigProvider` |
