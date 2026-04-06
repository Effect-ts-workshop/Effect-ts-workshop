import { Atom, AtomHttpApi, Registry, Result } from "@effect-atom/atom-react"
import { BrowserHttpClient } from "@effect/platform-browser"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Effect } from "effect"
import { Api } from "shared/api"
import { describe, expect, it, vi } from "vitest"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TODO: any = {}

describe("Atom", () => {
  describe("Atom core", () => {
    const r = Registry.make()

    it("should create a state in a registry", () => {
      // #start
      const counter = TODO
      // #solution
      // const counter = Atom.make(0)
      // #end

      expect(r.get(counter)).toEqual(0)
    })

    it("should update a state", () => {
      const counter = Atom.make(0)
      // #start
      TODO(counter, 1)
      // #solution
      // r.set(counter, 1)
      // #end

      expect(r.get(counter)).toEqual(1)
    })

    it("should create a computed value", () => {
      const counter = Atom.make(0)

      // #start
      const doubled = TODO
      // #solution
      // const doubled = Atom.make((get) => get(counter) * 2)
      // #end

      r.set(counter, 9)
      expect(r.get(counter)).toEqual(9)
      expect(r.get(doubled)).toEqual(18)
    })

    it("should tranform a value (like creating a computed value)", () => {
      const counter = Atom.make(0)

      // #start
      const doubled = TODO
      // #solution
      // const doubled = Atom.map(counter, (v) => v * 2)
      // #end

      r.set(counter, 9)
      expect(r.get(counter)).toEqual(9)
      expect(r.get(doubled)).toEqual(18)
    })

    it("should handle function to tranform value", () => {
      const increment = (count: number) => count + 1

      // #start
      const next = TODO
      // #solution
      // const next = Atom.fnSync(increment, { initialValue: 0 })
      // #end

      r.set(next, 0)
      expect(r.get(next)).toEqual(1)
    })

    it("should handle effect", () => {
      const effect = Effect.succeed(2)

      // #start
      const counter = TODO
      // #solution
      // const counter = Atom.make(effect)
      // #end

      // When creating an atom from an effect, you automatically receive a type Result
      const value: Result.Result<number, unknown> = r.get(counter)
      if (!Result.isSuccess(value)) {
        throw new Error("fail")
      }
      expect(value.value).toEqual(2)
    })

    it("should be notified on value change", async () => {
      const listener = vi.fn()
      const counter = Atom.make(0)

      // #start
      TODO(counter, listener)
      // #solution
      // r.subscribe(counter, listener)
      // #end

      r.set(counter, 9)
      expect(listener).toHaveBeenCalled()
      expect(listener).toHaveBeenCalledWith(9)
    })

    it("should keep alive a value even if there is no subscriber", async () => {
      const initialAtom = Atom.make(0)

      // #start
      const aliveAtom = TODO
      // #solution
      // const aliveAtom = Atom.keepAlive(initialAtom)
      // #end

      r.set(initialAtom, 9)
      r.set(aliveAtom, 9)
      await Promise.resolve(undefined) // Let auto clean function time to run
      expect(r.get(initialAtom)).toEqual(0)
      expect(r.get(aliveAtom)).toEqual(9)
    })
  })

  describe("Atom react", () => {
    it("should read value from simple Atom", () => {
      const atom = Atom.make(42)

      function TestComponent() {
        // #start
        const value = TODO(atom)
        // #solution
        // const value = useAtomValue(atom)
        // #end
        return <div data-testid="value">{value}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("value")).toHaveTextContent("42")
    })

    it("should update when Atom value changes", async () => {
      const atom = Atom.make(0)

      function TestComponent() {
        // #start
        const [value, setValue] = TODO(atom)
        // #solution
        // const [value, setValue] = useAtom(atom)
        // #end
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

    it("should integrate nicely with api client", async () => {
      class DemoClient extends AtomHttpApi.Tag<DemoClient>()("DemoClient", {
        api: Api,
        httpClient: BrowserHttpClient.layerXMLHttpRequest, // mocked data will not work with standard FetchHttpClient
        baseUrl: "http://vitest.mock"
      }) {}

      function TestComponent() {
        // #start
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = TODO as Result.Result<{ items: any[] }, any>
        // #solution
        // const result = useAtomValue(DemoClient.query("items", "getAllItems", { reactivityKeys: ["items"] }))
        // #end

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
