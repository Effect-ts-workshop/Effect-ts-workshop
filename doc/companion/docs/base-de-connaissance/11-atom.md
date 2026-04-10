---
sidebar_position: 11
---

# Atom et Registry

## Qu'est-ce qu'un Atom ?

Un **Atom** est la brique de base du state management dans `@effect-atom/atom-react`. C'est une unité de state réactive :

- il **stocke** une valeur (ou un calcul dérivé d'autres Atoms)
- quand sa valeur change, tous ses **abonnés sont notifiés**
- il s'intègre naturellement avec Effect (un Atom peut contenir un `Effect`)

C'est l'équivalent d'un `signal` (SolidJS), d'un `atom` (Jotai) ou d'un `ref` (Vue) — mais pensé pour fonctionner avec Effect.

## La Registry

Tous les Atoms vivent dans une **Registry**. C'est le conteneur qui stocke les valeurs et gère les abonnements.

```typescript
import { Registry } from "@effect-atom/atom-react";

const r = Registry.make();
```

Dans une application React, la Registry est fournie par `<RegistryProvider>` (dans `packages/app/src/main.tsx`). Dans les tests, on la crée directement.

## Créer et manipuler des Atoms

### Valeur statique

```typescript
import { Atom } from "@effect-atom/atom-react";

const counter = Atom.make(0);

r.get(counter);     // → 0
r.set(counter, 42);
r.get(counter);     // → 42
```

### Valeur dérivée (computed)

Un Atom peut être calculé à partir d'autres Atoms. Il se recalcule automatiquement quand ses dépendances changent.

```typescript
const counter = Atom.make(0);
const doubled = Atom.make((get) => get(counter) * 2);
// Ou avec le raccourci :
const doubled = Atom.map(counter, (v) => v * 2);

r.set(counter, 9);
r.get(doubled); // → 18
```

### Atom depuis un Effect

Quand on passe un `Effect` à `Atom.make`, la valeur devient un **`Result`** :

```typescript
const dataAtom = Atom.make(Effect.succeed(42));

const value = r.get(dataAtom);
// value est un Result<number, unknown>
```

C'est exactement ce que fait `ApiClient.query(...)` : un Atom construit depuis un Effect HTTP.

### Atom avec transformation (`fnSync`)

`Atom.fnSync` crée un Atom "callable" : chaque `r.set` exécute la fonction avec la valeur passée pour produire la prochaine valeur.

```typescript
const increment = (count: number) => count + 1;
const next = Atom.fnSync(increment, { initialValue: 0 });

r.set(next, 0); // appelle increment(0) → stocke 1
r.get(next);    // → 1
```

## S'abonner aux changements

```typescript
const counter = Atom.make(0);

r.subscribe(counter, (newValue) => {
  console.log("nouvelle valeur :", newValue);
});

r.set(counter, 9); // → "nouvelle valeur : 9"
```

`r.subscribe` retourne une fonction de désabonnement à appeler lors du cleanup.

## `Atom.keepAlive` — persistance sans abonnés

Par défaut, un Atom sans abonné peut être collecté par le garbage collector. `Atom.keepAlive` force sa persistance :

```typescript
const persistent = Atom.keepAlive(Atom.make(0));

r.set(persistent, 9);
await Promise.resolve(); // laisse le GC tourner
r.get(persistent);       // → 9 (toujours là)
```

:::tip Quand utiliser `keepAlive` ?
Pour les Atoms qui doivent persister entre deux rendus React — par exemple, un état global partagé entre plusieurs composants non montés simultanément.
:::

## Utilisation dans React

### Lire une valeur : `useAtomValue`

```typescript
import { useAtomValue } from "@effect-atom/atom-react";

const counter = Atom.make(42);

function MonComposant() {
  const value = useAtomValue(counter);
  return <div>{value}</div>;
}
```

Le composant se re-rend automatiquement quand l'Atom change.

### Lire et écrire : `useAtom`

```typescript
import { useAtom } from "@effect-atom/atom-react";

function Compteur() {
  const [value, setValue] = useAtom(counter);
  return (
    <button onClick={() => setValue((v) => v + 1)}>
      {value}
    </button>
  );
}
```

`useAtom` retourne un tuple `[valeur, setter]`, identique au `useState` de React.

### Écrire seulement : `useAtomSet`

```typescript
import { useAtomSet } from "@effect-atom/atom-react";

function BoutonIncrément() {
  const setValue = useAtomSet(counter);
  return <button onClick={() => setValue((v) => v + 1)}>+</button>;
}
```

`useAtomSet` ne provoque pas de re-rendu — le composant ne lit pas la valeur.

## Lien avec `AtomHttpApi.Tag`

`AtomHttpApi.Tag` n'est qu'une surcouche qui crée automatiquement des Atoms depuis les endpoints d'une API :

```typescript
// Ce que AtomHttpApi.Tag fait en interne (simplifié)
const allItemsAtom = Atom.make(
  HttpApiClient.make(Api, { baseUrl }).pipe(
    Effect.flatMap((client) => client.items.getAllItems())
  )
);
```

C'est pourquoi `useAtomValue(ApiClient.query(...))` retourne un `Result` — c'est le même mécanisme que `Atom.make(Effect.succeed(...))`.
