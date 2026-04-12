import { // AtomHttpApi,
  RegistryProvider,
  Result,
  useAtomValue
} from "@effect-atom/atom-react"
import { FetchHttpClient, HttpApiClient } from "@effect/platform"
import { render, screen, waitFor } from "@testing-library/react"
import { Effect, Layer, Option, pipe } from "effect"
import { Api } from "shared/api"
import { InventoryItemId } from "shared/item"
import { describe, expect, it } from "vitest"

// L'exercice 8 montrait comment définir et tester une API côté serveur (Node.js).
// Ici on est côté client (navigateur) : on consomme une API existante.
//
// Le contrat (Api) est importé depuis "shared" — même source de vérité que le serveur.
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TODO: any = {}

describe("HttpApiClient", () => {
  it.skip("appelle GET /items et retourne la liste typée", async () => {
    // #start
    const program = TODO
    // #solution
    // const program = pipe(
    //   HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
    //   Effect.flatMap((client) => client.items.getAllItems()),
    //   Effect.provide(TestHttpClient)
    // )
    // #end

    const result = await Effect.runPromise(program)

    expect(result.items).toHaveLength(2)
    expect(result.items[0].brand).toBe("Devoxx")
    expect(result.items[1].brand).toBe("Specialized")
  })

  it.skip("appelle GET /items/:itemId et retourne un Option<InventoryItem>", async () => {
    // #start
    const program = TODO
    // #solution
    // const program = pipe(
    //   HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
    //   Effect.flatMap((client) => client.items.getItemById({ path: { itemId: ITEM_1.id } })),
    //   Effect.provide(TestHttpClient)
    // )
    // #end

    const result = await Effect.runPromise(program)

    // Le contrat déclare addSuccess(Schema.Option(InventoryItemSchema))
    // HttpApiClient désérialise automatiquement la réponse en Option<InventoryItem>
    expect(Option.isSome(result)).toBe(true)
    if (Option.isSome(result)) {
      expect(result.value.brand).toBe("Devoxx")
    }
  })

  it.skip("compose plusieurs appels avec Effect.all", async () => {
    // Effect.all exécute les deux appels en parallèle par défaut
    const program = pipe(
      HttpApiClient.make(Api, { baseUrl: "http://localhost" }),
      Effect.flatMap((client) =>
        // #start
        Effect.all(TODO)
        // #solution
        // Effect.all({
        //   list: client.items.getAllItems(),
        //   single: client.items.getItemById({ path: { itemId: ITEM_1.id } })
        // })
        // #end
      ),
      Effect.provide(TestHttpClient)
    )

    const { list, single } = await Effect.runPromise(program)

    expect(list.items).toHaveLength(2)
    expect(Option.isSome(single)).toBe(true)
  })
})
