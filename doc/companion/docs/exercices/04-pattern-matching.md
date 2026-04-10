---
sidebar_position: 4
---

# Exercice 4 — Pattern Matching

Un `switch/case` TypeScript fonctionne, mais il a des angles morts : il ne vérifie pas l'exhaustivité par défaut, les conditions complexes sont maladroites, et on ne peut pas l'utiliser dans une expression `pipe`.

`Match` d'Effect est une alternative typée, composable et exhaustive.

Fichier à compléter : `packages/api/_exercices/4-pattern-matching.spec.ts`

---

## `Match.value` + `Match.when` + `Match.exhaustive`

Le pattern de base : démarrer un match sur une valeur, définir les cas, clore avec `exhaustive`.

```typescript
pipe(
  Match.value(field),
  Match.when({ type: "number" }, (f) => String(f.value)),
  Match.when({ type: "text" }, (f) => f.value),
  Match.exhaustive // ← le compilateur vérifie qu'aucun cas n'est oublié
)
```

`Match.exhaustive` transforme le matcher en valeur. Si un cas possible n'est pas couvert, TypeScript signale une erreur de compilation.

### Exercice

Complétez `getValue` pour couvrir les quatre variantes de `AnyField` :

```typescript
type AnyField = NumberField | TextField | SelectField | MultipleSelectField

const getValue = (field: AnyField) =>
  pipe(
    Match.value(field),
    ???, // À compléter
    Match.exhaustive
  )
```

Les valeurs attendues :
- `{ type: "number", value: 42 }` → `"42"`
- `{ type: "text", value: "awesome" }` → `"awesome"`
- `{ type: "select", multiple: false, value: "selected" }` → `"selected"`
- `{ type: "select", multiple: true, value: ["a", "b"] }` → `"a, b"`

À vous de jouer !

:::tip Ressources

- [Pattern Matching](../base-de-connaissance/06-pattern-matching.md)

:::

#### Indice 1

<details>
  <summary>Chaque `Match.when` prend un prédicat partiel</summary>

On peut matcher sur un objet partiel. `{ type: "number" }` correspond à tout objet dont `type` vaut `"number"`. TypeScript affine ensuite le type dans le handler.

```typescript
Match.when({ type: "number" }, (f) => /* f est de type NumberField ici */)
```

</details>

#### Indice 2

<details>
  <summary>Distinguer `multiple: true` de `multiple: false`</summary>

Les deux cas `SelectField` et `MultipleSelectField` ont `type: "select"`. Pour les différencier, ajoutez `multiple` au prédicat :

```typescript
Match.when({ type: "select", multiple: true }, (f) => f.value.join(", "))
Match.when({ type: "select", multiple: false }, (f) => f.value)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const getValue = (field: AnyField) =>
  pipe(
    Match.value(field),
    Match.when({ type: "number" }, (field) => String(field.value)),
    Match.when({ type: "text" }, (field) => field.value),
    Match.when({ type: "select", multiple: true }, (field) => field.value.join(", ")),
    Match.when({ type: "select", multiple: false }, (field) => field.value),
    Match.exhaustive
  )
```

</details>

---

## `Option.match` — valeurs optionnelles

`Option` représente une valeur qui peut être présente (`Some`) ou absente (`None`). `Array.get` renvoie un `Option` plutôt qu'un `undefined` silencieux :

```typescript
Array.get(allValues, 0) // Option<string>
```

`Option.match` permet de traiter les deux cas explicitement :

```typescript
pipe(
  Array.get(allValues, index),
  Option.match({
    onSome: (v) => v.toUpperCase(),
    onNone: () => "DEFAULT"
  })
)
```

### Exercice

Complétez `getValueAt` pour renvoyer la valeur en majuscules si elle existe, ou `"DEFAULT"` sinon :

```typescript
const getValueAt = (index: number) =>
  pipe(
    allValues,
    Array.get(index),
    ??? // À compléter
  )
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Les deux branches</summary>

`Option.match` attend un objet avec deux clés : `onSome` (reçoit la valeur) et `onNone` (appelée si absent).

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const getValueAt = (index: number) =>
  pipe(
    allValues,
    Array.get(index),
    Option.match({
      onSome: (v) => v.toUpperCase(),
      onNone: () => "DEFAULT"
    })
  )
```

</details>

---

## `Match.option` — résultat dans un `Option`

Parfois, on ne veut pas couvrir tous les cas — seulement certains. `Match.option` clôt le match en enveloppant le résultat dans un `Option` : `Some` si un cas a matché, `None` sinon.

```typescript
const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
  pipe(
    Match.value(stock),
    Match.when({ status: "in_stock" }, (s) => (s.quantity > 10 ? 2 : 5)),
    Match.option // ← Option.some(2|5) si "in_stock", Option.none() sinon
  )
```

### Exercice

Complétez `getDeliveryDays` pour renvoyer le délai uniquement pour `"in_stock"` :

```typescript
const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
  pipe(
    Match.value(stock),
    ???, // À compléter : quand "in_stock", renvoyer 2 si quantity > 10, sinon 5
    ???  // À compléter : clore avec Option
  )
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
  pipe(
    Match.value(stock),
    Match.when({ status: "in_stock" }, (s) => (s.quantity > 10 ? 2 : 5)),
    Match.option
  )
```

</details>

---

## `Match.tag` — unions discriminées

Quand les variantes d'une union ont une propriété `_tag`, `Match.tag` est plus concis que `Match.when({ _tag: "..." })` :

```typescript
pipe(
  Match.value(notification),
  Match.tag("Email", (n) => `Email to ${n.to}: ${n.subject}`),
  Match.tag("Sms", (n) => `SMS to ${n.phone}: ${n.body}`),
  Match.tag("Push", (n) => `Push on ${n.deviceId}: ${n.title}`),
  Match.exhaustive
)
```

### Exercice

Complétez `describe` pour les trois types de notifications :

```typescript
type Notification = EmailNotification | SmsNotification | PushNotification

const describe = (notif: Notification) =>
  pipe(
    Match.value(notif),
    ???, // À compléter — 3 cas
    Match.exhaustive
  )
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const describe = (notif: Notification) =>
  pipe(
    Match.value(notif),
    Match.tag("Email", (n) => `Email to ${n.to}: ${n.subject}`),
    Match.tag("Sms", (n) => `SMS to ${n.phone}: ${n.body}`),
    Match.tag("Push", (n) => `Push on ${n.deviceId}: ${n.title}`),
    Match.exhaustive
  )
```

</details>

---

## `Match.orElse` — le cas par défaut

Quand on ne peut pas couvrir tous les cas (type `string` ouvert, valeurs inconnues), `Match.orElse` joue le rôle du `default` dans un `switch` :

```typescript
pipe(
  Match.value(method),
  Match.when("card", () => "1.5%"),
  Match.when("paypal", () => "2.9%"),
  Match.orElse(() => "frais inconnus : 3%") // attrape tout le reste
)
```

### Exercice

Complétez `getProcessingFee` avec trois cas explicites et un fallback :

```typescript
const getProcessingFee = (method: PaymentMethod): string =>
  pipe(
    Match.value(method),
    ??? // "card" → "1.5%", "paypal" → "2.9%", "crypto" → "0%", sinon → "unknown method, default fee: 3%"
  )
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const getProcessingFee = (method: PaymentMethod): string =>
  pipe(
    Match.value(method),
    Match.when("card", () => "1.5%"),
    Match.when("paypal", () => "2.9%"),
    Match.when("crypto", () => "0%"),
    Match.orElse(() => "unknown method, default fee: 3%")
  )
```

</details>

---

## `Match.not` — exclure un cas

Pour matcher "tout sauf X", `Match.not` exclut une valeur spécifique :

```typescript
pipe(
  Match.value(status),
  Match.not("cancelled", () => true), // tout sauf "cancelled"
  Match.orElse(() => false)
)
```

### Exercice

Implémentez `isTrackable` : une commande est traçable sauf si elle est `"cancelled"` :

```typescript
const isTrackable = (status: OrderStatus) =>
  pipe(
    Match.value(status),
    ???, // À compléter
    Match.orElse(() => false)
  )
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const isTrackable = (status: OrderStatus) =>
  pipe(
    Match.value(status),
    Match.not("cancelled", () => true),
    Match.orElse(() => false)
  )
```

</details>

---

## `Match.whenOr` — plusieurs valeurs, même branche

`Match.whenOr` est un raccourci pour plusieurs `Match.when` qui renvoient la même chose :

```typescript
// Équivalent à deux Match.when séparés
Match.whenOr("admin", "superAdmin", () => true)
```

### Exercice

`canAccessDashboard` renvoie `true` uniquement pour `"admin"` et `"superAdmin"` :

```typescript
const canAccessDashboard = (role: Role) =>
  pipe(
    Match.value(role),
    ???, // À compléter
    Match.orElse(() => false)
  )
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const canAccessDashboard = (role: Role) =>
  pipe(
    Match.value(role),
    Match.whenOr("admin", "superAdmin", () => true),
    Match.orElse(() => false)
  )
```

</details>

---

## Prédicats intégrés — `Match.null`, `Match.boolean`, `Match.number`, `Match.string`

Pour matcher sur des types primitifs, `Match` fournit des prédicats prêts à l'emploi :

```typescript
pipe(
  Match.value(value),
  Match.when(Match.null, () => "—"),
  Match.when(Match.boolean, (b) => (b ? "Oui" : "Non")),
  Match.when(Match.number, (n) => n.toLocaleString("fr-FR")),
  Match.when(Match.string, (s) => s),
  Match.exhaustive
)
```

### Exercice

Complétez `formatForDisplay` pour les quatre types de `FieldValue` :

```typescript
type FieldValue = string | number | boolean | null

const formatForDisplay = (value: FieldValue) =>
  pipe(
    Match.value(value),
    ???, // À compléter : null → "—", boolean → "Oui"/"Non", number → locale fr-FR, string → identité
    Match.exhaustive
  )
```

À vous de jouer !

#### Indice 1

<details>
  <summary>L'ordre des cas compte</summary>

Placez `Match.when(Match.null, ...)` avant `Match.when(Match.string, ...)` — `null` pourrait autrement être absorbé par un cas trop large.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const formatForDisplay = (value: FieldValue) =>
  pipe(
    Match.value(value),
    Match.when(Match.null, () => "—"),
    Match.when(Match.boolean, (b) => (b ? "Oui" : "Non")),
    Match.when(Match.number, (n) => n.toLocaleString("fr-FR")),
    Match.when(Match.string, (s) => s),
    Match.exhaustive
  )
```

</details>
