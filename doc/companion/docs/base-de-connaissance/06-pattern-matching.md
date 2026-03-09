---
sidebar_position: 6
---

# Pattern Matching

## Le module `Match`

Le module `Match` d'Effect permet une correspondance de motifs **exhaustive** sur des valeurs :

```typescript
import { Match } from "effect";

const résultat = Match.value(uneValeur).pipe(
  Match.when(condition1, gestionnaire1),
  Match.when(condition2, gestionnaire2),
  Match.exhaustive // force la couverture de tous les cas
);
```

## Types de conditions

### Valeurs littérales

```typescript
Match.value("chargement").pipe(
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
  | { type: "erreur"; message: string };

Match.value(état).pipe(
  Match.when({ type: "vide" }, () => "Rien à afficher"),
  Match.when({ type: "données" }, ({ items }) => `${items.length} items`),
  Match.when({ type: "erreur" }, ({ message }) => `Erreur : ${message}`),
  Match.exhaustive
)
```

### Gardes de type (`Match.is`)

```typescript
import { Match } from "effect";

Match.value(valeur).pipe(
  Match.when(Match.number, (n) => `Nombre : ${n}`),
  Match.when(Match.string, (s) => `Chaîne : ${s}`),
  Match.orElse(() => "Autre type")
)
```

## `Match.exhaustive` vs `Match.orElse`

```typescript
// Match.exhaustive — compile seulement si tous les cas sont couverts
Match.value(état).pipe(
  Match.when("a", () => 1),
  // ❌ Ne compile pas si "b" n'est pas géré
  Match.exhaustive
)

// Match.orElse — fournit un cas par défaut
Match.value(état).pipe(
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
