import "@testing-library/jest-dom"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll } from "vitest"

const items = [
  {
    id: randomUUID(),
    brand: "Mock Brand",
    model: "Mock Model"
  }
]

export const restHandlers = [
  http.get("http://vitest.mock/items", () => {
    return HttpResponse.json({ items })
  })
]

const server = setupServer(...restHandlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))

// Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers())
