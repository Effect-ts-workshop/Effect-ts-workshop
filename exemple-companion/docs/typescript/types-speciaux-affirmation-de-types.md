---
sidebar_position: 4
---

# Affirmation de types et types spéciaux

### Affirmation de type

L'affirmation de type est aussi appelée `assertion de type`. Il s'agit d'indiquer au compilateur que l'on assigne le type choisit à notre variable.

Il existe deux syntaxes possibles :

- `variable as type` qui utilise l'opérateur `as`, rendez-vous dans la section [Mapped types](../typescript/mapped-types.md) pour en savoir plus.
- `<type>variable`, cette syntaxe utilise les types génériques à découvrir ici, [les Types génériques](../typescript/generic.md)

### les types spéciaux

- `any` qui représente n'importe quel type et qui désactive toute aide que le compilateur pourrait vous apporter: autocomplétion et erreur. Autrement dit, vous indiquez au complateur de ne pas analyser votre variable.
- `unknown` qui représente n'importe quel type et qui vous forcera à verifier son type avant de l'utiliser.
- `never` qui est utilisé pour matérialiser un type impossible.
- `void` peut recevoir que les valeur `null` ou `undefined`, principalement utilisé pour typer les retours de fonction.

:::tip Les relations entre les types

Curieux, curieuse, d'en savoir plus sur comment intéragissent les types entre eux rendez-vous dans la section [hiérarchie des types](./type-hierarchy.md)

:::
