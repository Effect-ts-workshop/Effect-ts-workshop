import { Effect, pipe, Schema } from "effect"
import { describe, expect, it } from "vitest"

describe("Schema", () => {
  it("Validate data", () => {
    // Given
    const number_one = 3
    const number_two = "two"

    // When
    const program_one = pipe(number_one, Schema.decodeUnknown(Schema.Number))
    const program_two = pipe(number_two, Schema.decodeUnknown(Schema.Number))

    // Then
    expect(Effect.runSync(program_one)).toEqual(3)
    expect(Effect.runSync(program_two)).toThrow()
  })

  it("Custom schema", () => {
    // Given
    // When
    // Then
  })

  it("Encode/Decode", () => {
    // Given
    // When
    // Then
  })

  it("Arbitrary data", () => {
    // Given
    // When
    // Then
  })

  it("Customized error output", () => {
    // Given
    // When
    // Then
  })
})
