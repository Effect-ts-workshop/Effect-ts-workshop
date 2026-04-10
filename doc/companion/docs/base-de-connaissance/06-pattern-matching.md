---
sidebar_position: 6
---

# Pattern Matching

## Le module `Match`

Le module `Match` d'Effect permet une correspondance de motifs **exhaustive** sur des valeurs :

```typescript
import { Match, pipe } from "effect"

const résultat = pipe(
  Match.value(uneValeur),
  Match.when(condition1, gestionnaire1),
  Match.when(condition2, gestionnaire2),
  Match.exhaustive // force la couverture de tous les cas
)
```

## Types de conditions

### Valeurs littérales

```typescript
pipe(
  Match.value("chargement"),
  Match.when("chargement", () => "⏳"),
  Match.when("succès", () => "✅"),
  Match.when("erreur", () => "❌"),
  Match.exhaustive
)
```

### Types discriminants (objets avec `type`)

```typescript
type État =
  | { type: "vide" }
  | { type: "données"; items: Item[] }
  | { type: "erreur"; message: string }

pipe(
  Match.value(état),
  Match.when({ type: "vide" }, () => "Rien à afficher"),
  Match.when({ type: "données" }, ({ items }) => `${items.length} items`),
  Match.when({ type: "erreur" }, ({ message }) => `Erreur : ${message}`),
  Match.exhaustive
)
```

### `Match.tag` — unions avec `_tag`

Quand les variantes d'une union utilisent `_tag` comme discriminant, `Match.tag` est plus concis que `Match.when({ _tag: "..." })` :

```typescript
type Notification =
  | { _tag: "Email"; to: string }
  | { _tag: "Sms"; phone: string }
  | { _tag: "Push"; deviceId: string }

pipe(
  Match.value(notification),
  Match.tag("Email", (n) => `Email to ${n.to}`),
  Match.tag("Sms", (n) => `SMS to ${n.phone}`),
  Match.tag("Push", (n) => `Push on ${n.deviceId}`),
  Match.exhaustive
)
```

### `Match.not` — exclure un cas

```typescript
// Tout sauf "cancelled"
pipe(
  Match.value(status),
  Match.not("cancelled", () => true),
  Match.orElse(() => false)
)
```

### `Match.whenOr` — plusieurs valeurs, même branche

```typescript
// Évite d'écrire deux Match.when identiques
pipe(
  Match.value(role),
  Match.whenOr("admin", "superAdmin", () => true),
  Match.orElse(() => false)
)
```

### `Match.option` — résultat en `Option`

`Match.option` clôt le match en enveloppant le résultat dans un `Option`. Si aucun cas ne correspond : `Option.none()`.

```typescript
const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
  pipe(
    Match.value(stock),
    Match.when({ status: "in_stock" }, (s) => (s.quantity > 10 ? 2 : 5)),
    Match.option
    // Option.some(2|5) si "in_stock"
    // Option.none() pour "out_of_stock" et "discontinued"
  )
```

### Gardes de type — `Match.null`, `Match.boolean`, `Match.number`, `Match.string`

```typescript
pipe(
  Match.value(valeur),
  Match.when(Match.null, () => "—"),
  Match.when(Match.boolean, (b) => (b ? "Oui" : "Non")),
  Match.when(Match.number, (n) => `Nombre : ${n}`),
  Match.when(Match.string, (s) => `Chaîne : ${s}`),
  Match.exhaustive
)
```

## `Match.exhaustive` vs `Match.orElse`

```typescript
// Match.exhaustive — compile seulement si tous les cas sont couverts
pipe(
  Match.value(état),
  Match.when("a", () => 1),
  // ❌ Ne compile pas si "b" n'est pas géré
  Match.exhaustive
)

// Match.orElse — fournit un cas par défaut
pipe(
  Match.value(état),
  Match.when("a", () => 1),
  Match.orElse(() => 0) // ✅ Gère tous les autres cas
)
```

## Le type `Option`

`Option<A>` représente une valeur qui peut être absente :

```typescript
import { Option } from "effect";

// Valeur présente
const présent: Option.Option<number> = Option.some(42);

// Valeur absente
const absent: Option.Option<number> = Option.none();
```

### Créer un Option

```typescript
// Depuis une valeur nullable
Option.fromNullable(valeur)         // undefined/null → Option.none()
Option.fromNullable("hello")        // → Option.some("hello")
Option.fromNullable(null)           // → Option.none()

// Directement
Option.some(42)
Option.none()
```

### Utiliser un Option

```typescript
// Matcher le résultat
Option.match(option, {
  onNone: () => "Pas de valeur",
  onSome: (valeur) => `Valeur : ${valeur}`,
})

// Extraire avec valeur par défaut
Option.getOrElse(option, () => valeurParDéfaut)

// Transformer si présent
Option.map(option, (v) => v * 2)

// Enchaîner
Option.flatMap(option, (v) => Option.fromNullable(autreChoix(v)))

// Vérifier
Option.isSome(option) // true si Some
Option.isNone(option) // true si None
```

## Option dans l'application finale

L'endpoint `getItemById` retourne un `Option<Item>` :

```typescript
// packages/shared/item.ts
export const getItemByIdResponseSchema = Schema.Option(InventoryItemSchema);
```

Dans l'interface utilisateur (`ItemDetail.tsx`) :

```typescript
Option.match(item, {
  onNone: () => <p>Article non trouvé</p>,
  onSome: (item) => (
    <div>
      <p>{item.brand} - {item.model}</p>
    </div>
  ),
})
```

`Option` évite les erreurs `Cannot read property 'x' of undefined`. TypeScript vous force à gérer les deux cas.
