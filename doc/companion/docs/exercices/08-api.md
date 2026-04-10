---
sidebar_position: 8
---

# Exercice 8 — HTTP API

Nous avons vu comment consommer un service externe. Voici maintenant comment en _définir_ un.

`@effect/platform` fournit un système en trois couches : le **contrat** (ce que l'API expose), l'**implémentation** (comment elle répond), et le **layer** (qui branche les deux). Cette séparation permet de tester l'API sans démarrer de vrai serveur.

Fichier à compléter : `packages/api/_exercices/8-api.spec.ts`

---

## Le contrat — `HttpApi`, `HttpApiGroup`, `HttpApiEndpoint`

Le contrat décrit la forme de l'API. Il ne contient aucune logique.

```typescript
const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello")
      .addSuccess(Schema.String)
  )
)
```

- `HttpApi.make("MyApi")` — crée l'API racine
- `HttpApiGroup.make("greet")` — un groupe d'endpoints (correspond souvent à une ressource)
- `HttpApiEndpoint.get("sayHello", "/hello")` — un endpoint GET
- `.addSuccess(Schema.String)` — type de la réponse en cas de succès

Ce contrat est la _source de vérité_ : le serveur l'implémente, le client le consomme. Les deux sont garantis cohérents par TypeScript.

---

## L'implémentation — `HttpApiBuilder.group`

```typescript
const MyApiLive = HttpApiBuilder.group(
  MyApi,
  "greet",
  (handlers) => handlers.handle("sayHello", () => Effect.succeed("Hello, World!"))
)
```

- Premier argument : le contrat de référence
- Deuxième argument : le nom du groupe à implémenter
- Troisième argument : une fonction qui reçoit les handlers et les implémente un par un

Si `"sayHello"` n'existe pas dans le contrat `MyApi`, TypeScript signale une erreur.

---

## Le layer — `HttpLayerRouter`

```typescript
const apiLayer = pipe(
  HttpLayerRouter.addHttpApi(MyApi),  // branche le contrat
  Layer.provide(MyApiLive)            // injecte l'implémentation
)
```

Ce layer est ensuite converti en handler HTTP pour les tests — ou fourni à un serveur pour la production.

---

## `HttpApiClient` — tester sans serveur

Pour les tests, `HttpLayerRouter.toWebHandler` crée un handler en mémoire. On le branche sur un `FetchHttpClient` personnalisé pour intercepter les requêtes :

```typescript
const { dispose, handler } = HttpLayerRouter.toWebHandler(apiLayer, { disableLogger: true })

const TestHttpClient = pipe(
  FetchHttpClient.layer,
  Layer.provide(
    Layer.succeed(
      FetchHttpClient.Fetch,
      (input, init) => handler(new Request(input as string, init))
    )
  )
)
```

Le `handler` reçoit une `Request` standard et renvoie une `Response` — sans passer par le réseau.

### Exercice

Créez `TestHttpClient` en substituant `FetchHttpClient.Fetch` par le `handler` local :

```typescript
const TestHttpClient = ??? // À compléter
```

Puis utilisez-le pour appeler `client.greet.sayHello()` :

```typescript
const program = pipe(
  HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.greet.sayHello()),
  Effect.provide(TestHttpClient)
)
```

À vous de jouer !

:::tip Ressources

- [HTTP API](../base-de-connaissance/09-http-api.md)

:::

#### Indice 1

<details>
  <summary>Substituer un service dans un Layer</summary>

`Layer.succeed(FetchHttpClient.Fetch, valeur)` remplace le service `Fetch` par `valeur`.

Ici, `valeur` est une fonction `(input, init) => handler(new Request(input as string, init))`.

</details>

#### Indice 2

<details>
  <summary>Squelette</summary>

```typescript
const TestHttpClient = pipe(
  FetchHttpClient.layer,
  Layer.provide(
    Layer.succeed(
      FetchHttpClient.Fetch,
      (input, init) => handler(new Request(input as string, init))
    )
  )
)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

```typescript
const TestHttpClient = pipe(
  FetchHttpClient.layer,
  Layer.provide(
    Layer.succeed(
      FetchHttpClient.Fetch,
      (input, init) => handler(new Request(input as string, init))
    )
  )
)

const program = pipe(
  HttpApiClient.make(MyApi, { baseUrl: "http://localhost" }),
  Effect.flatMap((client) => client.greet.sayHello()),
  Effect.provide(TestHttpClient)
)
```

</details>

---

:::tip À retenir

Le découpage en trois couches — contrat, implémentation, layer — est la clé de testabilité :

- Le **contrat** est partagé entre serveur et client (dans `packages/shared`)
- L'**implémentation** peut être substituée en tests sans changer le contrat
- Le **layer** est le câblage — il peut pointer vers un vrai serveur ou un handler en mémoire

:::
