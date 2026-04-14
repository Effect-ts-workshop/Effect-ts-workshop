---
sidebar_position: 5
---

# Exercice 5 — Générateurs

Les générateurs JavaScript sont un mécanisme du langage souvent méconnu. Cet exercice a deux parties : la première explore le mécanisme pur, sans Effect. La deuxième montre comment Effect s'en sert pour écrire des programmes complexes avec le flot de contrôle impératif qu'on connaît déjà — `if`, `for`, `while`, ...

Fichier à compléter : `packages/api/_exercices/5-generators.spec.ts`

---

## Partie 1 — Générateurs JavaScript

### Mettre une fonction en pause

Un générateur est une fonction qui peut être mise en _pause_. Chaque `yield` suspend l'exécution et expose une valeur à l'extérieur :

<!-- prettier-ignore -->
```typescript
function* colors() {
  yield "red";
  yield "green";
  yield "blue";
}

const gen = colors();
gen.next(); // { value: "red", done: false }
gen.next(); // { value: "green", done: false }
gen.next(); // { value: "blue", done: false }
gen.next(); // { value: undefined, done: true }
```

### Exercice

Créez un générateur `items` qui produit `"laptop"`, `"mouse"`, `"keyboard"` dans cet ordre :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
function* items() {
  yield "laptop";
  yield "mouse";
  yield "keyboard";
}
```

</details>

---

### Retourner une valeur finale

La valeur `return` d'un générateur apparaît dans le dernier `.next()`, avec `done: true` :

<!-- prettier-ignore -->
```typescript
function* checkStatus(): Generator<string, number, unknown> {
  yield "checking…"; // done: false
  return 200; // done: true
}
```

### Exercice

Créez `getBrand` : il `yield` `"validating…"` comme étape intermédiaire, puis `return` `"Apple"` comme valeur finale :

<!-- prettier-ignore -->
```typescript
const getBrand = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
function* getBrand(): Generator<string, string, unknown> {
  yield "validating…";
  return "Apple";
}
```

</details>

---

### Déléguer à un autre générateur

`yield*` délègue l'itération à un sous-générateur : toutes ses valeurs sont produites comme si elles étaient dans le générateur courant.

<!-- prettier-ignore -->
```typescript
function* vegetables() {
  yield "carrot";
  yield "spinach";
}

function* smoothie() {
  yield* vegetables(); // produit "carrot" puis "spinach"
  yield "banana";
}

[...smoothie()]; // ["carrot", "spinach", "banana"]
```

C'est l'équivalent d'un `flatMap` pour les générateurs.

### Exercice

Créez `models` qui délègue à `brands` puis produit `"ThinkPad"` :

<!-- prettier-ignore -->
```typescript
const models = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
function* models() {
  yield* brands();
  yield "ThinkPad";
}
```

</details>

---

### Envoyer une valeur dans le générateur

La vraie magie des générateurs : on peut _envoyer_ une valeur dans le générateur via `next(value)`. Cette valeur devient le résultat de l'expression `yield` en cours.

<!-- prettier-ignore -->
```typescript
function* askQuestion(): Generator<string, string, boolean> {
  const correct = yield "TypeScript is a superset of JavaScript?"; // suspend
  return correct ? "Correct!" : "Wrong answer";
}

const gen = askQuestion();
gen.next(); // { value: "TypeScript is a superset of JavaScript?", done: false }
gen.next(true); // { value: "Correct!", done: true }
//       ^
//  on injecte `true` → correct = true
```

C'est _exactement_ le mécanisme qu'Effect utilise pour injecter les résultats d'Effects dans vos générateurs.

### Exercice

Appelez `gen.next(true)` pour approuver l'item et récupérer le résultat :

<!-- prettier-ignore -->
```typescript
const gen = approveItem()
const question = gen.next()
const result = ??? // À compléter : répondre "true" au générateur
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const result = gen.next(true);
```

</details>

---

## Partie 2 — Générateurs avec Effect

Les générateurs permettent de mettre une fonction en pause et d'y injecter des valeurs. Effect exploite ce mécanisme pour deux choses : remplacer les longues chaînes de `flatMap` par une syntaxe linéaire, et retrouver le flot de contrôle impératif — `if`, `for`, `while`, ... — sans sortir du monde Effect.

### Nommer et composer des handlers

`Effect.fn` crée une fonction qui retourne un `Effect`, en utilisant un générateur pour la logique interne.

<!-- prettier-ignore -->
```typescript
const formatName = Effect.fn("formatName")(function* (
  first: string,
  last: string,
) {
  const upper = yield* Effect.sync(() => last.toUpperCase());
  return `${first} ${upper}`;
});

Effect.runSync(formatName("John", "doe")); // "John DOE"
```

Le `yield*` à l'intérieur joue le rôle de `flatMap` : il suspend le générateur jusqu'à ce que l'Effect soit résolu, et injecte le résultat.

:::info `Effect.gen` vs `Effect.fn`

Il existe aussi `Effect.gen(function*() { ... })` qui s'occupe uniquement du generateur. Préférez `Effect.fn` : le nom passé en premier argument apparaît dans les stack traces et active le tracing automatique — ce qui rend le débogage beaucoup plus simple.

Pour comprendre comment visualiser ces traces dans Jaeger, voir [Observabilité](../base-de-connaissance/16-observabilite.md).

:::

### Exercice

Créez `getItemLabel` avec `Effect.fn` :

<!-- prettier-ignore -->
```typescript
const getItemLabel = ??? // À compléter
// doit : mettre brand en majuscules, renvoyer "${UPPER} – ${model}"
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Squelette `Effect.fn`</summary>

<!-- prettier-ignore -->
```typescript
const myFn = Effect.fn("myFn")(function*(arg1: string, arg2: string) {
  const result = yield* Effect.sync(() => /* computation */)
  return `${result} – ${arg2}`
})
```

`Effect.sync` emballe un calcul synchrone (sans Effect existant).

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const getItemLabel = Effect.fn("getItemLabel")(function* (
  brand: string,
  model: string,
) {
  const upper = yield* Effect.sync(() => brand.toUpperCase());
  return `${upper} – ${model}`;
});
```

</details>

---

### Réécrire un pipeline avec des générateurs

Vous connaissez probablement le "Callback Hell" — des callbacks imbriqués sur plusieurs niveaux, impossible à lire :

<!-- prettier-ignore -->
```typescript
// Callback Hell
fetchUser(id, function (user) {
  fetchProfile(user.id, function (profile) {
    fetchSettings(profile.id, function (settings) {
      // ...
    });
  });
});
```

JavaScript l'a résolu avec `async/await` : même logique, lecture linéaire. `Effect.fn` joue exactement le même rôle pour Effect — `yield*` est l'équivalent d'`await`.

Les deux écritures suivantes sont équivalentes. La version générateur est souvent plus lisible quand il y a plusieurs étapes :

<!-- prettier-ignore -->
```typescript
// Avec pipe et flatMap
const fetchWeather = (city: string) =>
  pipe(
    HttpClient.HttpClient,
    Effect.flatMap((client) =>
      pipe(
        client.get(`https://api.weather.io/${city}`),
        Effect.flatMap((response) =>
          pipe(
            response.json,
            Effect.map((data) => ({ response, data })),
          ),
        ),
      ),
    ),
  );

// Avec Effect.fn — même logique, lecture linéaire
const fetchWeatherGen = Effect.fn("fetchWeatherGen")(function* (city: string) {
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get(`https://api.weather.io/${city}`);
  const data = yield* response.json;
  return { response, data };
});
```

### Exercice

Réécrivez `fetchJoke` avec `Effect.fn` :

<!-- prettier-ignore -->
```typescript
const fetchJokeGen = ??? // À compléter
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const fetchJokeGen = Effect.fn("fetchJokeGen")(function* (id: string) {
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get(`https://api.chucknorris.io/jokes/${id}`);
  const data = yield* response.json;
  return { response, data };
});
```

</details>

---

### Flot de contrôle impératif dans un générateur

Un des grands avantages des générateurs : les boucles et conditions fonctionnent naturellement

### Exercice

Complétez `buildUsers` pour créer `count` utilisateurs avec une boucle :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
for (let index = 0; index < count; index++) {
  const user = yield* buildUser();
  users.push(user);
}
```

`yield*` dans une boucle `for` — exactement comme un `await` dans un `for` async.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const buildUsers = Effect.fn(function* (count: number) {
  const users = [];
  for (let index = 0; index < count; index++) {
    const user = yield* buildUser();
    users.push(user);
  }
  return users;
});
```

</details>

---

### Gérer les erreurs dans un générateur

`yield*` propage les erreurs automatiquement. Pour les rattraper sans sortir du générateur, on utilise `Effect.orElse` :

<!-- prettier-ignore -->
```typescript
const getOrder = Effect.fn(function* (id: string) {
  const order = yield* getOrderById(id);

  // getOrderItems peut échouer — on fournit un fallback
  const items = yield* Effect.orElse(getOrderItems(id), () =>
    Effect.succeed([]),
  );

  return { ...order, items };
});
```

### Exercice

Rattrapez l'échec de `getUserFriends` en renvoyant une liste vide :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const friends = yield* Effect.orElse(
  getUserFriends(id), 
  () => Effect.succeed([])
);
```

</details>

---

### Utiliser Option et Either dans un générateur

`Option` et `Either` sont des sous-types d'`Effect` : les fonctions du module `Effect` les acceptent directement. On peut les utiliser avec `yield*` dans un générateur comme n'importe quel Effect.

| Type              | Comportement                        |
| ----------------- | ----------------------------------- |
| `Option.Some(a)`  | Succès — injecte `a`                |
| `Option.None`     | Échec avec `NoSuchElementException` |
| `Either.Right(a)` | Succès — injecte `a`                |
| `Either.Left(e)`  | Échec avec `e`                      |

<!-- prettier-ignore -->
```typescript
const parseConfig = Effect.fn("parseConfig")(function*(raw: string) {
  // Option.fromNullable renvoie un Option<string>
  const host = yield* Option.fromNullable(process.env.HOST)
  // Some(h) → h, None → NoSuchElementException

  // Either.fromPredicate renvoie un Either<string, number>
  const port = yield* Either.fromPredicate(
    parseInt(raw),
    (n) => !Number.isNaN(n),
    () => `invalid port: ${raw}`
  )
  // Right(n) → n, Left(msg) → échec avec msg

  return { host, port }
})
```

### Exercice

Complétez `findUser` pour transformer un `Option.None` en `MyDomainError` :

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
```typescript
const user = yield* Effect.catchAll(
  foundUser, 
  (error) => new MyDomainError({ error })
);
```

</details>
