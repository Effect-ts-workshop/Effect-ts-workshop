import { Atom, Registry, Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { Effect, pipe } from "effect"
import { describe, expect, it, vi } from "vitest"

describe("Atom", () => {
  describe("Atom core", () => {
    const r = Registry.make()

    it("should create a state in a registry", () => {
      const counter = Atom.make(0)
      expect(r.get(counter)).toEqual(0)
      r.set(counter, 1)
      expect(r.get(counter)).toEqual(1)
    })

    it("should create a computed value", () => {
      const counter = Atom.make(0)
      const doubled = Atom.make((get) => get(counter) * 2)
      r.set(counter, 9)
      expect(r.get(counter)).toEqual(9)
      expect(r.get(doubled)).toEqual(18)
    })

    it("should create a computed value", () => {
      const counter = Atom.make(0)
      const doubled = Atom.map(counter, (v) => v * 2)
      r.set(counter, 9)
      expect(r.get(counter)).toEqual(9)
      expect(r.get(doubled)).toEqual(18)
    })

    it("should handle function to tranform value", () => {
      const increment = (count: number) => count + 1
      const next = Atom.fnSync(increment, { initialValue: 0 })
      r.set(next, 0)
      expect(r.get(next)).toEqual(1)
    })

    it("should handle effect", () => {
      // When creating an atom from an effect, you automatically receive a type Result
      const counter = Atom.make(Effect.succeed(2))

      const value = r.get(counter)
      if (!Result.isSuccess(value)) {
        throw new Error("fail")
      }
      expect(value.value).toEqual(2)
    })

    it("should be notified on value change", async () => {
      const listener = vi.fn()
      const counter = Atom.make(0)
      r.subscribe(counter, listener)
      r.set(counter, 9)

      expect(listener).toHaveBeenCalled()
      expect(listener).toHaveBeenCalledWith(9)
    })

    it("should keep alive a value even if there is no subscriber", async () => {
      const counter = pipe(Atom.make(0), Atom.keepAlive)
      r.set(counter, 9)

      // Let auto clean function time to run
      await Promise.resolve(undefined)

      expect(r.get(counter)).toEqual(9)
    })
  })

  describe("Atom react", () => {
    it("should read value from simple Atom", () => {
      const atom = Atom.make(42)

      function TestComponent() {
        const value = useAtomValue(atom)
        return <div data-testid="value">{value}</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId("value")).toHaveTextContent("42")
    })

    it("should update when Atom value changes", async () => {
      const atom = Atom.make(0)

      function TestComponent() {
        const [value, setValue] = useAtom(atom)
        return (
          <>
            <div data-testid="value">{value}</div>
            <button data-testid="trigger" onClick={() => setValue((v) => v + 1)}>increment</button>
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
  })
})
