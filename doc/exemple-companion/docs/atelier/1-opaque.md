---
sidebar_position: 1
---

# Exercice 1

## Problème du typage structurel

Rien ne ressemble plus à un id qu'un autre id

```ts
type UserId = string;

type CompanyId = string;
```

Dans l'exemple ci-dessus, même si nous créons des alias du type `string`, pour mieux représenter le métier dans notre code, les types `UserId` et `CompanyId` sont interchangeables et le compilateur ne pourra pas vous prévenir d'erreurs potentielles.

```ts
function getUser(userId: UserId) {
  // some logic
}

const id: CompanyId = "1be076b0-31f7-448e-a7c4-14f5b5dd0437";
getUser(id);
```

L'exemple ci-dessus est complètement valide à la compilation 😱.
On se doute bien que ça ne va pas aussi bien se passer à l'exécution...

## Comment les types opaques peuvent ils nous aider ?

Les types opaques (aussi connus sous le nom _branded types_) permettent de créer des types distincts pour que le compilateur puisse garantir la bonne utilisation de chaque type dans toute notre base de code 💪

```ts
type UserId = Opaque<string, "user">;

type CompanyId = Opaque<string, "company">;

function getUser(userId: UserId) {
  // some logic
}

const id = "1be076b0-31f7-448e-a7c4-14f5b5dd0437" as CompanyId;
getUser(id);
//      ^? Argument of type 'CompanyId' is not assignable to parameter of type 'UserId'.
```

## Exercice

La création du type `Opaque` n'est pas évidente et nous vous la donnons (c'est volontairement une version simplifiée pour ne pas vous embrouiller). Nous allons créer un type utilitaire `UUID` qui va se servir du type opaque.

Rendez-vous dans le fichier `1-opaque.ts` et `utils.ts` pour l'implémentation.

À vous de jouer !

:::tip Ressources

- [Typage structurel](../typescript/typage-structurel.md)
- [Types génériques](../typescript/generic.md)
- [Template literal](../typescript/template-literal.md)

:::

## Indice 1

<details>
  <summary>N'oubliez pas que le systeme de type est un langage</summary>

Essayer d'imaginer l'implémentation si `UUID` et `Opaque` étaient des fonctions JavaScript.

</details>

## Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter ! </summary>

    ```ts
    export type UUID<T extends string> = Opaque<string, `${T}_uuid`>;
    ```

</details>
