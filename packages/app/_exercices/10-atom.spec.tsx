import { Atom, AtomHttpApi, Registry, Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import { HttpClient, HttpClientResponse } from "@effect/platform"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Duration, Effect, Layer, pipe } from "effect"
import { randomUUID } from "node:crypto"
import { Api } from "shared/api"
import { TODO } from "shared/utils"
import { describe, expect, it, vi } from "vitest"

describe("Atom", () => {
  describe("Atom core", () => {
    const r = Registry.make()

    it.skip("should create a state in a registry", () => {
      const counter = TODO

      expect(r.get(counter)).toEqual(0)
    })

    it.skip("should update a state", () => {
      const counter = Atom.make(0)
      TODO(counter, 1)

      expect(r.get(counter)).toEqual(1)
    })

    it.skip("should create a computed value", () => {
      const counter = Atom.make(0)

      const doubled = TODO

      r.set(counter, 9)
      expect(r.get(counter)).toEqual(9)
      expect(r.get(doubled)).toEqual(18)
    })

    it.skip("should tranform a value (like creating a computed value)", () => {
      const counter = Atom.make(0)

      const doubled = TODO

      r.set(counter, 9)
      expect(r.get(counter)).toEqual(9)
      expect(r.get(doubled)).toEqual(18)
    })

    it.skip("should handle function to tranform value", () => {
      const increment = (count: number) => count + 1

      const next = TODO

      r.set(next, 0)
      expect(r.get(next)).toEqual(1)
    })

    it.skip("should handle effect", () => {
      const effect = Effect.succeed(2)

      const counter = TODO

      // When creating an atom from an effect, you automatically receive a type Result
      const value: Result.Result<number, unknown> = r.get(counter)
      if (!Result.isSuccess(value)) {
        throw new Error("fail")
      }
      expect(value.value).toEqual(2)
    })

    it.skip("should be notified on value change", async () => {
      const listener = vi.fn()
      const counter = Atom.make(0)

      TODO(counter, listener)

      r.set(counter, 9)
      expect(listener).toHaveBeenCalled()
      expect(listener).toHaveBeenCalledWith(9)
    })

    it.skip("should keep alive a value even if there is no subscriber", async () => {
      const initialAtom = Atom.make(0)

      const aliveAtom = TODO

      r.set(initialAtom, 9)
      r.set(aliveAtom, 9)
      await Promise.resolve(undefined) // Let auto clean function time to run
      expect(r.get(initialAtom)).toEqual(0)
      expect(r.get(aliveAtom)).toEqual(9)
    })
  })

  describe("Atom react", () => {
    it.skip("should read value from simple Atom", () => {
      const atom = Atom.make(42)

      function TestComponent() {
        const value = TODO(atom)
        return <div data-testid="value">{value}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("value")).toHaveTextContent("42")
    })

    it.skip("should update when Atom value changes", async () => {
      const atom = Atom.make(0)

      function TestComponent() {
        const [value, setValue] = TODO(atom)
        return (
          <>
            <div data-testid="value">{value}</div>
            <button data-testid="trigger" onClick={() => setValue((v: number) => v + 1)}>increment</button>
          </>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("value")).toHaveTextContent("0")
      act(() => {
        screen.getByTestId("trigger").click()
      })
      expect(screen.getByTestId("value")).toHaveTextContent("1")
    })

    it.skip("should integrate nicely with api client", async () => {
      const mockClient = HttpClient.make((request) =>
        pipe(
          Effect.sleep(Duration.millis(100)),
          Effect.map(() =>
            HttpClientResponse.fromWeb(
              request,
              new Response(
                JSON.stringify({ items: [{ id: randomUUID(), brand: "Mock Brand", model: "Mock Model" }] }),
                {
                  status: 200,
                  headers: { "content-type": "application/json" }
                }
              )
            )
          )
        )
      )
      const MockedHttpClient = Layer.succeed(HttpClient.HttpClient, mockClient)
      class DemoClient extends AtomHttpApi.Tag<DemoClient>()("DemoClient", {
        api: Api,
        httpClient: MockedHttpClient,
        baseUrl: "http://my-url.mock"
      }) {}

      function TestComponent() {
        const result = TODO as Result.Result<{ items: Array<any> }, any>

        return (
          <div data-testid="value">
            {Result.builder(result)
              .onInitial(() => <div>Initial loading...</div>)
              .onSuccess(({ items }) => (
                <>
                  <h1>Success</h1>
                  <ul>
                    {items.map((item) => <li key={item.id}>{item.brand} {item.model}</li>)}
                  </ul>
                </>
              ))
              .render()}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId("value")).toHaveTextContent("Initial loading...")
      await waitFor(() => expect(screen.getByTestId("value")).toHaveTextContent("Success"))
    })
  })
})
