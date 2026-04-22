---
sidebar_position: 16
---

# Observabilité

Dans un programme asynchrone, comprendre _ce qui s'est passé_ est souvent plus dur que d'écrire le code lui-même. Un bug en production ? Une lenteur inexplicable ? Sans traces, on navigue à l'aveugle.

Effect intègre l'observabilité au cœur du runtime, via [OpenTelemetry](https://opentelemetry.io/). Pas de bibliothèque à brancher manuellement - le mécanisme est là par défaut, il suffit de l'activer.

## Les `span` - l'unité de base

Un `span` représente une opération dans le temps : un nom, une durée, des attributs. Les `span` s'imbriquent pour former un `trace` - l'arbre complet d'une requête, du point d'entrée jusqu'aux feuilles.

<!-- prettier-ignore -->
```typescript
//  [  fetchJoke  - 230ms                     ]
//    [  HttpClient.get  - 210ms  ]
//      [  response.json  - 5ms  ]
```

## `Effect.fn` - tracing automatique

Quand on passe un nom à `Effect.fn`, chaque appel crée automatiquement un `span` :

<!-- prettier-ignore -->
```typescript
const getUser = Effect.fn("getUser")(function* (id: string) {
  const row = yield* sql`SELECT * FROM users WHERE id = ${id}`;
  return row;
});

// Chaque appel à getUser apparaît dans Jaeger comme un span "getUser"
// avec sa durée, ses erreurs éventuelles, et les spans enfants imbriqués.
```

Sans nom, pas de `span`. C'est la seule différence entre `Effect.fn("name")(...)` et `Effect.fn(...)`.

## `Effect.withSpan` - span manuel

Pour instrumenter un bloc qui n'est pas une fonction `Effect.fn`, on peut créer un `span` manuellement :

<!-- prettier-ignore -->
```typescript
const processItems = (items: Item[]) =>
  pipe(
    Effect.forEach(items, processItem),
    Effect.withSpan("processItems", {
      attributes: { count: items.length },
    }),
  );
```

Les attributs apparaissent dans l'UI Jaeger et permettent de filtrer ou de comprendre le contexte d'une exécution.

## Visualiser les traces

Dans ce workshop, les traces sont visibles dans **Jaeger** : [http://localhost:16686](http://localhost:16686)

1. Sélectionner le service `api` dans le menu déroulant
2. Cliquer sur **Find Traces**
3. Cliquer sur un `trace` pour voir l'arbre des `span`

Les `span` créés par `Effect.fn` apparaissent avec le nom passé en argument. Les erreurs non rattrapées marquent le `span` en rouge.

## Brancher le layer de tracing

Pour que les `span` soient exportés vers Jaeger, il faut fournir le layer `NodeSdk` au programme :

<!-- prettier-ignore -->
```typescript
import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

const TracingLive = NodeSdk.layer(() => ({
  resource: { serviceName: "api" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}));

pipe(
  myProgram,
  Effect.provide(TracingLive),
  Effect.runPromise,
);
```

Sans ce layer, les `span` existent en mémoire mais ne sont pas exportés - les appels à `Effect.fn("name")` restent valides, ils ne produisent simplement rien dans Jaeger.
