import { Arbitrary, Brand, Either, ParseResult, pipe, Schema } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

import type { ParseOptions } from "effect/SchemaAST"
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

  it("should format errors as array", () => {
    const schema = Schema.Struct({
      user: Schema.Struct({
        id: Schema.String
      })
    })
    const result = Schema.decodeUnknownEither(schema)({ user: {} })

    // Format errors as array
    const errors = Either.isLeft(result) ? ParseResult.ArrayFormatter.formatErrorSync(result.left) : []

    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      "path": ["user", "id"],
      message: "is missing"
    })
  })

  it("can encode and decode value", () => {
    const DataSchema = Schema.Struct({ createdAt: Schema.Date })
    const originalData = { createdAt: new Date("2026-04-22") }

    // Encode originalData with our schema
    const dataDto = Schema.encodeSync(DataSchema)(originalData)
    const decodedData = Schema.decodeSync(DataSchema)(dataDto)

    expect(dataDto).toEqual({ createdAt: "2026-04-22T00:00:00.000Z" })
    expect(decodedData).toEqual(originalData)
  })

  it("can easily create arbitrary data for your tests", () => {
    const DataSchema = Schema.Struct({ createdAt: Schema.DateFromString, name: Schema.NonEmptyTrimmedString })

    // Generate arbitrary data (aka random generator) from the schema
    const arbitrary = Arbitrary.make(DataSchema)

    fc.assert(
      fc.property(arbitrary, (originalData) => {
        const dataDto = Schema.encodeSync(DataSchema)(originalData)
        const decodedData = Schema.decodeSync(DataSchema)(dataDto)

        expect(originalData).toEqual(decodedData)
      })
    )
  })

  it("can create your own schema", () => {
    type Email = string & Brand.Brand<"email">
    const Email = Brand.nominal<Email>()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Construct an Email schema using pattern + brand
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

  //
  /**
   * TODO
   * - Split in multiple tests
   * - Use ArrayFormatter to avoid rely on regexp
   */
  it.todo("Customize error output", () => {
    const Person = Schema.Struct({
      name: Schema.String.annotations({ identifier: "Name" }),
      age: Schema.Number.annotations({ identifier: "Age" }),
      id: Schema.NonEmptyString,
      strength: Schema.Number.pipe(Schema.lessThanOrEqualTo(9000, { message: () => "is over 9000 !!!" })),
      initials: Schema.String.pipe(Schema.maxLength(2))
    })
      .annotations({ identifier: "Person" })

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
