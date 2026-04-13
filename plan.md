# Plan — Effect-ts Workshop Companion

> Document de référence pour la rédaction du companion. À consulter avant d'écrire chaque page d'exercice.

---

## 1. Vision du workshop

**Public cible** : développeurs TypeScript ayant les bases du langage, curieux de découvrir Effect-ts.

**Promesse** : à la fin de ce workshop, les participants savent modéliser des programmes asynchrones, faillibles et testables avec Effect. Ils ne repartent pas avec une liste d'API mémorisées — ils repartent avec un _modèle mental_.

**Fil conducteur** : chaque exercice construit sur le précédent. On ne fait jamais un saut sans avoir posé les marches.

---

## 2. Règles d'écriture — à respecter absolument

### Langue

- Le companion est **en français**.
- Les termes techniques anglais ne se traduisent **jamais** : `pipe`, `curried function`, `Effect`, `map`, `flatMap`, `promise`, `generator`, `schema`, `layer`, `context`, `fiber`, `defect`, `body` (HTTP)…
- On ne dit pas "tuyau" pour `pipe`. On dit `pipe`.

### Syntaxe de code

- **Toujours** `pipe(value, fn1, fn2)` — jamais `value.pipe(fn1, fn2)`.
- Les imports sont toujours montrés quand ils éclairent le lecteur.
- Les `TODO` dans les spec sont le point de départ, pas à copier-coller dans la doc.

### Ton

- **Conversationnel et bienveillant.** On parle à un collègue curieux, pas à un étudiant qui doit mémoriser.
- On pose la question que le lecteur se pose avant qu'il la pose.
- On montre le problème _avant_ la solution. Le lecteur doit ressentir la douleur avant d'apprécier le remède.
- Phrases courtes. Pas de jargon gratuit.
- "À vous de jouer !" pour lancer l'exercice — jamais plus tôt.

### Pédagogie

- **Concept d'abord, API ensuite.** On n'introduit pas `Effect.flatMap` sans avoir expliqué pourquoi `Effect.map` ne suffit pas.
- Les indices sont **progressifs** : chaque indice donne un petit pas, pas la solution complète.
- La solution est toujours dans un `<details>` avec l'invite de solliciter un formateur d'abord.
- On ne donne jamais plus d'une notion par exercice. Si un exercice couvre deux notions, on les sépare en deux sections claires.

### Titres de sections

- Les titres de sections décrivent ce que le participant **fait**, pas l'API qu'il utilise. Pas de nom de fonction dans le titre : `Définir la structure d'un formulaire` et non ~~`FormBuilder — définir la structure du formulaire`~~.
- S'inspirer du nom du test correspondant dans le fichier spec (ex: `"should create simple form builder"` → `"Définir la structure d'un formulaire"`). Le titre du test est souvent le meilleur résumé de l'intention.

---

## 3. Structure type d'un exercice

````markdown
---
sidebar_position: N
---

# Exercice N — [Titre court]

[1-2 phrases qui remettent en contexte : d'où on vient, où on va.]

## [Titre du concept]

[Explication du problème que ce concept résout — avec un exemple concret qui fait "ah oui, j'ai déjà eu ce problème".]

<!-- prettier-ignore -->
```ts
// exemple minimal qui montre le problème
````

[Explication de la solution conceptuelle en 2-3 phrases.]

<!-- prettier-ignore -->
```ts
// exemple minimal qui montre la solution
```

## Exercice

[Ce qu'on attend du participant — fichier(s) à modifier, résultat attendu.]

À vous de jouer !

:::tip Ressources

- [Lien vers doc Effect pertinente]

:::

## Indice 1

<details>
  <summary>[Question / titre qui oriente sans spoiler]</summary>

[Texte + éventuellement un extrait de code qui met sur la piste]

</details>

## Indice 2 (si nécessaire)

<details>
  <summary>[...]</summary>

[...]

</details>

## Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```ts
// solution complète et commentée si nécessaire
```

</details>
```

---

## 4. Plan de contenu — Exercice 1 : Les bases

> Fichier source : `packages/api/_exercices/1-base.spec.ts`

Cet exercice est la fondation de tout le reste. On y introduit deux idées indépendantes : la composition de fonctions avec `pipe`, et la représentation d'effets avec `Effect`. Ces deux idées s'assemblent dès l'exercice suivant — il faut donc que les deux soient solides à la fin.

---

### Section A — FP utils

#### A1 · `pipe`

**Concept à expliquer :**

Le problème classique de l'imbrication de fonctions qui se lit de droite à gauche :

<!-- prettier-ignore -->
```ts
// Difficile à lire : on lit de droite à gauche
const result = multiply(add(4, 6), 4)
```

`pipe` permet d'écrire la même chose dans l'ordre de lecture naturel :

<!-- prettier-ignore -->
```ts
const result = pipe(
  add(4, 6),
  (a) => multiply(a, 4)
)
```

**Ce que le participant doit faire :**

Compléter le `pipe` en ajoutant la transformation `multiply(a, 4)` sur le résultat de `add(4, 6)`.

**Indice 1** — _Que fait-on du résultat de `add(4, 6)` ?_
`pipe` passe le résultat de chaque étape à la suivante. La première étape produit `10`. Il faut une fonction qui prend `10` et renvoie `40`.

**Solution :**

<!-- prettier-ignore -->
```ts
const result = pipe(
  add(4, 6),
  (a) => multiply(a, 4)
)
```

---

#### A2 · `pipe` avec des curried functions

**Concept à expliquer :**

Une `curried function` est une fonction qui, au lieu de prendre tous ses arguments d'un coup, les prend un par un et renvoie une fonction intermédiaire :

<!-- prettier-ignore -->
```ts
// Fonction normale
const add = (a: number, b: number) => a + b

// Currified
const add = (a: number) => (b: number) => a + b
```

L'intérêt : `add(6)` renvoie une fonction `(b: number) => 6 + b` — une fonction qu'on peut passer directement à `pipe`.

<!-- prettier-ignore -->
```ts
const result = pipe(
  4,
  add(6),   // (b) => 6 + b  →  renvoie 10
  multiply(4) // (b) => 4 * b  →  renvoie 40
)
```

**Ce que le participant doit faire :**

Compléter le `pipe` en ajoutant `multiply(4)` après `add(6)`.

**Indice 1** — _`add(6)` est une fonction, pas un nombre_
`add(6)` renvoie une fonction. `pipe` va l'appeler avec le résultat de l'étape précédente (`10`). Il suffit de faire la même chose avec `multiply`.

**Solution :**

<!-- prettier-ignore -->
```ts
const result = pipe(
  4,
  add(6),
  multiply(4)
)
```

---

### Section B — Effect basics

**Intro de section à écrire :**

Avant de coder, une minute pour comprendre _pourquoi_ Effect existe.

En JavaScript, une fonction peut :

- renvoyer une valeur
- lancer une exception
- déclencher une opération asynchrone
- avoir des effets de bord

Le problème : rien dans la signature de la fonction ne le dit. Une fonction `async` qui peut lancer une erreur est typée `Promise<T>` — l'erreur est invisible.

Effect résout ça en rendant tout explicite dans le type :

<!-- prettier-ignore -->
```ts
Effect<Value, Error, Requirements>
//       ^       ^          ^
//   ce qu'on   ce qui    ce dont on
//   obtient    peut      a besoin
//              rater
```

Un `Effect` est une **description** d'un programme. Il ne s'exécute pas tout seul — on le lance explicitement avec `Effect.runSync`, `Effect.runPromise`, etc.

---

#### B1 · `Effect.succeed`

**Concept à expliquer :**

La brique de base : envelopper une valeur dans un `Effect` pour qu'elle entre dans le monde Effect.

<!-- prettier-ignore -->
```ts
const result: Effect.Effect<number> = Effect.succeed(42)
```

Ce n'est pas "juste un wrapper" — c'est la façon de dire "ce programme, quand il s'exécute, produit 42 sans risque d'erreur".

**Ce que le participant doit faire :**

La fonction `add` renvoie la somme, mais la signature attend un `Effect.Effect<number>`. Il faut envelopper le résultat avec `Effect.succeed`.

**Indice 1** — _Quand une fonction renvoie un `Effect`_
`Effect.succeed` prend une valeur et renvoie un `Effect` qui contient cette valeur. C'est l'équivalent de `Promise.resolve` mais pour Effect.

**Solution :**

<!-- prettier-ignore -->
```ts
const add = (a: number, b: number): Effect.Effect<number> => {
  const result = a + b
  return Effect.succeed(result)
}
```

---

#### B2 · `Effect.map`

**Concept à expliquer :**

On a un `Effect<number>` et on veut transformer la valeur à l'intérieur sans "sortir" de l'Effect. C'est exactement ce que fait `map`.

<!-- prettier-ignore -->
```ts
// Sans Effect
const double = (n: number) => n * 2
double(5) // 10

// Avec Effect
pipe(
  Effect.succeed(5),
  Effect.map((n) => n * 2)
) // Effect.Effect<number> qui contient 10
```

`Effect.map` ne déclenche pas l'exécution. Il construit une nouvelle description.

**Ce que le participant doit faire :**

Transformer l'`Effect.succeed(2)` avec `add(8)` en utilisant `Effect.map`.

**Indice 1** — _`add` est déjà une curried function_
`add(8)` renvoie une fonction `(b: number) => 8 + b`. C'est exactement ce qu'attend `Effect.map` : une fonction qui transforme la valeur.

**Solution :**

<!-- prettier-ignore -->
```ts
const result = pipe(
  Effect.succeed(2),
  Effect.map(add(8))
)
```

---

#### B3 · `Effect.flatMap`

**Concept à expliquer :**

Que se passe-t-il si la fonction de transformation renvoie elle-même un `Effect` ?

<!-- prettier-ignore -->
```ts
const add = (a: number) => (b: number) => Effect.succeed(a + b)

pipe(
  Effect.succeed(2),
  Effect.map(add(8)) // ← renvoie Effect.Effect<Effect.Effect<number>> !
)
```

On se retrouve avec un `Effect` imbriqué dans un autre `Effect`. `flatMap` règle ça : il applique la transformation _et_ aplatit le résultat.

<!-- prettier-ignore -->
```ts
pipe(
  Effect.succeed(2),
  Effect.flatMap(add(8)) // ← Effect.Effect<number> ✓
)
```

Règle mnémotechnique : si la fonction passée renvoie un `Effect`, utilise `flatMap`. Si elle renvoie une valeur simple, utilise `map`.

**Ce que le participant doit faire :**

Remplacer `map` par `flatMap` puisque `add` renvoie maintenant un `Effect.succeed`.

**Indice 1** — _Regarder le type de retour de `add`_
`add` renvoie `Effect.succeed(a + b)`, donc un `Effect`. Si on utilise `map`, on obtient `Effect<Effect<number>>`. Il faut "aplatir".

**Solution :**

<!-- prettier-ignore -->
```ts
const result = pipe(
  Effect.succeed(2),
  Effect.flatMap(add(8))
)
```

---

#### B4 · `Effect.promise`

**Concept à expliquer :**

Pour intégrer du code asynchrone existant (une `Promise`) dans Effect, on utilise `Effect.promise`. Il faut passer une _fonction_ qui renvoie la `Promise` — pas la `Promise` directement — pour que l'exécution reste lazy.

<!-- prettier-ignore -->
```ts
// ❌ La Promise démarre immédiatement
Effect.promise(fetch("https://api.example.com"))

// ✓ La Promise ne démarre que quand Effect est exécuté
Effect.promise(() => fetch("https://api.example.com"))
```

**Ce que le participant doit faire :**

Envelopper l'appel `add(a, b)` (qui renvoie une `Promise`) dans `Effect.promise`.

**Indice 1** — _Une fonction qui renvoie une Promise_
`Effect.promise` attend `() => Promise<T>`. Donc `() => add(a, b)` est exactement ce qu'il faut.

**Solution :**

<!-- prettier-ignore -->
```ts
const addWithDelay = (a: number, b: number): Effect.Effect<number> => {
  return Effect.promise(() => add(a, b))
}
```

---

#### B5 · `Effect.tryPromise`

**Concept à expliquer :**

`Effect.promise` suppose que la `Promise` ne peut pas rejeter. Mais dans la réalité, un `fetch` peut échouer.

`Effect.tryPromise` permet de modéliser cette faillibilité. Il prend deux fonctions : `try` (la `Promise`) et `catch` (comment transformer l'erreur en une valeur typée).

<!-- prettier-ignore -->
```ts
Effect.tryPromise({
  try: () => fetch(url),
  catch: (error) => new Error("La requête a échoué")
})
// Effect.Effect<Response, Error>
//                          ^
//                    l'erreur est visible dans le type
```

C'est la différence fondamentale avec `Promise` : l'erreur n'est plus un "throw" invisible — elle fait partie du contrat.

**Ce que le participant doit faire :**

Implémenter `fetch` en utilisant `Effect.tryPromise`, avec `baseFetch` pour la `Promise` et une `new Error("meh")` pour le catch.

**Indice 1** — _La structure de `tryPromise`_

<!-- prettier-ignore -->
```ts
Effect.tryPromise({
  try: () => /* ta Promise ici */,
  catch: (_error) => /* ton erreur typée ici */
})
```

**Indice 2** — _Quel `fetch` appeler ?_
`baseFetch` est importé de `undici`. C'est lui qui doit être appelé dans `try`, avec les arguments `input` et `init` déjà disponibles dans la closure.

**Solution :**

<!-- prettier-ignore -->
```ts
const fetch: Fetch = (input, init) => {
  return Effect.tryPromise({
    try: () => baseFetch(input, init),
    catch: (_error) => new Error("meh")
  })
}
```

---

## 5. Conventions de fichiers

| Fichier doc            | Fichier spec de référence                |
| ---------------------- | ---------------------------------------- |
| `exercices/01-base.md` | `packages/api/_exercices/1-base.spec.ts` |
| `exercices/02-*.md`    | `packages/api/_exercices/2-*.spec.ts`    |
| …                      | …                                        |

Chaque page doc correspond à **un seul fichier spec**. On ne mélange pas deux spec dans une même page.

---

## 6. Checklist avant publication d'une page

- [ ] Le concept est expliqué avec un problème concret avant l'API
- [ ] Le code utilise `pipe(...)` et jamais `xxx.pipe(...)`
- [ ] Les termes anglais techniques, variables, types et noms de fonctions ne sont pas traduits (ex: `squareRoot` et non `racineCarrée`)
- [ ] Les exemples dans l'explication du concept ne donne pas la solution, ni utiliser le meme domaine metier
- [ ] Les titres de sections décrivent une action, sans nom de fonction — inspirés des noms de tests dans le fichier spec
- [ ] Les indices sont progressifs (pas la solution au premier indice)
- [ ] La solution est dans un `<details>`
- [ ] Le `sidebar_position` est correct
- [ ] Le code compile (vérifier mentalement les types)
