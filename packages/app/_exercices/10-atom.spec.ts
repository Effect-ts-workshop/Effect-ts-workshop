import { Atom, Registry } from "@effect-atom/atom-react"
import { describe, expect, it } from "vitest"

describe("Atom", () => {
  const r = Registry.make()

  it("should create a state in a registry", () => {
    const counter = Atom.make(0)
    expect(r.get(counter)).toEqual(0)
    r.set(counter, 1)
    expect(r.get(counter)).toEqual(1)
  })

  it("should create a computed value", () => {
    const counter = Atom.make(0)
    const doubled = Atom.map(counter, (v) => v * 2)
    r.set(counter, 9)
    expect(r.get(counter)).toEqual(9)
    expect(r.get(doubled)).toEqual(18)
  })

  it.todo("should create a computed value", () => {
    const counter = Atom.make(0)
    const doubled = Atom.map(counter, (v) => v * 2)
    r.set(counter, 9)
    expect(r.get(counter)).toEqual(9)
    expect(r.get(doubled)).toEqual(18)
  })

  it.todo("should keep alive a value even if there is no subscriber", () => {
    const counter = Atom.make(0)
    const doubled = Atom.map(counter, (v) => v * 2)
    r.set(counter, 9)
    expect(r.get(counter)).toEqual(9)
    expect(r.get(doubled)).toEqual(18)
  })
})
