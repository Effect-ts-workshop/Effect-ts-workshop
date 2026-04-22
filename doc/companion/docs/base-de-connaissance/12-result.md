---
sidebar_position: 12
---

# Result

## Qu'est-ce que `Result` ?

`Result` est un type qui représente l'état d'une opération **asynchrone** - typiquement un appel réseau ou un Effect long. Result est fourni via `@effect-atom/atom-react`. Il a trois états possibles :

| État                | Signification                          |
| ------------------- | -------------------------------------- |
| `Result.Initial`    | Pas encore lancé (état de départ)      |
| `Result.Success<A>` | Terminé avec succès, valeur disponible |
| `Result.Failure<E>` | Terminé en erreur                      |

C'est le type retourné par `useAtomValue` quand l'Atom contient un `Effect` :

<!-- prettier-ignore -->
```typescript
const dataAtom = Atom.make(Effect.succeed(42));
const value = r.get(dataAtom);
// value : Result<number, unknown>
```

## Tester l'état

<!-- prettier-ignore -->
```typescript
import { Result } from "@effect-atom/atom-react";

if (Result.isInitial(value)) {
  // pas encore de données
}

if (Result.isSuccess(value)) {
  console.log(value.value); // la donnée
}

if (Result.isFailure(value)) {
  console.log(value.cause); // l'erreur
}
```

## Utilisation dans les composants React

Le pattern classique dans un composant :

<!-- prettier-ignore -->
```typescript
function InventoryList() {
  const result = useAtomValue(
    ApiClient.query("items", "getAllItems", { reactivityKeys: ["items"] })
  );

  if (Result.isSuccess(result)) {
    return <ul>{result.value.items.map(item => <li>{item.brand}</li>)}</ul>;
  }

  return <div>Chargement...</div>;
}
```

## `Result.builder` - rendu déclaratif

`Result.builder` permet de décrire le rendu pour chaque état sans if/else imbriqués :

<!-- prettier-ignore -->
```typescript
import { Result } from "@effect-atom/atom-react";

function DataComponent() {
  const result = useAtomValue(dataAtom);

  return Result.builder(result)
    .onInitial(() => <div>Chargement initial...</div>)
    .onSuccess((data) => <div>{data.name}</div>)
    .onFailure((error) => <div>Erreur : {String(error)}</div>)
    .render();
}
```

`.render()` appelle le callback correspondant à l'état courant et retourne le JSX.

:::tip `onInitial` vs loading spinner
`onInitial` correspond à l'état avant le premier chargement. Si vous voulez afficher un spinner aussi lors des rechargements (après une mutation), utilisez `Result.isPending` qui couvre les deux cas.
:::

## Différence avec `Either` et `Exit`

Effect propose plusieurs types pour représenter un résultat. Voici comment choisir :

| Type           | Contexte d'utilisation                                          |
| -------------- | --------------------------------------------------------------- |
| `Either<A, E>` | Résultat synchrone qui peut réussir ou échouer                  |
| `Exit<A, E>`   | Comment une Fiber s'est terminée (succès, erreur, interruption) |
| `Result<A, E>` | État d'un Atom asynchrone (initial / success / failure)         |
| `Option<A>`    | Valeur qui peut être absente (`Some` ou `None`)                 |

`Result` est spécifique à `@effect-atom/atom-react`. `Either`, `Exit` et `Option` font partie du package `effect` de base.
