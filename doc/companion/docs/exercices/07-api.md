---
sidebar_position: 7
---

# Exercice 7 — HTTP API

Nous avons vu comment consommer un service externe. Voici maintenant comment en _définir_ un.

`@effect/platform` sépare le **contrat** (ce que l'API expose) de l'**implémentation** (comment elle répond). Cette séparation garantit que serveur et client restent cohérents — TypeScript le vérifie à la compilation.

Fichier à compléter : `packages/api/_exercices/7-api.spec.ts`

---

## Décrire le contrat de l'API

Le contrat décrit la forme de l'API. Il ne contient aucune logique.

<!-- prettier-ignore -->
```typescript
const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello")
      .addSuccess(Schema.String)
  )
)
```

- `HttpApi.make("MyApi")` — crée l'API racine avec un identifiant
- `HttpApiGroup.make("greet")` — un groupe d'endpoints (correspond souvent à une ressource)
- `HttpApiEndpoint.get("sayHello", "/hello")` — un endpoint GET sur le chemin `/hello`
- `.addSuccess(Schema.String)` — type de la réponse en cas de succès

Ce contrat est la _source de vérité_ : le serveur l'implémente, le client le consomme. Les deux sont garantis cohérents par TypeScript.

---

## Implémenter les handlers

<!-- prettier-ignore -->
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

Si `"sayHello"` n'existe pas dans le contrat `MyApi`, TypeScript signale une erreur. Le contrat est le garant de la cohérence.

---

## Exercice

L'implémentation est fournie. Votre rôle : écrire le **contrat**.

Définissez `MyApi` pour qu'il décrive une route `GET /hello` qui retourne une string, regroupée dans un groupe `"greet"` :

<!-- prettier-ignore -->
```typescript
const MyApi = ??? // À compléter
```

Le test vérifie que :

- l'endpoint `"sayHello"` est bien en `GET` sur `/hello`
- le schema de succès accepte des strings

À vous de jouer !

:::tip Ressources

- [HTTP API](../base-de-connaissance/09-http-api.md)

:::

#### Indice 1

<details>
  <summary>Par où commencer ?</summary>

`HttpApi.make` prend un identifiant et renvoie une API. On y ajoute des groupes avec `.add(...)`.

<!-- prettier-ignore -->
```typescript
const MyApi = HttpApi.make("MyApi").add(
  // votre groupe ici
)
```

</details>

#### Indice 2

<details>
  <summary>Comment définir le groupe et l'endpoint ?</summary>

`HttpApiGroup.make("greet")` crée un groupe. On y ajoute des endpoints avec `.add(...)`.

Pour un endpoint `GET /hello` qui retourne une string :

<!-- prettier-ignore -->
```typescript
HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("greet").add(
    HttpApiEndpoint.get("sayHello", "/hello").addSuccess(Schema.String)
  )
)
```

</details>

---

:::tip À retenir

La séparation contrat / implémentation est la clé de la cohérence :

- Le **contrat** est la source de vérité partagée entre serveur et client (dans `packages/shared`)
- L'**implémentation** peut être substituée en tests sans modifier le contrat
- Si un endpoint n'existe pas dans le contrat, TypeScript refuse de compiler

:::
