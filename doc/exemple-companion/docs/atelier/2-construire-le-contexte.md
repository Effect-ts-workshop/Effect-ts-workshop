---
sidebar_position: 2
---

# Exercice 2

Que serait une requête SQL sans database associée et comment les représenter en TypeScript ?

Nous allons créer un contexte qui sera propagé aux différentes fonctions que nous allons créer par la suite. Au fur et à mesure des exercices, nous aurons besoin de l'enrichir, mais pour le moment notre database suffit.

La plupart du temps TypeScript infère le type depuis notre code, mais dans cette partie, **nous allons forcer du typage**.
Attacher le type de notre base de données au contexte nous permettra de pouvoir le propager et l'inspecter pour les fonctions futures

Rendez-vous dans le fichier `2-context-builder.ts` et `db.ts` pour l'implémentation.

À vous de jouer !

:::tip Ressources

- [Types génériques](../typescript/generic.md)
- [Hiérarchie des types](../typescript/type-hierarchy.md)

:::

## Indice 1

<details>
  <summary>Un type générique</summary>

Pour commencer, on voit dans le test qu'on s'attend à ce que l'implémentation de `buildContext` prenne un type en paramètre, un peu comme dans l'exemple ci-après :

```ts
const buildSomething = <T>() => {
  // et on construira quelque chose qui dépend de `T`
};
```

</details>

## Indice 2

<details>
  <summary>C'est Typescript qui a parfois besoin d'un coup de pouce</summary>

Dans le cas présent, nous avons des informations que TypeScript n'a pas _à priori_ (le type de notre base de données). Nous pouvons lui apporter plus de précision au lieu de laisser le compilateur tenter d'en inférer le type.

On parle alors de _type assertion_ ou bien de _type casting_, voire en français d'_affirmation de type_.

Il existe deux syntaxes pour cela, `<>` et le mot-clé `as`. Par exemple, ci-dessous, TypeScript pourrait difficilement connaitre le type d'un élément qu'on extrait du DOM.

```ts
// Nous savons que l'élément avec l'id 'name' est un input HTML mais Typescript ne pouvant le deviner on peut le lui spécifier
const nameInput = document.getElementById("name") as HTMLInputElement;
// ou sinon
const nameInput = <HTMLInputElement>document.getElementById("name");
```

Et dans notre cas :

```ts
const buildContext = () => {
  return {
    $db: undefined, // <= ça pourrait se passer ici...
  };
};
```

Parfois le mot clé `as` (en conjonction avec `any`) peut s'avérer bien utile !
On peut _caster_ `undefined` directement vers le type de notre base de données afin que TypeScript fasse transiter le type dans notre contexte.

</details>

## Solutions

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter ! </summary>

    ```ts

    type EmptyContext<DB> = {
      /*
      * @deprecated type only, do not use at runtime
      */
      $db: DB
    }
  

    export const buildContext = <DB>() => {
      return {} as EmptyContext<DB>;
    };
    ```

    Autre solution

    ```ts

    type EmptyContext<DB> = {
      /*
      * @deprecated type only, do not use at runtime
      */
      $db: DB
    }

    export const buildContext = <DB>() => {
      return {$db: undefined} as EmptyContext<DB>;
    };
    ```

</details>
