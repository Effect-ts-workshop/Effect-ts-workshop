import { Arbitrary, Brand, Either, ParseResult, pipe, Schema } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

import fc from "fast-check"

describe("Schema", () => {
  it("should validate data of all sort", () => {
    // Implement the schema to validate the data
    const schema = Schema.Struct({
      name: Schema.String,
      age: Schema.Number,
      isActive: Schema.Boolean
    })

    const rawData = {
      name: "anyString",
      age: 42,
      isActive: true,
      unknown: "stripped"
    }
    const result = Schema.decodeUnknownSync(schema)(rawData)

    expect(result).toEqual({
      name: "anyString",
      age: 42,
      isActive: true
    })
  })

  it("should print errors for human", () => {
    // Implement the schema to match the expected error
    const schema = Schema.Struct({
      user: Schema.Struct({
        id: Schema.String,
        name: Schema.NonEmptyString
      })
    })

    const result = Schema.decodeUnknownEither(schema, { errors: "all" })({ user: {} })

    if (!Either.isLeft(result)) {
      throw new Error("fail test")
    }
    expect(result.left.toString()).toEqual(`
{ readonly user: { readonly id: string; readonly name: NonEmptyString } }
└─ ["user"]
   └─ { readonly id: string; readonly name: NonEmptyString }
      ├─ ["id"]
      │  └─ is missing
      └─ ["name"]
         └─ is missing
`.trim())
  })

  it("can encode and decode value", () => {
    // Encode originalData with our schema
    const DataSchema = Schema.Struct({ createdAt: Schema.Date })
    const originalData = { createdAt: new Date("2026-04-22") }

    const dataDto = Schema.encodeSync(DataSchema)(originalData)
    const decodedData = Schema.decodeSync(DataSchema)(dataDto)

    expect(dataDto).toEqual({ createdAt: "2026-04-22T00:00:00.000Z" })
    expect(decodedData).toEqual(originalData)
  })

  it("can customize error message", () => {
    // Validate with custom message if invalid
    const Person = Schema.Struct({
      strength: pipe(Schema.Number, Schema.lessThanOrEqualTo(9000, { message: () => "is over 9000 !!!" }))
    })
      .annotations({ identifier: "Person" })

    expect(() => Schema.decodeUnknownSync(Person)({ strength: 9001 })).toThrow(`Person
└─ ["strength"]
   └─ is over 9000 !!!`.trim())
  })

  it("[OPTIONAL] can indicate refinement errors", () => {
    // Define a refinement schema that will fail
    const notAPerson = { id: "", age: -2 }
    const Person = Schema.Struct({
      age: Schema.Positive
    })
      .annotations({ identifier: "Person" })

    expect(() => Schema.decodeUnknownSync(Person)(notAPerson)).toThrow(`Person
└─ ["age"]
   └─ Positive
      └─ Predicate refinement failure
         └─ Expected a positive number, actual -2`)
  })

  it("[OPTIONAL] should format errors as array", () => {
    // Format errors as array
    const schema = Schema.Struct({
      user: Schema.Struct({
        id: Schema.String
      })
    })

    const result = Schema.decodeUnknownEither(schema)({ user: {} })
    const errors = Either.match(result, {
      onLeft: ParseResult.ArrayFormatter.formatErrorSync,
      onRight: () => []
    })

    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      "path": ["user", "id"],
      message: "is missing"
    })
  })

  it("[OPTIONAL] can easily create arbitrary data for your tests", () => {
    // Generate arbitrary data (aka random generator) from the schema
    const DataSchema = Schema.Struct({ createdAt: Schema.DateFromString, name: Schema.NonEmptyTrimmedString })

    const arbitrary = Arbitrary.make(DataSchema)

    fc.assert(
      fc.property(arbitrary, (originalData) => {
        const dataDto = Schema.encodeSync(DataSchema)(originalData)
        const decodedData = Schema.decodeSync(DataSchema)(dataDto)

        expect(originalData).toEqual(decodedData)
      })
    )
  })

  it("[OPTIONAL] can create your own schema", () => {
    // Construct an Email schema using pattern + brand
    type Email = string & Brand.Brand<"email">
    const Email = Brand.nominal<Email>()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const EmailSchema = pipe(
      Schema.String,
      Schema.pattern(emailPattern),
      Schema.fromBrand(Email)
    )

    const data = Schema.decodeUnknownSync(EmailSchema)("user@example.com")
    const failureResult = Schema.decodeUnknownEither(EmailSchema)("user@example")

    expect(data).toEqual("user@example.com")
    expectTypeOf(data).toExtend<Email>()
    expect(Either.isLeft(failureResult)).toBeTruthy()
  })

  it("[OPTIONAL] can enhance clarity in error messages", () => {
    // Annotate schema with an identifier
    const Person = Schema.Struct({})
      .annotations({ identifier: "Person" })

    const result = Schema.decodeUnknownEither(Person)(null)
    const errors = Either.match(result, {
      onLeft: ParseResult.ArrayFormatter.formatErrorSync,
      onRight: () => []
    })

    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      "path": [],
      message: "Expected Person, actual null"
    })
  })

  it("[OPTIONAL] can provide paths to invalid data", () => {
    // Annotate schema's paths with identifiers
    const Person = Schema.Struct({
      name: Schema.String,
      age: Schema.Number
    })
      .annotations({ identifier: "Person" })

    const result = Schema.decodeUnknownEither(Person, { errors: "all" })({ age: "42" })
    const errors = Either.match(result, {
      onLeft: ParseResult.ArrayFormatter.formatErrorSync,
      onRight: () => []
    })

    expect(errors).toHaveLength(2)
    expect(errors[1]).toMatchObject({
      "path": ["age"],
      message: "Expected number, actual \"42\""
    })
    expect(errors[0]).toMatchObject({
      "path": ["name"],
      message: "is missing"
    })
  })
})
