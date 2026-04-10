---
sidebar_position: 3
---

# Exercice 3

Ça y est, nous avons créé un contexte qui contient le type de notre database 🎉.

Maintenant, nous vous proposons à partir du typage de notre database d'apprendre à sélectionner spécifiquement une table de celle-ci. Pour cela il nous faudra jongler entre les typages de notre database, des tables et de la méthode `selectFrom`.

![selectFrom autocomplete](img/selectFrom_autocomplete.png)

Rendez-vous dans le fichier `3-selectionner-une-table.ts` et `db.ts` pour l'implémentation.

À vous de jouer !

:::tip Ressources

- [Types génériques](../typescript/generic.md)
- [Types conditionnels](../typescript/conditional-types.md)
- [KeyOf & lookup](../typescript/keyof-lookup.md)
- [Hiérarchie des types](../typescript/type-hierarchy.md)

:::

## Indice 1

<details>
  <summary>Les clés sont restées sur la table</summary>
  
  Si l'on souhaite bénéficier d'autocomplétion en invoquant `selectFrom` on peut inférer les noms des tables disponibles à partir du type de notre `Database` courante. Et la valeur adossée à la clé `$db` du _contexte_ est justement de type `Database`.

```ts
type Database = {
  users: UserTable;
  companies: CompanyTable;
};
// les noms des tables sont les clés du type qui représente notre base de données
```

On peut accéder au type de `$db` au moyen d'un _lookup type_ via le type de notre _contexte_.

```ts
const context = buildContext<Database>();
type Context = typeof context;
//    ^? type Context = { $db: Database }
type AccessedType = Context["$db"];
//    ^? AccessedType = Database
```

On peut accéder au type de `$db` au moyen d'un _lookup type_ via le type de notre _contexte_.

</details>

## Indice 2

<details>
  <summary>(encore) quelques clés pour avancer</summary>

Ce qu'on peut imaginer serait d'extraire les noms des tables telles qu'elles existent dans la clé `$db` de notre _contexte_.

Typiquement ici, les noms des tables auxquelles nous pourrions vouloir accéder sont les clés de l'objet en valeur de la clé `$db`. Pour extraire les clés d'un objet, on dispose de l'opérateur `keyof`.

Par exemple :

```ts
type ShopDatabase = {
  products: ProductTable;
  carts: CartTable;
};

type TableNames = keyof ShopDatabase; // "products" | "carts"
```

</details>

## Indice 3

<details>
  <summary>L'embarras du choix</summary>

On voit que `selectFrom` prend en premier paramètre un contexte initialisé avec le type d'une base de donnée. Il pourrait être utile que la signature de `selectFrom` prenne cela en compte.

De part l'attendu de l'exercice précédent le type de retour de `buildContext<DB>()` nous est connu :

```ts
type EmptyContext<DB> = {
  $db: DB;
};
```

Mais nous ne connaissons pas à l'avance `DB`, le type de base de données qui serait _in fine_ consommé par `selectFrom`.

C'est un peu contraignant pour définir la signature de notre fonction de savoir qu'elle devra prendre en charge _n'importe quel_ (any ?) type de base donnée...

</details>

## Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter ! </summary>

    ```ts
    type EmptyContext<DB> = {
      $db: DB;
    };
    type AnyEmptyContext = EmptyContext<any>;

    export const selectFrom = <
      Ctx extends AnyEmptyContext,
      TB extends keyof Ctx["$db"]
    >(
      ctx: Ctx,
      tableName: TB
    ) => ({
      ...ctx,
      _operation: "select" as const,
      _table: tableName,
    });
    ```

</details>
