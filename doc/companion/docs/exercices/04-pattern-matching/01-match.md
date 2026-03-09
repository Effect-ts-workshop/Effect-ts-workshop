---
sidebar_position: 1
---

# Exercice 9 — Pattern Matching

## Le problème du switch/if classique

Vous avez probablement écrit du code comme ça :

```typescript
type Statut = "chargement" | "succès" | "erreur";

function afficher(statut: Statut, données?: Item[]): string {
  if (statut === "chargement") return "Chargement...";
  if (statut === "succès") return `${données?.length} articles`;
  if (statut === "erreur") return "Une erreur est survenue";
  // Et si on ajoute un cas "timeout" plus tard ? Le compilateur ne dit rien !
  return "?";
}
```

Le problème : si vous ajoutez un nouveau cas à `Statut`, le compilateur ne vous avertit pas que vous avez oublié de le gérer.

## Le Pattern Matching avec `Match`

Effect fournit le module `Match` pour une gestion exhaustive des cas :

```typescript
import { Match } from "effect";

type Statut = "chargement" | "succès" | "erreur";

const afficher = (statut: Statut): string =>
  Match.value(statut).pipe(
    Match.when("chargement", () => "Chargement..."),
    Match.when("succès", () => "Succès !"),
    Match.when("erreur", () => "Erreur !"),
    Match.exhaustive // ✅ Compile seulement si tous les cas sont couverts
  );
```

`Match.exhaustive` force TypeScript à vérifier que **tous les cas sont gérés**. Si vous ajoutez `"timeout"` à `Statut`, le code **ne compile plus** jusqu'à ce que vous ajoutiez le cas correspondant.

:::tip `Match.exhaustive` vs `Match.orElse`
- `Match.exhaustive` — compile uniquement si tous les cas sont couverts
- `Match.orElse(() => valeurParDéfaut)` — fournit un cas par défaut pour les cas non listés
:::

## Le type `Option` — une absence typée

Avant d'aller plus loin avec le matching, parlons d'`Option`.

En TypeScript classique, l'absence de valeur s'exprime avec `null` ou `undefined`. Le problème : rien dans le type ne vous force à vérifier si la valeur est présente.

```typescript
function trouverItem(id: string): Item | undefined {
  return items.find(i => i.id === id);
}

const item = trouverItem("123");
console.log(item.brand); // 💥 TypeError si item est undefined !
```

Effect fournit `Option` pour représenter une valeur qui peut être absente :

```typescript
import { Option } from "effect";

// Option.some → valeur présente
const présent: Option.Option<number> = Option.some(42);

// Option.none → valeur absente
const absent: Option.Option<number> = Option.none();
```

## Matcher sur un `Option`

```typescript
import { Option } from "effect";

type Item = { id: string; brand: string; model: string };

const trouverItem = (id: string, items: Item[]): Option.Option<Item> => {
  const trouvé = items.find((i) => i.id === id);
  return trouvé ? Option.some(trouvé) : Option.none();
};

// Matcher le résultat
const afficherItem = (optionItem: Option.Option<Item>): string =>
  Option.match(optionItem, {
    onNone: () => "Article non trouvé",
    onSome: (item) => `${item.brand} - ${item.model}`,
  });
```

:::info `Option.match` vs `Match.value`
`Option.match` est spécialisé pour `Option` et plus lisible dans ce cas.
`Match.value` est plus générique et peut correspondre à n'importe quel type.
:::

## Lien avec l'application finale

Dans `packages/api/http.ts`, l'endpoint `getItemById` retourne un `Option<Item>` :

```typescript
// packages/shared/item.ts
export const getItemByIdResponseSchema = Schema.Option(InventoryItemSchema);
```

Et dans `packages/app/views/itemDetail/ItemDetail.tsx`, l'UI gère les deux cas :

```typescript
// ItemDetail.tsx (simplifié)
Option.match(item, {
  onNone: () => <p>Article non trouvé</p>,
  onSome: (item) => <ItemCard item={item} />,
})
```

## Matcher des types complexes

`Match` peut aussi matcher sur des structures de données et des types discriminants :

```typescript
import { Match } from "effect";

type Résultat =
  | { type: "succès"; données: Item[] }
  | { type: "erreur"; message: string }
  | { type: "chargement" };

const afficherRésultat = (résultat: Résultat): string =>
  Match.value(résultat).pipe(
    Match.when({ type: "succès" }, ({ données }) =>
      `${données.length} article(s) chargé(s)`
    ),
    Match.when({ type: "erreur" }, ({ message }) => `Erreur : ${message}`),
    Match.when({ type: "chargement" }, () => "Chargement en cours..."),
    Match.exhaustive
  );
```

## Exercice

L'API de l'atelier peut retourner un `Option<Item>` pour un item cherché par ID.

**Objectif :**
1. Utiliser `Option` pour représenter le résultat de `trouverItemParId`.
2. Afficher un message différent selon que l'item est trouvé ou non.
3. Bonus : utiliser `Match.value` avec `Match.exhaustive` pour gérer un type union.

:::tip Ressources

- [Pattern Matching](../../base-de-connaissance/06-pattern-matching.md)

:::

## Indice 1

<details>
  <summary>Créer la fonction avec Option</summary>

```typescript
import { Option } from "effect";

type Item = { id: string; brand: string; model: string };

const items: Item[] = [
  { id: "1", brand: "Nike", model: "Air Max" },
  { id: "2", brand: "Adidas", model: "Stan Smith" },
];

const trouverItemParId = (id: string): Option.Option<Item> => {
  const trouvé = items.find((i) => i.id === id);
  return Option.fromNullable(trouvé); // Convertit undefined → Option.none()
};
```

</details>

## Indice 2

<details>
  <summary>Matcher le résultat</summary>

```typescript
const message = Option.match(trouverItemParId("1"), {
  onNone: () => "Non trouvé",
  onSome: (item) => `Trouvé : ${item.brand} ${item.model}`,
});
```

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

```typescript
import { Option, Match } from "effect";

type Item = { id: string; brand: string; model: string };

const items: Item[] = [
  { id: "1", brand: "Nike", model: "Air Max" },
  { id: "2", brand: "Adidas", model: "Stan Smith" },
];

// 1. Utiliser Option
const trouverItemParId = (id: string): Option.Option<Item> =>
  Option.fromNullable(items.find((i) => i.id === id));

// 2. Afficher avec Option.match
const afficherItem = (id: string): string =>
  Option.match(trouverItemParId(id), {
    onNone: () => `Aucun article avec l'id "${id}"`,
    onSome: (item) => `✅ ${item.brand} - ${item.model}`,
  });

console.log(afficherItem("1")); // ✅ Nike - Air Max
console.log(afficherItem("99")); // Aucun article avec l'id "99"

// 3. Bonus : Match.value avec type union
type ÉtatPage =
  | { type: "chargement" }
  | { type: "succès"; items: Item[] }
  | { type: "erreur"; message: string };

const afficherPage = (état: ÉtatPage): string =>
  Match.value(état).pipe(
    Match.when({ type: "chargement" }, () => "⏳ Chargement..."),
    Match.when({ type: "succès" }, ({ items }) =>
      items.length === 0
        ? "📭 Aucun article"
        : `📦 ${items.length} article(s)`
    ),
    Match.when({ type: "erreur" }, ({ message }) => `❌ Erreur : ${message}`),
    Match.exhaustive // Compile seulement si tous les cas sont couverts !
  );

console.log(afficherPage({ type: "chargement" }));
console.log(afficherPage({ type: "succès", items }));
console.log(afficherPage({ type: "erreur", message: "Réseau indisponible" }));
```

</details>
