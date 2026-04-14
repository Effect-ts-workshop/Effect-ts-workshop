---
sidebar_position: 3
---

# Exercice 3 — Pattern Matching

En TypeScript un `switch/case` fonctionne, mais il a des angles morts :

- il ne vérifie pas l'exhaustivité par défaut,
- les conditions complexes - comme discriminer sur plusieurs propriétés - sont maladroites,
- on ne peut pas l'utiliser dans une expression `pipe`.

Effect fournit avec `Match` une alternative typée, composable et exhaustive.

Fichier à compléter : `packages/api/_exercices/3-pattern-matching.spec.ts`

---

## Couvrir tous les cas possibles

Le pattern de base : démarrer un match sur une valeur, définir les cas, clore avec `exhaustive`.

<!-- prettier-ignore -->
```typescript
type Circle = { kind: "circle"; radius: number }
type Rectangle = { kind: "rectangle"; width: number, height: number }

type AnyShape = Circle | Rectangle

pipe(
  Match.value(shape),
  Match.when({ kind: "circle" }, (s) => Math.PI * s.radius ** 2),
  Match.when({ kind: "rectangle" }, (s) => s.width * s.height),
  Match.exhaustive // ← le compilateur vérifie qu'aucun cas n'est oublié
)
```

Le Matcher a un paramètre de type F (Filters) qui trace ce qui n'a pas encore été matché, chaque appel à Match.when met à jour F: il "retire" le type couvert du filtre. La signature de `Match.exhaustive` _exige_ que F soit never. Si un cas possible n'est pas couvert, TypeScript signale une erreur de compilation.

### Exercice

Complétez `getValue` pour couvrir les quatre variants du type `AnyField` :

<!-- prettier-ignore -->
```typescript
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

<!-- prettier-ignore -->
```typescript
Match.when({ type: "number" }, (f) => /* f est de type NumberField ici */)
```

</details>

#### Indice 2

<details>
  <summary>Distinguer `multiple: true` de `multiple: false`</summary>

Les deux cas `SelectField` et `MultipleSelectField` ont `type: "select"`. Pour les différencier, ajoutez `multiple` au prédicat :

<!-- prettier-ignore -->
```typescript
Match.when({ type: "select", multiple: true }, (f) => f.value.join(", "))
Match.when({ type: "select", multiple: false }, (f) => f.value)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const getValue = (field: AnyField) =>
  pipe(
    Match.value(field),
    Match.when({ type: "number" }, (field) => String(field.value)),
    Match.when({ type: "text" }, (field) => field.value),
    Match.when({ type: "select", multiple: true }, (field) => field.value.join(", ")),
    Match.when({ type: "select", multiple: false }, (field) => field.value),
    Match.exhaustive
  );
```

</details>

---

## Traiter une valeur optionnelle

`Option` représente une valeur qui peut être présente (`Some`) ou absente (`None`). Il est ainsi possible de décrire une séquence au sein de laquelle les `Some` seront traités et les `None` ignorés. En un sens `Option` est une adaptation du _railway pattern_ au cas de l'absence de valeur. Chacun des cas peut ensuite être traité de façon différenciée.

Ici, `Array.get` renvoie un `Option` plutôt qu'un `undefined` silencieux :

<!-- prettier-ignore -->
```typescript
Array.get(colors, 0) // Option<string>
```

`Option.match` permet de traiter les deux cas explicitement :

<!-- prettier-ignore -->
```typescript
pipe(
  Array.get(colors, 0),
  Option.match({
    onSome: (c) => `Primary: ${c}`,
    onNone: () => "transparent"
  })
)
```

### Exercice

Complétez `getValueAt` pour renvoyer la valeur en majuscules si elle existe, ou `"DEFAULT"` sinon :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const getValueAt = (index: number) =>
  pipe(
    allValues,
    Array.get(index),
    Option.match({
      onSome: (v) => v.toUpperCase(),
      onNone: () => "DEFAULT"
    })
  );
```

</details>

---

## Retourner un résultat partiel

Parfois, on ne _veut_ pas couvrir tous les cas — seulement certains. `Match.option` clôt le match en enveloppant le résultat dans un `Option` : `Some` si un cas a matché, `None` sinon.

<!-- prettier-ignore -->
```typescript
type Free = { tier: 'free', annual: number}
type Pro = { tier: 'pro', annual: number}
type Enterprise = { tier: 'enterprise', annual: number}

type Plan = Free | Pro | Enterprise

const getTrialDays = (plan: Plan): Option.Option<number> =>
  pipe(
    Match.value(plan),
    Match.when({ tier: "pro" }, (p) => (p.annual ? 30 : 14)),
    Match.option // ← Option.some(30|14) si "pro", Option.none() sinon
  )
```

### Exercice

Complétez `getDeliveryDays` pour renvoyer le délai uniquement pour `"in_stock"` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
  pipe(
    Match.value(stock),
    Match.when({ status: "in_stock" }, (s) => (s.quantity > 10 ? 2 : 5)),
    Match.option
  );
```

</details>

---

## Discriminer par tag

Quand les variants d'une union ont une propriété `_tag`, `Match.tag` est plus concis que `Match.when({ _tag: "..." })` :

<!-- prettier-ignore -->
```typescript
type OrderPlaced = { _tag: "OrderPlaced"; id: string; total: string }
type PaymentFailed = { _tag: "PaymentFailed"; id: string; reason: string }
type PaymentSucceeded = { _tag: "PaymentFailed"; id: string; amount: number }

type CartStatus = UserSignedUp | OrderPlaced | PaymentFailed

pipe(
  Match.value(cartStatus),
  Match.tag("OrderPlaced", (c) => `Order #${c.id} for ${c.total}€`),
  Match.tag("PaymentFailed", (c) => `Payment ${c.id} failed: ${c.reason}`),
  Match.tag("PaymentSucceeded", (c) => `Payment ${c.id} succeeded: ${c.amount}`),
  Match.exhaustive
)
```

### Exercice

Complétez `describe` pour les trois types de notifications :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const describe = (notif: Notification) =>
  pipe(
    Match.value(notif),
    Match.tag("Email", (n) => `Email to ${n.to}: ${n.subject}`),
    Match.tag("Sms", (n) => `SMS to ${n.phone}: ${n.body}`),
    Match.tag("Push", (n) => `Push on ${n.deviceId}: ${n.title}`),
    Match.exhaustive
  );
```

</details>

---

## Définir un cas par défaut

Quand on ne _peut_ pas couvrir tous les cas (type `string` ouvert, valeurs inconnues), `Match.orElse` joue le rôle du `default` dans un `switch/case` :

<!-- prettier-ignore -->
```typescript
type Locale = 'fr' | 'en' | 'es' | 'de' | 'nl'

pipe(
  Match.value(locale),
  Match.when("fr", () => "Bonjour"),
  Match.when("es", () => "Hola"),
  Match.when("de", () => "Hallo"),
  Match.orElse(() => "Hello") // attrape tout les cas non couverts
)
```

### Exercice

Complétez `getProcessingFee` avec trois cas explicites et un fallback :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const getProcessingFee = (method: PaymentMethod): string =>
  pipe(
    Match.value(method),
    Match.when("card", () => "1.5%"),
    Match.when("paypal", () => "2.9%"),
    Match.when("crypto", () => "0%"),
    Match.orElse(() => "unknown method, default fee: 3%")
  );
```

</details>

---

## Exclure un cas spécifique

Pour matcher "tout sauf X", `Match.not` exclut une valeur spécifique :

<!-- prettier-ignore -->
```typescript
type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

pipe(
  Match.value(day),
  Match.not("Sunday", () => "working day"),
  Match.orElse(() => "day off")
)
```

### Exercice

Implémentez `isTrackable` : une commande est traçable sauf si elle est `"cancelled"` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const isTrackable = (status: OrderStatus) =>
  pipe(
    Match.value(status),
    Match.not("cancelled", () => true),
    Match.orElse(() => false)
  );
```

</details>

---

## Regrouper plusieurs valeurs dans une même branche

`Match.whenOr` est un raccourci pour plusieurs `Match.when` qui renvoient la même chose :

<!-- prettier-ignore -->
```typescript
type Environment = 'testing' | 'staging' | 'production'

// Équivalent à deux Match.when séparés
Match.whenOr("testing", "staging", () => mockDatabase)
```

### Exercice

`canAccessDashboard` renvoie `true` uniquement pour `"admin"` et `"superAdmin"` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const canAccessDashboard = (role: Role) =>
  pipe(
    Match.value(role),
    Match.whenOr("admin", "superAdmin", () => true),
    Match.orElse(() => false)
  );
```

</details>

---

## Matcher sur des types primitifs

Pour matcher sur des types primitifs, `Match` fournit des prédicats prêts à l'emploi :

<!-- prettier-ignore -->
```typescript
pipe(
  Match.value(config),
  Match.when(Match.null, () => "not set"),
  Match.when(Match.boolean, (b) => (b ? "enabled" : "disabled")),
  Match.when(Match.number, (n) => `${n} items`),
  Match.when(Match.string, (s) => `"${s}"`),
  Match.exhaustive
)
```

### Exercice

Complétez `formatForDisplay` pour les quatre types de `FieldValue` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const formatForDisplay = (value: FieldValue) =>
  pipe(
    Match.value(value),
    Match.when(Match.null, () => "—"),
    Match.when(Match.boolean, (b) => (b ? "Oui" : "Non")),
    Match.when(Match.number, (n) => n.toLocaleString("fr-FR")),
    Match.when(Match.string, (s) => s),
    Match.exhaustive
  );
```

</details>
