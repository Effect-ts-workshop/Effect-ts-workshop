import type { FastCheck } from "effect"
import { Arbitrary, pipe, Schema } from "effect"
import { ParseError } from "effect/ParseResult"
import { describe, expect, it } from "vitest"
import { createObjectMatching, DESCRIBE_ME, validateTeam } from "../sandbox"

import {
  REPLACE_ME__DECODE_DATA,
  REPLACE_ME__ENCODE_DATA,
  REPLACE_ME__MAKE_ARBITRARY,
  REPLACE_ME__MAKE_SAMPLE_FROM
} from "../placeholder_functions"

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

  it.skip("Encode/Decode", () => {
    // Given
    const DateSchema = Schema.Date
    const date = new Date("2026-04-22")

    // When
    const encodedDate = pipe(
      date,
      REPLACE_ME__ENCODE_DATA
    )
    const decodedDate = pipe(
      encodedDate,
      REPLACE_ME__DECODE_DATA
    )

    // Then
    expect(encodedDate).toBe("2026-04-22T00:00:00.000Z")
    expect(decodedDate).toEqual(date)
  })

  it.skip("Generate arbitrary data", () => {
    // Given
    const sampleSize: number = 50

    const IntegerSchema = Schema.Int.pipe(Schema.between(1, 80))

    type Integer = typeof IntegerSchema.Type

    const isAnInteger = (value: unknown): value is Integer => {
      return Schema.is(IntegerSchema)(value)
    }

    // When
    const generateSampleFromArbitrary = (sampleSize: number) => <A>(arbitrary: FastCheck.Arbitrary<A>) =>
      REPLACE_ME__MAKE_SAMPLE_FROM(sampleSize)(arbitrary)

    const makeArbitraryFromSchema = <A>(_schema: Schema.Schema<A>) => REPLACE_ME__MAKE_ARBITRARY()

    // Then
    expect(
      pipe(
        IntegerSchema,
        makeArbitraryFromSchema,
        generateSampleFromArbitrary(sampleSize)
      )
    ).toHaveLength(sampleSize)
    expect(
      pipe(
        IntegerSchema,
        makeArbitraryFromSchema,
        generateSampleFromArbitrary(sampleSize)
      ).every(isAnInteger)
    ).toBeTruthy()
  })

  it.skip("Custom schema", () => {
    // Given

    const MyTeamSchema = DESCRIBE_ME

    // When
    const sample = createObjectMatching(MyTeamSchema)

    // Then
    expect(validateTeam(sample)).not.toThrow()
  })

  it.todo("Customized error output", () => {
    // surcharger message par défaut + identifier sur objet pour erreur plus lisible (path)
    // Given

    const Person = Schema.Struct({
      name: Schema.NonEmptyString,
      age: Schema.Positive
    }).annotations({ identifier: "Person" })

    // When
    expect(() => Schema.decodeUnknownSync(Person)(null)).toThrow(`Expected Person, actual null`)
    expect(() => Schema.decodeUnknownSync(Person)({}, { errors: "all" })).toThrow(`Person
      ├─ ["name"]
      │  └─ is missing
      └─ ["age"]
      └─ is missing`)
    expect(() => Schema.decodeUnknownSync(Name)(null)).toThrow(`Expected string, actual null`)
    expect(() => Schema.decodeUnknownSync(Age)(null)).toThrow(`Expected number, actual null`)
    expect(() => Schema.decodeUnknownSync(Person)(null)).toThrow(`Expected Person, actual null`)
    // Then
  })
})
