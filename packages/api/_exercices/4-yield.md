# Comprendre `yield` — du JavaScript classique à Effect.ts

Ce document accompagne le fichier `4-yield.spec.ts`. Il explique pourquoi les tests sont dans cet ordre, ce que chaque test cherche à démontrer, et les concepts sous-jacents.

---

## Pourquoi apprendre `yield` ?

Dans ce projet, tu verras partout des patterns comme :

```ts
// item-repository.ts
const getAll = Effect.fn("getAll")(function*() {
  const items = yield* sql<DbItem>`SELECT * FROM items`
  return items
})

// http.ts
Effect.fn(function*({ payload }) {
  const items = yield* ItemRepository
  yield* items.add(payload)
})
```

Ces `function*` et `yield*` ne sont pas de la magie Effect — c'est du JavaScript standard. Effect s'appuie sur le protocole des générateurs pour offrir une syntaxe proche de `async/await`. Pour comprendre Effect en profondeur, il faut d'abord comprendre ce mécanisme.

---

## Partie 1 — Générateurs JavaScript classiques

### Concept fondamental : qu'est-ce qu'un générateur ?

Une fonction normale s'exécute du début à la fin sans s'arrêter. Un générateur, lui, peut se **mettre en pause** à chaque `yield` et **reprendre** là où il s'est arrêté.

```
fonction normale :  ▶──────────────────▶  fin
générateur :        ▶──pause──▶──pause──▶  fin
                         ↑          ↑
                       yield      yield
```

Le générateur ne s'exécute pas quand tu l'appelles. Il te donne un **objet itérateur**, et c'est `.next()` qui fait avancer l'exécution.

---

### Test 1 — `yield` met le générateur en pause et expose une valeur

```ts
function* items() {
  yield "laptop"   // pause 1
  yield "mouse"    // pause 2
  yield "keyboard" // pause 3
}

const gen = items()
gen.next() // { value: "laptop",   done: false }
gen.next() // { value: "mouse",    done: false }
gen.next() // { value: "keyboard", done: false }
gen.next() // { value: undefined,  done: true  }
```

**Ce qu'il faut retenir :**
- `items()` ne fait rien. Il crée juste un itérateur.
- Chaque `.next()` exécute le code jusqu'au prochain `yield`, puis s'arrête.
- Tant que `done: false`, le générateur n'est pas terminé.
- Quand il n'y a plus de `yield`, `done: true`.

---

### Test 2 — `yield` vs `return` : `done: false` vs `done: true`

```ts
function* getBrand() {
  yield "validating…" // { done: false }
  return "Apple"      // { done: true  }
}
```

**Ce qu'il faut retenir :**
`yield` = "je pause et je donne une valeur intermédiaire"
`return` = "j'ai fini, voici la valeur finale"

C'est important pour Effect : quand tu écris `return someValue` dans un `Effect.gen`, c'est cette valeur finale qui devient le résultat de l'Effect.

---

### Test 3 — `yield*` délègue à un autre générateur

```ts
function* brands() {
  yield "Apple"
  yield "Dell"
}

function* models() {
  yield* brands()   // "entre" dans brands et en yield chaque valeur
  yield "ThinkPad"
}

[...models()] // ["Apple", "Dell", "ThinkPad"]
```

**Ce qu'il faut retenir :**
`yield*` dit "exécute ce générateur à ma place, et retourne-moi sa valeur finale quand il a fini".

C'est **la clé** pour comprendre Effect. Quand tu écris `yield* someEffect`, tu dis à Effect.gen : "exécute cet Effect et donne-moi son résultat".

**Astuce mentale :** `yield*` = "délègue et attends".

---

### Test 4 — `next(value)` : envoyer une valeur dans le générateur

```ts
function* approveItem() {
  const approved = yield "Approve this item?" // pose une question
  return approved ? "Item approved" : "Item rejected"
}

const gen = approveItem()
gen.next()      // démarre → { value: "Approve this item?", done: false }
gen.next(true)  // répond "true" → approved = true → { value: "Item approved", done: true }
```

**Ce qu'il faut retenir :**
Le générateur peut **communiquer dans les deux sens** :
- vers l'extérieur avec `yield valeur`
- vers l'intérieur avec `next(valeur)`

C'est exactement ce qu'Effect.gen fait en coulisses :
1. ton générateur fait `yield* someEffect`
2. Effect exécute l'effect
3. Effect rappelle `next(résultat)` avec le résultat
4. ton code reçoit la valeur et continue

Tu n'as jamais à faire ce `next(valeur)` toi-même — Effect le gère pour toi. Mais savoir que ça existe explique pourquoi `yield*` dans Effect.gen te "donne" une valeur.

---

### Test 5 — Les générateurs sont lazy (exécution différée)

```ts
function* processItem(brand: string) {
  log.push("step 1: validate")
  yield brand.toUpperCase()

  log.push("step 2: save")
  yield `${brand} saved`
}

const gen = processItem("Apple")
// log = []  ← rien ne s'est exécuté !

gen.next()
// log = ["step 1: validate"]

gen.next()
// log = ["step 1: validate", "step 2: save"]
```

**Ce qu'il faut retenir :**
Appeler `processItem("Apple")` n'exécute **rien**. Le code ne tourne que quand tu appelles `.next()`.

C'est la même idée qu'un Effect : `Effect.succeed(42)` ne "fait" pas 42 — il **décrit** une computation qui donnera 42 quand on l'exécutera (`Effect.runSync`). C'est ce qu'on appelle la **laziness** ou l'exécution différée.

---

## Partie 2 — `Effect.gen` : `yield*` comme `await`

### Le lien avec `async/await`

Tu connais probablement `async/await` :

```ts
async function getLabel() {
  const brand = await fetchBrand() // attend le résultat
  const model = await fetchModel()
  return `${brand} ${model}`
}
```

`Effect.gen` fait la même chose, mais avec des Effects au lieu de Promises :

```ts
const getLabel = Effect.gen(function*() {
  const brand = yield* Effect.succeed("Apple")     // "attend" le résultat
  const model = yield* Effect.succeed("MacBook Pro")
  return `${brand} ${model}`
})
```

| `async/await`         | `Effect.gen`             |
|-----------------------|--------------------------|
| `async function`      | `Effect.gen(function*`   |
| `await somePromise`   | `yield* someEffect`      |
| `return value`        | `return value`           |
| `try/catch`           | `Effect.catchTag` / géré automatiquement |
| `Promise<T>`          | `Effect<T, E, R>`        |

---

### Test 1 — `yield*` extrait la valeur d'un Effect

```ts
const program = Effect.gen(function*() {
  const brand = yield* Effect.succeed("Apple")
  const model = yield* Effect.succeed("MacBook Pro")
  return `${brand} ${model}`
})

Effect.runSync(program) // "Apple MacBook Pro"
```

**Ce qu'il faut retenir :**
`yield*` dans un `Effect.gen` "déballe" l'Effect et te donne sa valeur. C'est l'opération inverse de `Effect.succeed`.

```
Effect.succeed("Apple")  →  Effect<string>
yield* Effect.succeed("Apple")  →  string
```

---

### Test 2 — `Effect.gen` remplace `flatMap` imbriqués

```ts
// Avec flatMap : difficile à lire quand ça s'accumule
const withFlatMap = pipe(
  Effect.succeed("Apple"),
  Effect.flatMap((brand) =>
    pipe(
      Effect.succeed("MacBook Pro"),
      Effect.flatMap((model) => Effect.succeed(`${brand} ${model}`))
    )
  )
)

// Avec gen : linéaire et lisible
const withGen = Effect.gen(function*() {
  const brand = yield* Effect.succeed("Apple")
  const model = yield* Effect.succeed("MacBook Pro")
  return `${brand} ${model}`
})
```

**Ce qu'il faut retenir :**
Les deux sont strictement équivalents. `Effect.gen` n'est pas un nouveau concept — c'est du sucre syntaxique sur `flatMap`. Il rend le code linéaire au lieu d'imbriqué.

Dans ce projet, on utilise presque toujours `Effect.gen` (ou `Effect.fn`) pour cette raison.

---

### Test 3 — Les erreurs se propagent automatiquement

```ts
const findItem = (id: string): Effect.Effect<string, ItemNotFound> =>
  id === "123" ? Effect.succeed("MacBook Pro") : Effect.fail(new ItemNotFound(id))

const program = Effect.gen(function*() {
  const item = yield* findItem("999") // échoue ici
  return item.toUpperCase()           // cette ligne n'est jamais atteinte
})
```

**Ce qu'il faut retenir :**
Quand un Effect échoue, `yield*` interrompt le générateur et propage l'erreur — exactement comme `throw` dans `async/await`. Tu n'as pas besoin d'un `try/catch`. L'erreur est capturée dans le type : `Effect<string, ItemNotFound, never>`.

Cela permet à TypeScript de te dire quelles erreurs peuvent survenir, et de te forcer à les gérer.

---

### Test 4 — `yield*` sur une `Option`

```ts
const maybeItem = yield* findById("42")  // Option<string>
const item = yield* maybeItem             // string, ou échec si None
```

**Ce qu'il faut retenir :**
En Effect 3.x, `Option` implémente une interface spéciale qui permet de l'utiliser avec `yield*` directement dans un `Effect.gen`. Si c'est `Some(value)`, tu obtiens `value`. Si c'est `None`, le générateur s'arrête avec une `NoSuchElementException`.

On retrouve ce pattern dans `http.ts` pour les requêtes "find by ID" : si l'item n'existe pas, l'Effect échoue proprement.

---

## Partie 3 — `Effect.fn` : le pattern du projet

### Pourquoi `Effect.fn` plutôt que `Effect.gen` directement ?

`Effect.fn` est un wrapper autour de `Effect.gen` qui ajoute deux choses :
1. **Un nom** utilisé pour le tracing OpenTelemetry (visible dans Signoz)
2. **Des middlewares** optionnels appliqués à l'Effect résultant

C'est le pattern utilisé partout dans ce projet. Quand tu vois `Effect.fn`, pense "c'est un `Effect.gen` avec un nom et des options".

---

### Test 1 — `Effect.fn` crée une fonction nommée

```ts
// item-repository.ts — exactement ce pattern
const getAll = Effect.fn("getAll")(function*() {
  const items = yield* sql`SELECT * FROM items`
  return items
})
```

Le premier argument (`"getAll"`) est le nom du span de tracing. Il apparaît dans Signoz quand tu actives l'observabilité (`docker compose up`).

```ts
const getItemLabel = Effect.fn("getItemLabel")(function*(brand: string, model: string) {
  const upper = yield* Effect.sync(() => brand.toUpperCase())
  return `${upper} – ${model}`
})

Effect.runSync(getItemLabel("apple", "MacBook Pro")) // "APPLE – MacBook Pro"
```

---

### Test 2 — Middlewares en pipeline

```ts
// http.ts — ce pattern existe dans getAllItems
Effect.fn(
  function*() { ... },
  Effect.tap(Effect.logInfo("coucou")),       // log après succès
  Effect.catchTag("SomeError", () => ...)     // gestion d'erreur
)
```

Le deuxième argument (et les suivants) sont des opérateurs Effect appliqués en séquence sur l'Effect retourné par le générateur. C'est l'équivalent d'un `.pipe(...)` attaché à la sortie.

---

### Test 3 — `yield* Service` + `yield* method()` : le pattern DI complet

C'est le test le plus important pour comprendre ce que fait `http.ts`.

```ts
// http.ts — simplifié
Effect.fn(function*() {
  const repo = yield* ItemRepository   // ← résout le service depuis le contexte
  const items = yield* repo.getAll()   // ← appelle la méthode
  return { items }
})
```

**Deux `yield*`, deux rôles différents :**

| `yield*` | Ce qu'il fait |
|---|---|
| `yield* ItemRepository` | Résout une dépendance depuis le contexte Effect (injection de dépendance) |
| `yield* repo.getAll()` | Exécute un Effect et récupère son résultat |

C'est l'équivalent Effect de :
```ts
// En POO classique
constructor(private repo: ItemRepository) {}

async getAllItems() {
  const items = await this.repo.getAll()
  return { items }
}
```

Sauf que dans Effect, la dépendance n'est pas injectée dans un constructeur — elle est déclarée dans le type `Effect<A, E, R>` (le `R` = requirements/contexte) et résolue via `Effect.provide`.

---

## Résumé de la progression

```
yield classique
  → comprendre la pause / reprise (.next())
  → comprendre yield vs return (intermédiaire vs final)
  → comprendre yield* (délégation)
  → comprendre next(value) (communication bidirectionnelle) ← clé pour Effect
  → comprendre la laziness

Effect.gen
  → yield* = await pour les Effects
  → remplace flatMap imbriqués
  → propagation d'erreurs automatique
  → Option comme Yieldable

Effect.fn
  → Effect.gen + nom de tracing
  → middlewares
  → pattern DI complet du projet
```

Chaque étape s'appuie sur la précédente. `Effect.gen` n'est pas de la magie — c'est exactement le mécanisme `next(value)` du test 4 de la partie 1, automatisé par le runtime Effect.
