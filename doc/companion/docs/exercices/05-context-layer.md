---
sidebar_position: 5
---

# Exercice 5 — Context et Layer

Une fonction qui fait une requête HTTP dépend d'un client HTTP. En TypeScript classique, cette dépendance est soit une variable globale (difficile à tester), soit un paramètre en plus (bruyant à propager).

Effect résout ça avec le troisième paramètre de type : le `Context`. Une fonction déclare ce dont elle a besoin, Effect le fournit automatiquement.

Fichier à compléter : `packages/api/_exercices/5-context-layer.spec.ts`

---

## Utiliser un service depuis le contexte

`HttpClient.HttpClient` est un service fourni par Effect. Pour l'utiliser, il suffit de le "demander" dans un `pipe` :

```typescript
pipe(
  Database, // demande le service
  Effect.flatMap(
    (
      db, // reçoit le service
    ) => db.query("SELECT * FROM users"), // l'utilise
  ),
);
// Type : Effect<Row[], ..., Database>
//                               ^
//               Database est dans les requirements
```

Le type `Effect<Row[], ..., Database>` signifie : _"pour s'exécuter, ce programme a besoin d'un Database"_.

On fournit le service au moment de l'exécution :

```typescript
pipe(getUsers(), Effect.provide(Database.layer));
// Effect<User[], never, never> ← requirement satisfait
```

### Exercice

Complétez `fetchJoke` pour récupérer une blague depuis `https://api.chucknorris.io/jokes/random` :

```typescript
const fetchJoke = () =>
  pipe(
    ???, // À compléter : demander HttpClient, appeler .get(), parser le JSON, caster en Joke
    Effect.orElseSucceed((): Joke => ({ url: "http://fake.fr", value: "No jokes today" }))
  )
```

À vous de jouer !

:::tip Ressources

- [Contexte et Services](../base-de-connaissance/04-contexte-et-services.md)
- [Layers](../base-de-connaissance/05-layers.md)

:::

#### Indice 1

<details>
  <summary>Enchaîner les étapes avec `flatMap`</summary>

Chaque étape renvoie un `Effect`. Il faut les enchaîner :

1. `HttpClient.HttpClient` → le client
2. `client.get(url)` → la response
3. `response.json` → le JSON parsé
4. `Effect.map` pour caster en `Joke`

</details>

#### Indice 2

<details>
  <summary>Comment extraire le body d'une `Response` ?</summary>

Une `Response` HTTP expose son body via une propriété qui renvoie un `Effect` — pas une valeur directe.

Cherchez sur `response` ce qui donne accès au JSON parsé.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const fetchJoke = () =>
  pipe(
    HttpClient.HttpClient,
    Effect.flatMap((client) =>
      client.get("https://api.chucknorris.io/jokes/random"),
    ),
    Effect.flatMap((response) => response.json),
    Effect.map((joke) => joke as Joke),
    Effect.orElseSucceed(
      (): Joke => ({ url: "http://fake.fr", value: "No jokes today" }),
    ),
  );
```

</details>

---

## `Context.GenericTag` — créer son propre service

Pour définir un service maison, on crée un `Tag` — un identifiant unique qui permet à Effect de trouver l'implémentation dans le contexte :

```typescript
type LoggerService = {
  log: (message: string) => Effect.Effect<void>;
};

const LoggerService = Context.GenericTag<LoggerService>("LoggerService");
```

On fournit ensuite une implémentation avec `Layer.succeed` :

```typescript
const LoggerServiceLive = Layer.succeed(LoggerService, {
  log: (msg) => Effect.sync(() => console.log("[LIVE]", msg)),
});

const LoggerServiceTest = Layer.succeed(LoggerService, {
  log: () => Effect.void, // silencieux en test
});
```

Et on utilise le service comme n'importe quel service Effect :

```typescript
pipe(
  LoggerService,
  Effect.flatMap((logger) => logger.log("Hello")),
);
```

### Exercice

Créez `JokeService`, `JokeServiceTest` et `JokeServiceLive` :

```typescript
type JokeService = { getRandom: () => Effect.Effect<string> }

const JokeService = ??? // À compléter

const JokeServiceTest = Layer.succeed(
  JokeService,
  ??? // À compléter : renvoie "Not really random for tests"
)

const JokeServiceLive = Layer.succeed(
  JokeService,
  ??? // À compléter : renvoie "Amazing joke from server"
)
```

À vous de jouer !

#### Indice 1

<details>
  <summary>La signature de `Context.GenericTag`</summary>

```typescript
Context.GenericTag<TypeDuService>("IdentifiantUnique");
```

L'identifiant est une string unique dans l'application — par convention, le nom du service.

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const JokeService = Context.GenericTag<JokeService>("JokeService");

const JokeServiceTest = Layer.succeed(JokeService, {
  getRandom: () => Effect.succeed("Not really random for tests"),
});

const JokeServiceLive = Layer.succeed(JokeService, {
  getRandom: () => Effect.succeed("Amazing joke from server"),
});
```

</details>

---

## `Effect.Service` — la forme simplifiée

`Context.GenericTag` + `Layer.succeed` fonctionne, mais c'est verbeux. `Effect.Service` est la forme moderne qui regroupe tout en une classe :

```typescript
class UserService extends Effect.Service<UserService>()("UserService", {
  effect: pipe(
    Database,
    Effect.map((db) => ({
      getById: (id: string) =>
        pipe(
          db.query(`SELECT * FROM users WHERE id = '${id}'`),
          Effect.map((rows) => rows[0]),
        ),
    })),
  ),
  dependencies: [Database.Default],
}) {}
```

Une classe `Effect.Service` génère automatiquement plusieurs membres statiques :

| Membre                                   | Type    | Usage                                                              |
| ---------------------------------------- | ------- | ------------------------------------------------------------------ |
| `UserService`                            | `Tag`   | Accéder au service depuis le contexte (`yield* UserService`)       |
| `UserService.Default`                    | `Layer` | Layer complet, dépendances incluses — à fournir à l'exécution      |
| `UserService.DefaultWithoutDependencies` | `Layer` | Layer sans ses dépendances — utile pour injecter des mocks en test |

### Exercice

Réécrivez `JokeService` avec `Effect.Service` :

```typescript
const JokeService = ??? // À compléter avec Effect.Service
```

À vous de jouer !

#### Indice 1

<details>
  <summary>La structure `Effect.Service`</summary>

```typescript
class MyService extends Effect.Service<MyService>()("MyService", {
  effect: pipe(
    // les dépendances dont l'implémentation a besoin
    OtherService,
    Effect.map((dep) => ({
      doWork: () => dep.compute(),
    })),
  ),
  dependencies: [OtherService.Default],
}) {}
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
class JokeService extends Effect.Service<JokeService>()("JokeService", {
  effect: pipe(
    HttpClient.HttpClient,
    Effect.map((client) => ({
      getRandom: () =>
        pipe(
          client.get("https://api.chucknorris.io/jokes/random"),
          Effect.flatMap((response) => response.json),
          Effect.map((joke) => (joke as { value: string }).value),
          Effect.orElseSucceed(() => "No jokes for today"),
        ),
    })),
  ),
  dependencies: [NodeHttpClient.layer],
}) {}
```

</details>

---

## `Service.DefaultWithoutDependencies` — tester sans dépendances réelles

Pour tester un service qui dépend d'un autre, `Layer.mock` permet de remplacer une dépendance par un double de test — sans modifier l'implémentation.

`Layer.mock` accepte une implémentation **partielle** : seules les méthodes utiles pour le test ont besoin d'être fournies. Toute méthode non fournie lèvera un `UnimplementedError` defect si elle est appelée — ce qui est un filet de sécurité utile en test.

```typescript
class EmailService extends Effect.Service<EmailService>()("EmailService", {
  effect: Effect.succeed({
    send: (to: string) => Effect.succeed(`sent to ${to}`),
    validate: (email: string) => Effect.succeed(email.includes("@")),
  }),
}) {}

// En test : on ne fournit que `send` — `validate` lèvera un defect si appelée
const EmailServiceTest = Layer.mock(EmailService, {
  send: () => Effect.succeed("sent"),
});
```

On fournit ensuite ce mock au layer qui en dépend :

```typescript
const UserServiceTest = pipe(
  UserService.DefaultWithoutDependencies,
  Layer.provide(EmailServiceTest),
);
```

`DefaultWithoutDependencies` est la version du layer _sans_ ses dépendances déclarées — c'est le point d'entrée pour substituer des dépendances en tests.

### Exercice

Créez `JokeServiceTest` avec un `HttpClient` qui échoue toujours — le `orElseSucceed` de `JokeService` devra renvoyer `"No jokes for today"` :

```typescript
const JokeServiceTest = ??? // À compléter
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Deux étapes</summary>

1. Créez un mock de `HttpClient.HttpClient` avec `Layer.mock` — faites échouer la méthode `get`
2. Fournissez ce mock à `JokeService.DefaultWithoutDependencies` via `Layer.provide`

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const ClientTest = Layer.mock(HttpClient.HttpClient, {
  get: () => Effect.fail(undefined),
});

const JokeServiceTest = pipe(
  JokeService.DefaultWithoutDependencies,
  Layer.provide(ClientTest),
);
```

</details>
