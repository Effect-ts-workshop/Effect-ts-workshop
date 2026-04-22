import { FetchHttpClient, HttpApiClient, HttpClient } from "@effect/platform"
import { Effect, Layer, Option, pipe } from "effect"
import { Api } from "shared/api"
import { InventoryItemId } from "shared/item"
import { describe, expect, it } from "vitest"

// L'exercice 8 montrait comment définir et tester une API côté serveur (Node.js).
// Ici on est côté client (navigateur) : on consomme une API existante.
//
// Le contrat (Api) est importé depuis "shared" - même source de vérité que le serveur.
// On n'a pas besoin de redéfinir les endpoints.

// ─── Données de test ─────────────────────────────────────────────────────────

const ITEM_1 = {
  id: InventoryItemId("550e8400-e29b-41d4-a716-446655440001"),
  brand: "Devoxx",
  model: "2026"
}

const ITEM_2 = {
  id: InventoryItemId("550e8400-e29b-41d4-a716-446655440002"),
  brand: "Specialized",
  model: "Super Mouse"
}

// ─── Mock fetch ───────────────────────────────────────────────────────────────
// On intercepte fetch pour simuler les réponses du serveur sans démarrer de vrai serveur.
// Note : Option<InventoryItem> s'encode en JSON comme { "_tag": "Some", "value": {...} }

const mockFetch = async (input: RequestInfo | URL): Promise<Response> => {
  const url = input.toString()

  if (/\/items\/[^/]+$/.test(url)) {
    return new Response(
      JSON.stringify({ _tag: "Some", value: ITEM_1 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }

  if (url.endsWith("/items")) {
    return new Response(
      JSON.stringify({ items: [ITEM_1, ITEM_2] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }

  return new Response(null, { status: 404 })
}

// Même mécanique que dans l'exercice 8 (test 2), mais ici on est côté navigateur.
const TestHttpClient = pipe(FetchHttpClient.layer, Layer.provide(Layer.succeed(FetchHttpClient.Fetch, mockFetch)))

// ─── Partie 1 : HttpApiClient ─────────────────────────────────────────────────
//
// HttpApiClient.make génère un client typé à partir du contrat.
// La structure reflète l'organisation en groupes : client.items.getAllItems()
// Si on renomme un endpoint dans shared/api.ts, le compilateur signale l'erreur ici.
describe("HttpApiClient", () => {
  it("calls GET /items and returns the typed list", async () => {
    const program = pipe(
      Effect.gen(function*() {
        const client = yield* HttpApiClient.make(Api, { baseUrl: "http://localhost" })
        return yield* client.items.getAllItems()
      }),
      Effect.provide(TestHttpClient)
    )

    const result = await Effect.runPromise(program)

    expect(result.items).toHaveLength(2)
    expect(result.items[0].brand).toBe("Devoxx")
    expect(result.items[1].brand).toBe("Specialized")
  })

  it("calls GET /items/:itemId and returns an Option<InventoryItem>", async () => {
    const program = pipe(
      Effect.gen(function*() {
        const client = yield* HttpApiClient.make(Api, { baseUrl: "http://localhost" })
        return yield* client.items.getItemById({ path: { itemId: ITEM_1.id } })
      }),
      Effect.provide(TestHttpClient)
    )

    const result = await Effect.runPromise(program)

    // Le contrat déclare addSuccess(Schema.Option(InventoryItemSchema))
    // HttpApiClient désérialise automatiquement la réponse en Option<InventoryItem>
    expect(Option.isSome(result)).toBe(true)
    if (Option.isNone(result)) {
      throw new Error("implement calls get return")
    }
    expect(result.value.brand).toBe("Devoxx")
  })

  it("composes multiple calls with Effect.all", async () => {
    // Effect.all exécute les deux appels en parallèle par défaut
    const program = pipe(
      Effect.gen(function*() {
        const client = yield* HttpApiClient.make(Api, { baseUrl: "http://localhost" })
        return yield* Effect.all({
          list: client.items.getAllItems(),
          single: client.items.getItemById({ path: { itemId: ITEM_1.id } })
        })
      }),
      Effect.provide(TestHttpClient)
    )

    const { list, single } = await Effect.runPromise(program)

    expect(list.items).toHaveLength(2)
    expect(Option.isSome(single)).toBe(true)
  })
})
