---
sidebar_position: 5
---

# Exercice 5

Notre builder de requête SQL progresse, nous sommes maintenant capables de sélectionner des champs d'une table. Ceci étant qui n'a jamais eu besoin de sélectionner tous les champs d'une table ?

Au quotidien, vous avez surement l'habitude d'écrire des requêtes sur un modèle similaire à celui-ci `select * from users`. Dans ce cas le symbole '\*' indique que vous souhaitez récupérer l'ensemble des champs de la table.

Dans le cadre de cet atelier le symbole '\*' va être remplacé pour le mot 'ALL' pour simplifier l'exercice.

Super, maintenant que TypeScript a de moins en moins de secrets pour vous, nous vous proposons de vous plonger dans ce 5ᵉ exercice afin de faire évoluer le typage dans le but de pouvoir sélectionner l'ensemble des champs d'une table. Pour cela rendez-vous dans le fichier `5-selectionner-tous-les-champs.ts` et `db.ts` pour l'implémentation.

À vous de jouer !

:::tip Ressources

- [Types génériques](../typescript/generic.md)
- [Types conditionnels](../typescript/conditional-types.md)
- [Hiérarchie des types](../typescript/type-hierarchy.md)

:::

## Indice 1

<details>
  <summary>Tout ou rien</summary>
  
  On peut réemployer ici le contexte de **sélection** sur une **table** _donnée_. Par contre `selectAll` n'enrichira pas la clé `_fields` du contexte avec un tableau de noms de champs, mais avec le mot-clé `ALL`. Dans ce cas, il faut dire au compilateur d'inférer le type le plus précis possible à partir de cette expression (i.e. le type littéral `ALL`).

</details>

## Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter ! </summary>

    ```ts
    export const selectAll = <Ctx extends AnySelectableContext>(ctx: Ctx) => ({
      ...ctx,
      _fields: "ALL" as const,
    });
    ```

</details>
