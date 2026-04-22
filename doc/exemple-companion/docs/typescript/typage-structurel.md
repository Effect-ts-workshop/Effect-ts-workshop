---
sidebar_position: 1
---

# Typage structurel

Pour savoir si deux types sont équivalents, il existe plusieurs systèmes de types. Par exemple, le langage C++ utilise le système de type nominatif, OCaml le système de duck typing.

TypeScript se base sur un système de type structurel, c'est-à-dire qu'un type est défini par sa structure et non son nom. La comparaison se fera au moment de la compilation, regardons ce que ça implique au niveau du code.

```ts
type User = {
  name: string;
};

type Admin = {
  name: string;
  isAdmin: boolean;
};

user.firstName;
// ^? TS erreur de compilation.

type Result = user extends admin ? "Ok" : "Not ok";
// ^? type Result = 'Not ok', la propriété isAdmin est manquante

type Result2 = admin extends user ? "Ok" : "Not ok";
// ^? type Result2 = 'Ok'
```
