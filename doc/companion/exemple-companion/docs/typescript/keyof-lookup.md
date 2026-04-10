---
sidebar_position: 7
---

# Keyof et lookup type

## Keyof

L'opérateur `keyof` permet d'accéder aux clés des propriétés d'un objet.

:::info
À ne pas confondre, Object.keys vous permettra de récupérer la valeur des clés de propriétés d'un objet, tant dis que keyof vous permettra de récupérer le typage de ces dernières.
:::

### Utilisation courante

La plupart du temps, vous voudrez l'utiliser lors de la transformation d'un type avec un [mapped type](./mapped-types.md) ou pour appliquer des contraintes sur un type generique.

Grâce à cet opérateur, vous pourrez récupérer les clés d'un objet

```ts
type Workshop = { name: string; schedule: number };
type WorkshopKeys = keyof Workshop;
//       ^? type WorkshopKeys =  "name" | "schedule"
```

Autre exemple :

```ts
type Foo = {
  bar: string;
  bie: number;
};
type Keys = keyof Foo;
//    ^? type Keys = "bar" | "bie"
type Bar = Foo["bar"];
//    ^? type Bar = string
```

Il est aussi possible de l'utiliser sur des tableaux.

```ts
type Foo = ["bar", "bie"];
type Keys = keyof Foo;
//    ^? type Keys = number | typeof Symbol.iterator | typeof Symbol.unscopables | "0" | "1" | "length" | "toString" | "toLocaleString" | "pop" | "push" | "concat" | "join" | "reverse" | ... 23 more ... | "at"
type Result = Foo["length"];
//    ^? type Result = 2
type Result2 = Foo[number];
//    ^? type Result2 = "bar" | "bie"
type Result3 = Foo["0"];
//    ^? type Result3 = "bar"
```

### Bon à savoir

`keyof` peut être utilisé sur n'importe quel type.

```ts
type Foo = "barbie";
type Keys = keyof Foo;
//    ^? type Keys = number | typeof Symbol.iterator | "toString" | "charAt" | "charCodeAt" | "concat" | "indexOf" | "lastIndexOf" | "localeCompare" | "match" | "replace" | "search" | "slice" | ... 37 more ... | "at"
type Result = Foo["indexOf"];
//    ^? type Result = (searchString: string, position?: number) => number
```

#### Sur des clés typées

Depuis un `Record`, si la signature des index est de type `string` ou `number` keyof retournera ces types.

```ts
type NumberIndexed = { [n: number]: unknown };
type NumberIndexedKeys = keyof NumberIndexed; // number
```

Attention, en Javascript les clés des objets sont toujours forcée en chaînes de caractère (`obj[0]` et `obj["0"]`sont équivalents) aussi, la signature d'une clé typée comme une chaîne de caractères sera en fait `string | number`

```ts
type StringIndexed = { [n: string]: unknown };
type StringIndexedKeys = keyof StringIndexed;
//        ^? type StringIndexedKeys = string | number
```

## Lookup type

La syntaxe est `T[Y]`, où `Y` est une clé de `T` permet d'accéder au type des propriétés d'un objet.
Par exemple :

```ts
type Workshop = { name: string; schedule: number };
type WorkshopName = Workshop["name"];
//        ^? type WorkshopName = string
```
