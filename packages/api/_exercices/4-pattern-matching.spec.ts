import { Array, Match, Option, pipe } from "effect"
import { describe, expect, it } from "vitest"

describe("Pattern matching", () => {
  it("should handle all possible values", () => {
    // Given
    type NumberField = { type: "number"; value: number }
    type TextField = { type: "text"; value: string }
    type SelectField = { type: "select"; multiple: false; value: string }
    type MultipleSelectField = { type: "select"; multiple: true; value: Array<string> }
    type AnyField =
      | NumberField
      | TextField
      | SelectField
      | MultipleSelectField

    // When
    const getValue = (field: AnyField): string =>
      pipe(
        Match.value(field),
        Match.when({ type: "number" }, (field) => String(field.value)),
        Match.when({ type: "text" }, (field) => field.value),
        Match.when({ type: "select", multiple: true }, (field) => field.value.join(", ")),
        Match.when({ type: "select", multiple: false }, (field) => field.value),
        Match.exhaustive
      )

    // Then
    expect(getValue({ type: "number", value: 42 })).toEqual("42")
    expect(getValue({ type: "text", value: "awesome" })).toEqual("awesome")
    expect(getValue({ type: "select", multiple: false, value: "selected" })).toEqual("selected")
    expect(getValue({ type: "select", multiple: true, value: ["selected", "a", "lot"] })).toEqual("selected, a, lot")
  })

  it("should handle optional value", () => {
    // Given
    const allValues = ["you got me"]

    // When
    const getValueAt = (index: number) =>
      pipe(
        allValues,
        Array.get(index),
        // match here
        Option.match({
          onSome: (v) => v.toUpperCase(),
          onNone: () => `DEFAULT`
        })
      )

    // Then
    expect(getValueAt(0)).toEqual("YOU GOT ME")
    expect(getValueAt(42)).toEqual("DEFAULT")
  })
})
