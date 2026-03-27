import { Arbitrary, FastCheck, pipe, Schema } from "effect"
import { ParseError } from "effect/ParseResult"
import { describe, expect, expectTypeOf, it } from "vitest"
import { ColorSchema, PlayerSchema, type Team, TeamSchema } from "../sandbox"

describe("Schema", () => {
  it.skip("Validate data", () => {
    // Given
    function validateStringOne(n: unknown): number {
      return pipe(n, Schema.decodeUnknownSync(Schema.Number))
    }

    // When
    const program = () => validateStringOne("One")
    const invalidProgram = () => validateStringOne("0ne")

    // Then
    expect(program).not.toThrow()
    expect(invalidProgram).toThrow(ParseError)
  })

  it("Custom schema", () => {
    // Given
    const CustomColorSchema = Schema.String
    const CustomPlayerSchema = Schema.Struct({})
    const CustomTeamSchema = Schema.Struct({})

    // When

    // Then

    expectTypeOf(CustomColorSchema.Type).toEqualTypeOf(ColorSchema.Type)
    expectTypeOf(typeof CustomPlayerSchema.Type["role"]).toEqualTypeOf(typeof PlayerSchema.Type["role"])
    expectTypeOf(typeof CustomTeamSchema.Type["name"]).toEqualTypeOf(typeof TeamSchema.Type["name"])
    expectTypeOf(typeof CustomTeamSchema.Type["color"]).toEqualTypeOf(typeof TeamSchema.Type["color"])
    expectTypeOf(typeof CustomTeamSchema.Type["score"]).toEqualTypeOf(typeof TeamSchema.Type["score"])
    expectTypeOf(typeof CustomTeamSchema.Type["teamMates"]).toEqualTypeOf(typeof Array<typeof PlayerSchema.Type>)
  })

  it("Encode/Decode", () => {
    // Given
    // When
    // Then
  })

  it("Generate arbitrary data", () => {
    // Given
    const PersonSchema = Schema.Struct({
      name: Schema.NonEmptyString,
      age: Schema.Int.pipe(Schema.between(1, 80))
    })

    type Person = typeof PersonSchema.Type

    const person = Arbitrary.make(PersonSchema)
    console.log(person)

    const isAPerson = (value: unknown): value is Person => {
      return Schema.is(PersonSchema)(value)
    }

    // When
    const arbitraryPerson = Arbitrary.make(PersonSchema)
    const someArbitraryPersonsSample = FastCheck.sample(arbitraryPerson, 50)

    // Then
    expect(someArbitraryPersonsSample.every(isAPerson)).toBeTruthy()
  })

  it("Customized error output", () => {
    // surcharger message par défaut + identifier sur objet pour erreur plus lisible (path)
    // Given
    // When
    // Then
  })
})
