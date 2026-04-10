---
sidebar_position: 11
---

# Exercice 11 — Atom

`AtomHttpApi.Tag` de l'exercice précédent gère automatiquement les états loading/success/error pour les appels API. Mais comment fait-il ça ?

Tout repose sur une primitive : `Atom`. Un Atom est une unité de state réactive — quand sa valeur change, tous ses abonnés sont notifiés. Cet exercice explore le mécanisme de base, puis son intégration React.

Fichier à compléter : `packages/app/_exercices/11-atom.spec.tsx`

---

## Partie 1 — Atom core

### `Atom.make` — créer un état

Un `Atom` est une unité de state. On le lit et le modifie via un `Registry` :

```typescript
const counter = Atom.make(0)

const r = Registry.make()
r.get(counter)   // 0
r.set(counter, 1)
r.get(counter)   // 1
```

### Exercice

Créez un atom `counter` initialisé à `0` :

```typescript
const counter = ??? // À compléter
expect(r.get(counter)).toEqual(0)
```

À vous de jouer !

:::tip Ressources

- [Atom](../base-de-connaissance/11-atom.md)

:::

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const counter = Atom.make(0)
```

</details>

---

### `r.set` — mettre à jour un état

### Exercice

Mettez `counter` à `1` via le registry `r` :

```typescript
const counter = Atom.make(0)
??? // À compléter
expect(r.get(counter)).toEqual(1)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
r.set(counter, 1)
```

</details>

---

### Atoms dérivés — computed values

Un atom peut _dériver_ sa valeur d'autres atoms. La fonction reçoit `get` pour lire d'autres atoms :

```typescript
const counter = Atom.make(0)
const doubled = Atom.make((get) => get(counter) * 2)

r.set(counter, 9)
r.get(doubled) // 18 — recalculé automatiquement
```

### Exercice

Créez `doubled`, un atom dérivé qui vaut toujours `counter * 2` :

```typescript
const counter = Atom.make(0)
const doubled = ??? // À compléter

r.set(counter, 9)
expect(r.get(doubled)).toEqual(18)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const doubled = Atom.make((get) => get(counter) * 2)
```

</details>

---

### `Atom.map` — transformer un atom

`Atom.map` est un raccourci pour créer un atom dérivé avec une transformation simple :

```typescript
const doubled = Atom.map(counter, (v) => v * 2)
// équivalent à Atom.make((get) => get(counter) * 2)
```

### Exercice

Créez `doubled` avec `Atom.map` :

```typescript
const doubled = ??? // À compléter
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const doubled = Atom.map(counter, (v) => v * 2)
```

</details>

---

### `Atom.fnSync` — atom de fonction

`Atom.fnSync` crée un atom dont la valeur est le _résultat_ d'une fonction appliquée à son état :

```typescript
const increment = (count: number) => count + 1
const next = Atom.fnSync(increment, { initialValue: 0 })

r.set(next, 0)    // appelle increment(0)
r.get(next)       // 1
```

### Exercice

Créez `next` avec `Atom.fnSync` et la fonction `increment` :

```typescript
const increment = (count: number) => count + 1
const next = ??? // À compléter

r.set(next, 0)
expect(r.get(next)).toEqual(1)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const next = Atom.fnSync(increment, { initialValue: 0 })
```

</details>

---

### Atoms avec Effects

Un atom peut contenir un `Effect`. Le registry l'exécute et stocke le résultat sous forme de `Result` :

```typescript
const counter = Atom.make(Effect.succeed(2))

const value: Result.Result<number, unknown> = r.get(counter)
// Result.Success<number> si l'Effect a réussi
```

### Exercice

Créez un atom à partir de `Effect.succeed(2)` :

```typescript
const counter = ??? // À compléter

const value: Result.Result<number, unknown> = r.get(counter)
if (!Result.isSuccess(value)) throw new Error("fail")
expect(value.value).toEqual(2)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const counter = Atom.make(Effect.succeed(2))
```

</details>

---

### `r.subscribe` — réagir aux changements

Pour être notifié quand un atom change, on s'y abonne avec `r.subscribe` :

```typescript
r.subscribe(counter, (newValue) => {
  console.log("nouvelle valeur :", newValue)
})
```

### Exercice

Abonnez `listener` aux changements de `counter` :

```typescript
const listener = vi.fn()
const counter = Atom.make(0)

??? // À compléter

r.set(counter, 9)
expect(listener).toHaveBeenCalledWith(9)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
r.subscribe(counter, listener)
```

</details>

---

### `Atom.keepAlive` — persister sans abonné

Par défaut, un atom sans abonné peut être garbage-collecté. `Atom.keepAlive` garantit que la valeur persiste même sans listener :

```typescript
const aliveAtom = Atom.keepAlive(initialAtom)
```

### Exercice

Créez `aliveAtom` à partir de `initialAtom` avec `Atom.keepAlive` :

```typescript
const initialAtom = Atom.make(0)
const aliveAtom = ??? // À compléter

r.set(initialAtom, 9)
r.set(aliveAtom, 9)
await Promise.resolve() // laisse le temps au GC
expect(r.get(initialAtom)).toEqual(0) // remis à zéro
expect(r.get(aliveAtom)).toEqual(9)   // persisté
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const aliveAtom = Atom.keepAlive(initialAtom)
```

</details>

---

## Partie 2 — Atom React

### `useAtomValue` — lire un atom dans un composant

`useAtomValue` abonne le composant à l'atom. Quand l'atom change, le composant re-render automatiquement :

```typescript
function TestComponent() {
  const value = useAtomValue(atom)
  return <div>{value}</div>
}
```

### Exercice

Lisez la valeur de `atom` avec `useAtomValue` :

```typescript
const atom = Atom.make(42)

function TestComponent() {
  const value = ??? // À compléter
  return <div data-testid="value">{value}</div>
}
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const value = useAtomValue(atom)
```

</details>

---

### `useAtom` — lire et écrire

`useAtom` retourne `[valeur, setter]` — comme `useState`, mais pour un atom partagé :

```typescript
const [value, setValue] = useAtom(atom)
setValue((v) => v + 1) // mise à jour fonctionnelle
```

### Exercice

Utilisez `useAtom` pour lire et mettre à jour `counter` :

```typescript
function TestComponent() {
  const [value, setValue] = ??? // À compléter
  return (
    <>
      <div data-testid="value">{value}</div>
      <button onClick={() => setValue((v: number) => v + 1)}>increment</button>
    </>
  )
}
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const [value, setValue] = useAtom(atom)
```

</details>

---

### Intégration avec `AtomHttpApi.Tag`

`AtomHttpApi.Tag` crée automatiquement des atoms à partir des endpoints d'une API. L'état est géré par un `Result` :

```typescript
class DemoClient extends AtomHttpApi.Tag<DemoClient>()("DemoClient", {
  api: Api,
  httpClient: MockedHttpClient,
  baseUrl: "http://my-url.mock"
}) {}

function TestComponent() {
  const result = useAtomValue(
    DemoClient.query("items", "getAllItems", { reactivityKeys: ["items"] })
  )

  return Result.builder(result)
    .onInitial(() => <div>Initial loading...</div>)
    .onSuccess(({ items }) => <ul>{items.map(...)}</ul>)
    .render()
}
```

`Result.builder` offre un pattern matching sur l'état de la requête (`initial`, `loading`, `success`, `failure`).

### Exercice

Lisez l'atom de query avec `useAtomValue` pour `DemoClient.query("items", "getAllItems", ...)` :

```typescript
function TestComponent() {
  const result = ??? as Result.Result<{ items: any[] }, any> // À compléter
  // ...
}
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const result = useAtomValue(
  DemoClient.query("items", "getAllItems", { reactivityKeys: ["items"] })
)
```

</details>
