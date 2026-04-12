---
sidebar_position: 11
---

# Exercice 11 — Atom

Gérer l'état d'une application React, c'est souvent choisir entre une variable globale (difficile à tester), du prop drilling (bruyant à propager) ou un store centralisé (verbeux à configurer).

`Atom` est une primitive plus simple : une unité de state réactive et isolée. Quand sa valeur change, tous ses abonnés sont notifiés automatiquement. Cet exercice explore le mécanisme de base, puis son intégration React.

Fichier à compléter : `packages/app/_exercices/11-atom.spec.tsx`

---

## Partie 1 — Atom core

### `Atom.make` — créer un état

Un `Atom` est une unité de state. On le lit et le modifie via un `Registry` :

<!-- prettier-ignore -->
```typescript
const temperature = Atom.make(20)

const r = Registry.make()
r.get(temperature)    // 20
r.set(temperature, 25)
r.get(temperature)    // 25
```

### Exercice

Créez un atom `counter` initialisé à `0` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const counter = Atom.make(0)
```

</details>

---

### `r.set` — mettre à jour un état

`r.set` remplace la valeur courante d'un atom. Tous ses abonnés sont notifiés :

<!-- prettier-ignore -->
```typescript
const score = Atom.make(0)
r.set(score, 100)
r.get(score) // 100
```

### Exercice

Mettez `counter` à `1` via le registry `r` :

<!-- prettier-ignore -->
```typescript
const counter = Atom.make(0)
??? // À compléter
expect(r.get(counter)).toEqual(1)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
r.set(counter, 1)
```

</details>

---

### Atoms dérivés — computed values

Un atom peut _dériver_ sa valeur d'autres atoms. La fonction reçoit `get` pour lire d'autres atoms :

<!-- prettier-ignore -->
```typescript
const price = Atom.make(100)
const priceWithTax = Atom.make((get) => get(price) * 1.2)

r.set(price, 50)
r.get(priceWithTax) // 60 — recalculé automatiquement
```

### Exercice

Créez `doubled`, un atom dérivé qui vaut toujours `counter * 2` :

<!-- prettier-ignore -->
```typescript
const counter = Atom.make(0)
const doubled = ??? // À compléter

r.set(counter, 9)
expect(r.get(doubled)).toEqual(18)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const doubled = Atom.make((get) => get(counter) * 2)
```

</details>

---

### `Atom.map` — transformer un atom

`Atom.map` est un raccourci pour créer un atom dérivé avec une transformation simple :

<!-- prettier-ignore -->
```typescript
const celsius = Atom.make(0)
const fahrenheit = Atom.map(celsius, (c) => c * 9 / 5 + 32)
// équivalent à Atom.make((get) => get(celsius) * 9 / 5 + 32)
```

### Exercice

Créez `doubled` avec `Atom.map` :

<!-- prettier-ignore -->
```typescript
const doubled = ??? // À compléter
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const doubled = Atom.map(counter, (v) => v * 2)
```

</details>

---

### `Atom.fnSync` — atom de fonction

`Atom.fnSync` crée un atom dont la valeur est le _résultat_ d'une fonction appliquée à son état :

<!-- prettier-ignore -->
```typescript
const uppercase = (s: string) => s.toUpperCase()
const label = Atom.fnSync(uppercase, { initialValue: "" })

r.set(label, "hello")   // appelle uppercase("hello")
r.get(label)            // "HELLO"
```

### Exercice

Créez `next` avec `Atom.fnSync` et la fonction `increment` :

<!-- prettier-ignore -->
```typescript
const increment = (count: number) => count + 1
const next = ??? // À compléter

r.set(next, 0)
expect(r.get(next)).toEqual(1)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const next = Atom.fnSync(increment, { initialValue: 0 })
```

</details>

---

### Atoms avec Effects

Un atom peut contenir un `Effect`. Le registry l'exécute et stocke le résultat sous forme de `Result` :

<!-- prettier-ignore -->
```typescript
const configAtom = Atom.make(Effect.succeed({ debug: true }))

const value: Result.Result<{ debug: boolean }, unknown> = r.get(configAtom)
// Result.Success si l'Effect a réussi
```

### Exercice

Créez un atom à partir de `Effect.succeed(2)` :

<!-- prettier-ignore -->
```typescript
const counter = ??? // À compléter

const value: Result.Result<number, unknown> = r.get(counter)
if (!Result.isSuccess(value)) throw new Error("fail")
expect(value.value).toEqual(2)
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const counter = Atom.make(Effect.succeed(2))
```

</details>

---

### `r.subscribe` — réagir aux changements

Pour être notifié quand un atom change, on s'y abonne avec `r.subscribe` :

<!-- prettier-ignore -->
```typescript
r.subscribe(temperature, (newValue) => {
  console.log("new value:", newValue)
})
```

### Exercice

Abonnez `listener` aux changements de `counter` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
r.subscribe(counter, listener)
```

</details>

---

### `Atom.keepAlive` — persister sans abonné

Par défaut, un atom sans abonné peut être garbage-collecté. `Atom.keepAlive` garantit que la valeur persiste même sans listener :

<!-- prettier-ignore -->
```typescript
const temporaryAtom = Atom.make(0)
const persistentAtom = Atom.keepAlive(temporaryAtom)
```

### Exercice

Créez `aliveAtom` à partir de `initialAtom` avec `Atom.keepAlive` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const aliveAtom = Atom.keepAlive(initialAtom)
```

</details>

---

## Partie 2 — Atom React

### `useAtomValue` — lire un atom dans un composant

`useAtomValue` abonne le composant à l'atom. Quand l'atom change, le composant re-render automatiquement :

<!-- prettier-ignore -->
```typescript
const themeAtom = Atom.make("light")

function ThemeDisplay() {
  const theme = useAtomValue(themeAtom)
  return <div>{theme}</div>
}
```

### Exercice

Lisez la valeur de `atom` avec `useAtomValue` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const value = useAtomValue(atom)
```

</details>

---

### `useAtom` — lire et écrire

`useAtom` retourne `[value, setter]` — comme `useState`, mais pour un atom partagé :

<!-- prettier-ignore -->
```typescript
const [isOpen, setIsOpen] = useAtom(modalAtom)
setIsOpen(() => true) // mise à jour fonctionnelle
```

### Exercice

Utilisez `useAtom` pour lire et mettre à jour `counter` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const [value, setValue] = useAtom(atom)
```

</details>

---

### `AtomHttpApi.Tag` — des atoms générés depuis une API

Maintenant qu'on comprend les atoms, on peut regarder ce que `AtomHttpApi.Tag` fait par-dessus : il crée automatiquement des atoms à partir des endpoints d'une API HTTP et gère les états `loading`, `success` et `error` via un `Result` :

<!-- prettier-ignore -->
```typescript
class WeatherClient extends AtomHttpApi.Tag<WeatherClient>()("WeatherClient", {
  api: WeatherApi,
  httpClient: MockedHttpClient,
  baseUrl: "http://weather.mock"
}) {}

function ForecastComponent() {
  const result = useAtomValue(
    WeatherClient.query("forecast", "getToday", { reactivityKeys: ["forecast"] })
  )

  return Result.builder(result)
    .onInitial(() => <div>Loading...</div>)
    .onSuccess(({ forecast }) => <div>{forecast.summary}</div>)
    .render()
}
```

`Result.builder` offre un pattern matching sur l'état de la requête (`initial`, `loading`, `success`, `failure`).

### Exercice

Lisez l'atom de query avec `useAtomValue` pour `DemoClient.query("items", "getAllItems", ...)` :

<!-- prettier-ignore -->
```typescript
function TestComponent() {
  const result = ??? as Result.Result<{ items: any[] }, any> // À compléter
  // ...
}
```

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const result = useAtomValue(
  DemoClient.query("items", "getAllItems", { reactivityKeys: ["items"] })
)
```

</details>
