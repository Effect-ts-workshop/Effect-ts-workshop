---
sidebar_position: 5
---

# Types par références : Arrays, Tuples et Objets

## Les arrays et les tuples

En TypeScript, les tableaux sont aussi appelés Arrays. Un array est par exemple un tableau de string, de number, de boolean, etc.

:::tip Les deux syntaxes possibles pour écrire le type d'un tableau
Premier cas : `const myArray : type[]`

Deuxième cas : `const myArray : Array<type>`

La syntaxe `<type>` correspond à un type générique, nous vous invitons à parcourir la section dédiée sur [les Types génériques](../typescript/generic.md) pour tout découvrir sur eux !

:::

Si on souhaite stocker des types des différents dans un ordre précis et défini, nous pouvons utiliser des tuples. Un tuple représente une collection de valeurs ordonnées. Par exemple :

```ts
type MyTuple = [string, number, boolean];
const myTuple: MyTuple = ["workshop", 12, true];

const myWrongTuple: MyTuple = [12, "workshop", true];
//          ^? TS type string incompatible avec type number
```

## Les objets

Les objets peuvent être créés avec une classe ou de manière littéral. Pour typer un objet, nous pouvons nous appuyer sur l'inférence ou la déduction de type, en initialisant la valeur. on peut définir le type de chaque clé et préciser si elle est optionnelle ou non à l'aide de l'opérateur '?'. Dans l'exemple ci-dessous la clé "adresse" est optionnelle.

`type User = { name :  string, adresse? : string }`
`const user: User = { name : 'Charlotte' }`

L'opérateur keyof permet d'accéder au type des clés d'un objet et l'opérateur lookup à la valeur d'une clé. Pour en savoir plus sur leur fonctionnement rendez-vous dans la section [Les opérateurs keyof et lookup](../typescript/keyof-lookup.md)
