import type { FastCheck } from "effect"
import { pipe, Schema } from "effect"
import { ParseError } from "effect/ParseResult"
import { describe, expect, it } from "vitest"
import { BASIC_PERSON_SCHEMA__REPLACE_ME, createObjectMatching, DESCRIBE_ME, validateTeam } from "../sandbox"

import type { ParseOptions } from "effect/SchemaAST"
import {
  REPLACE_ME__DECODE_DATA,
  REPLACE_ME__ENCODE_DATA,
  REPLACE_ME__GENERATE_SAMPLE,
  REPLACE_ME__MAKE_ARBITRARY
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

  it.skip("Custom schema", () => {
    // Given

    const MyTeamSchema = DESCRIBE_ME

    // When
    const sample = createObjectMatching(MyTeamSchema)

    // Then
    expect(validateTeam(sample)).not.toThrow()
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
      REPLACE_ME__GENERATE_SAMPLE(sampleSize)(arbitrary)

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

  it.skip("Customize error output", () => {
    // Given
    const Person = BASIC_PERSON_SCHEMA__REPLACE_ME

    // When
    const validatePerson = (input: unknown, parseOptions?: ParseOptions) =>
      Schema.decodeUnknownSync(Person)(input, parseOptions)

    // Then
    expect(() => validatePerson(null)).toThrowError(`Expected Person, actual null`)
    expect(() => validatePerson({}, { errors: "all" })).toThrowError(
      /Person[\s\S]*\["name"\][\s\S]*is missing\S*/
    )
    expect(() => validatePerson({ name: "plop" }, { errors: "all" })).toThrowError(
      /Person[\s\S]*\["age"\][\s\S]*is missing\S*/
    )
    expect(() => validatePerson({ name: null, age: 23 }, { errors: "all" })).toThrowError(
      `Expected Name, actual null`
    )
    expect(() => validatePerson({ name: "plop", age: null }, { errors: "all" })).toThrowError(
      `Expected Age, actual null`
    )
    expect(() => validatePerson({ name: "plop", age: 10, strength: 9000, id: "" })).toThrowError(
      /Person[\s\S]*\["id"\][\s\S]*NonEmptyString[\s\S]*Predicate refinement failure[\s\S]*Expected a non empty string, actual ""/
    )
    expect(() => validatePerson({ name: "plop", age: 10, strength: 9001, id: "1337" }, { errors: "all" }))
      .toThrowError(
        /Person[\s\S]*\["strength"\][\s\S]*└─ is over 9000 !!!\S*/
      )
    expect(() => validatePerson({ name: "plop", age: 10, strength: 10, id: "N00P", initials: null }, { errors: "all" }))
      .toThrowError(
        /Person[\s\S]*\["initials"\][\s\S]*\(string <-> maxLength\(2\)\)[\s\S]*Encoded side transformation failure[\s\S]*Expected string, actual null\S*/
      )
    expect(() => validatePerson({ name: "plop", age: 10, strength: 10, id: "N00P", initials: "" }, { errors: "all" }))
      .toThrowError(
        /Person[\s\S]*\["initials"\][\s\S]*\(string <-> maxLength\(2\)\)[\s\S]*Transformation process failure[\s\S]*Expected \(string <-> maxLength\(2\)\), actual ""\S*/
      )
    expect(() =>
      validatePerson({ name: "plop", age: 10, strength: 10, id: "N00P", initials: "ACL" }, { errors: "all" })
    )
      .toThrowError(
        /Person[\s\S]*\["initials"\][\s\S]*\(string <-> maxLength\(2\)\)[\s\S]*Type side transformation failure[\s\S]*maxLength\(2\)[\s\S]*Predicate refinement failure[\s\S]*Expected a string at most 2 character\(s\) long, actual "ACL"\S*/
      )
  })
})
