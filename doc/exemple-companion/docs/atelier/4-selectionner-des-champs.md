---
sidebar_position: 4
---

# Exercice 4

Nous vous proposons de typer la fonction `selectFields` qui, à partir du typage de notre database, sera capable d'inférer les noms des champs qu'il est possible de sélectionner au sein d'une table.

![selectFields autocomplete](img/selectFields_autocomplete.png)

Rendez-vous dans le fichier `4-selectionner-des-champs.ts` et `db.ts` pour l'implémentation.

À vous de jouer !

:::tip Ressources

- [Types génériques](../typescript/generic.md)
- [Types conditionnels](../typescript/conditional-types.md)
- [KeyOf & lookup](../typescript/keyof-lookup.md)

:::

## Indice 1

<details>
  <summary>Préciser le contexte</summary>
  
  Comme précédemment, on peut envisager de construire un type intermédiaire pour préciser la signature du _contexte_ passé `selectFields`. À ce stade `selectFields` devra pouvoir être invoqué avec le contexte d'une opération de sélection sur une table membre d'une base de donnée... _donnée_ (**any** ?).

</details>

## Indice 2

<details>
  <summary>Le champ des champs possibles</summary>
  
  Nous sommes dans un cas similaire à l'exercice précédent, simplement cette fois-ci, on veut pouvoir inférer les types de propriétés nichées un peu plus profondément que les noms des tables.

Suite à l'invocation de `selectFrom` on dispose, dans notre _contexte_ d'un peu plus d'information : on sait que nous construisons une opération `select` et surtout quelle table nous allons interroger. Il est alors possible d'extraire, depuis le _contexte_, les ~~types des clés~~ _noms de champs_ de la table ciblée et ainsi faire en sorte que `selectFields` n'accepte en second paramètre qu'un tableau dont les éléments sont des membres de champs de la table cible.

</details>

## Indice 3

<details>
  <summary>La clé des champs</summary>
  
  Il est tout à fait possible de définir un _lookup type_ à partir d'un autre _lookup type_. Notamment ici, nous cherchons à identifier les clés membres d'une table, elle-même membre d'une base de donnée, et ceci afin de spécifier que le second paramètre de `selectFields` est un tableau dont les éléments sont du type desdites clés.

</details>

## Indice 4

<details>
  <summary>Oups !</summary>
  
  Vous avez peut-être une erreur TypeScript dû à un manque de précision sur le type de l'opération telle qu'elle est retournée par `selectFrom` (cf. l'exercice précédent). Dans ce cas, il est utile de préciser au compilateur qu'il doit inférer le type le plus précis à partir de la valeur retournée par `selectFrom`.

</details>

## Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter ! </summary>

    ```ts
    type SelectableContext<DB> = EmptyContext<DB> & {
      _operation: "select";
      _table: keyof DB;
    };
    type AnySelectableContext = SelectableContext<any>;
    export const selectFields = <Ctx extends AnySelectableContext>(
      ctx: Ctx,
      fieldNames: (keyof Ctx["$db"][Ctx["_table"]])[]
    ) => ({
      ...ctx,
      _fields: fieldNames,
    });
    ```

</details>
