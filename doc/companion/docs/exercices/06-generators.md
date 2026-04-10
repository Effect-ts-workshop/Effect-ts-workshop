---
sidebar_position: 6
---

# Exercice 6 — Générateurs

Enchaîner des `flatMap` fonctionne, mais cinq niveaux d'imbrication plus tard, le code ressemble à une pyramide. Il existe une autre façon d'écrire la même chose : les générateurs JavaScript.

Cet exercice a deux parties. La première explore les générateurs JS eux-mêmes — pas dans Effect, juste le mécanisme de base. La deuxième montre comment Effect les utilise avec `Effect.fn`.

Fichier à compléter : `packages/api/_exercices/6-generators.spec.ts`

---

## Partie 1 — Générateurs JavaScript

### `function*` et `yield`

Un générateur est une fonction qui peut être mise en _pause_. Chaque `yield` suspend l'exécution et expose une valeur à l'extérieur :

```typescript
function* items() {
  yield "laptop"
  yield "mouse"
  yield "keyboard"
}

const gen = items()
gen.next() // { value: "laptop", done: false }
gen.next() // { value: "mouse", done: false }
gen.next() // { value: "keyboard", done: false }
gen.next() // { value: undefined, done: true }
```

### Exercice

Créez un générateur `items` qui produit `"laptop"`, `"mouse"`, `"keyboard"` dans cet ordre :

```typescript
const items = ??? // À compléter
```

À vous de jouer !

:::tip Ressources

- [Générateurs](../base-de-connaissance/07-generateurs.md)

:::

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
function* items() {
  yield "laptop"
  yield "mouse"
  yield "keyboard"
}
```

</details>

---

### `return` dans un générateur

La valeur `return` d'un générateur apparaît dans le dernier `.next()`, avec `done: true` :

```typescript
function* getBrand(): Generator<string, string, unknown> {
  yield "validating…" // done: false
  return "Apple"      // done: true
}
```

### Exercice

Créez `getBrand` : il `yield` `"validating…"` comme étape intermédiaire, puis `return` `"Apple"` comme valeur finale :

```typescript
const getBrand = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
function* getBrand(): Generator<string, string, unknown> {
  yield "validating…"
  return "Apple"
}
```

</details>

---

### `yield*` — déléguer à un autre générateur

`yield*` délègue l'itération à un sous-générateur : toutes ses valeurs sont produites comme si elles étaient dans le générateur courant.

```typescript
function* brands() {
  yield "Apple"
  yield "Dell"
}

function* models() {
  yield* brands() // produit "Apple" puis "Dell"
  yield "ThinkPad"
}

[...models()] // ["Apple", "Dell", "ThinkPad"]
```

C'est l'équivalent d'un `flatMap` pour les générateurs.

### Exercice

Créez `models` qui délègue à `brands` puis produit `"ThinkPad"` :

```typescript
const models = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
function* models() {
  yield* brands()
  yield "ThinkPad"
}
```

</details>

---

### Injecter une valeur avec `next(value)`

La vraie magie des générateurs : on peut _envoyer_ une valeur dans le générateur via `next(value)`. Cette valeur devient le résultat de l'expression `yield` en cours.

```typescript
function* approveItem(): Generator<string, string, boolean> {
  const approved = yield "Approve this item?" // suspend et expose la question
  return approved ? "Item approved" : "Item rejected"
}

const gen = approveItem()
gen.next()       // { value: "Approve this item?", done: false }
gen.next(true)   // { value: "Item approved", done: true }
//       ^
//  on injecte `true` → approved = true
```

C'est _exactement_ le mécanisme qu'Effect utilise pour injecter les résultats d'Effects dans vos générateurs.

### Exercice

Appelez `gen.next(true)` pour approuver l'item et récupérer le résultat :

```typescript
const gen = approveItem()
const question = gen.next()
const result = ??? // À compléter : répondre "true" au générateur
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const result = gen.next(true)
```

</details>

---

## Partie 2 — `Effect.fn`

### `Effect.fn` — nommer et composer des handlers

`Effect.fn` crée une fonction qui retourne un `Effect`, en utilisant un générateur pour la logique interne.

```typescript
const getItemLabel = Effect.fn("getItemLabel")(function*(brand: string, model: string) {
  const upper = yield* Effect.sync(() => brand.toUpperCase())
  return `${upper} – ${model}`
})

Effect.runSync(getItemLabel("apple", "MacBook Pro")) // "APPLE – MacBook Pro"
```

Le `yield*` à l'intérieur joue le rôle d'`await` : il suspend le générateur jusqu'à ce que l'Effect soit résolu, et injecte le résultat.

C'est la syntaxe utilisée partout dans le projet : `item-repository.ts`, `http.ts`.

### Exercice

Créez `getItemLabel` avec `Effect.fn` :

```typescript
const getItemLabel = ??? // À compléter
// doit : mettre brand en majuscules, renvoyer "${UPPER} – ${model}"
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Squelette `Effect.fn`</summary>

```typescript
const maFonction = Effect.fn("maFonction")(function*(arg1: string, arg2: string) {
  const resultat = yield* Effect.sync(() => /* calcul */)
  return `${resultat} – ${arg2}`
})
```

`Effect.sync` emballe un calcul synchrone (sans Effect existant).

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const getItemLabel = Effect.fn("getItemLabel")(function*(brand: string, model: string) {
  const upper = yield* Effect.sync(() => brand.toUpperCase())
  return `${upper} – ${model}`
})
```

</details>

---

### `Effect.fn` vs `pipe` — la lisibilité avant tout

Les deux écritures suivantes sont équivalentes. La version générateur est souvent plus lisible quand il y a plusieurs étapes :

```typescript
// Avec pipe et flatMap
const fetchJoke = (id: string) =>
  pipe(
    HttpClient.HttpClient,
    Effect.flatMap((client) =>
      pipe(
        client.get(`https://api.chucknorris.io/jokes/${id}`),
        Effect.flatMap((response) =>
          pipe(
            response.json,
            Effect.map((data) => ({ response, data }))
          )
        )
      )
    )
  )

// Avec Effect.fn — même logique, lecture linéaire
const fetchJokeGen = Effect.fn("fetchJokeGen")(function*(id: string) {
  const client = yield* HttpClient.HttpClient
  const response = yield* client.get(`https://api.chucknorris.io/jokes/${id}`)
  const data = yield* response.json
  return { response, data }
})
```

### Exercice

Réécrivez `fetchJoke` avec `Effect.fn` :

```typescript
const fetchJokeGen = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const fetchJokeGen = Effect.fn("fetchJokeGen")(function*(id: string) {
  const client = yield* HttpClient.HttpClient
  const response = yield* client.get(`https://api.chucknorris.io/jokes/${id}`)
  const data = yield* response.json
  return { response, data }
})
```

</details>

---

### Flot de contrôle impératif dans un générateur

Un des grands avantages des générateurs : les boucles, conditions, et `for` fonctionnent naturellement. Pas besoin de `Effect.forEach` ou de récursion pour itérer.

### Exercice

Complétez `buildUsers` pour créer `count` utilisateurs avec une boucle `for` :

```typescript
const buildUsers = Effect.fn(function*(count: number) {
  const users = []
  ??? // À compléter : boucle for qui yield* buildUser() et push dans users
  return users
})
```

À vous de jouer !

#### Indice 1

<details>
  <summary>La syntaxe standard fonctionne</summary>

```typescript
for (let index = 0; index < count; index++) {
  const user = yield* buildUser()
  users.push(user)
}
```

`yield*` dans une boucle `for` — exactement comme un `await` dans un `for` async.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const buildUsers = Effect.fn(function*(count: number) {
  const users = []
  for (let index = 0; index < count; index++) {
    const user = yield* buildUser()
    users.push(user)
  }
  return users
})
```

</details>

---

### Gérer les erreurs dans un générateur

`yield*` propage les erreurs automatiquement. Pour les rattraper sans sortir du générateur, on utilise `Effect.orElse` :

```typescript
const getUser = Effect.fn(function*(id: string) {
  const user = yield* getUserById(id)

  // getUserFriends peut échouer — on fournit un fallback
  const friends = yield* Effect.orElse(
    getUserFriends(id),
    () => Effect.succeed([])
  )

  return { ...user, friends }
})
```

### Exercice

Rattrapez l'échec de `getUserFriends` en renvoyant une liste vide :

```typescript
const getUser = Effect.fn(function*(id: string) {
  const user = yield* getUserById(id)
  const friends = ??? // À compléter
  return { ...user, friends }
})
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const friends = yield* Effect.orElse(
  getUserFriends(id),
  () => Effect.succeed([])
)
```

</details>

---

### Interopérabilité avec d'autres types de données

Effect peut travailler avec des types qui ne sont pas des Effects — `Option`, `Either`, tableaux… via `yield*` et `Effect.catchAll` :

```typescript
const findUser = Effect.fn("findUser")(function*(id: string) {
  const foundUser = Array.findFirst(users, (user) => user.id === id)
  // foundUser est un Option<User>

  const user = yield* Effect.catchAll(foundUser, (error) => new MyDomainError({ error }))
  //            ^
  //     yield* sur un Option : Some(u) → u, None → déclenche le catch
  return user
})
```

### Exercice

Complétez `findUser` pour transformer un `Option.None` en `MyDomainError` :

```typescript
const findUser = Effect.fn("findUser")(function*(id: string) {
  const foundUser = Array.findFirst(users, (user) => user.id === id)
  const user = ??? // À compléter
  return user
})
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const user = yield* Effect.catchAll(foundUser, (error) => new MyDomainError({ error }))
```

</details>
