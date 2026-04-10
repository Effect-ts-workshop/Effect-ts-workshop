import { Arbitrary, Brand, Either, ParseResult, pipe, Schema } from "effect"
import { describe, expect, expectTypeOf, it } from "vitest"

import type { ParseOptions } from "effect/SchemaAST"
import fc, { toStringMethod } from "fast-check"

const TODO: any = {}

describe("Schema", () => {
  it.skip("should validate data of all sort", () => {
    // Implement the schema to validate the data
    // #start
    const schema = TODO
    // #solution
    // const schema = Schema.Struct({
    //   name: Schema.String,
    //   age: Schema.Number,
    //   isActive: Schema.Boolean
    // })
    // #end

    const rawData = {
      name: "anyString",
      age: 42,
      isActive: true,
      unknown: "stripped"
    }
    const result = pipe(rawData, Schema.decodeUnknownSync(schema))

    expect(result).toEqual({
      name: "anyString",
      age: 42,
      isActive: true
    })
  })

  it.skip("should print errors for human", () => {
    // Implement the schema to match the expected error
    // #start
    const schema = TODO
    // #solution
    // const schema = Schema.Struct({
    //   user: Schema.Struct({
    //     id: Schema.String,
    //     name: Schema.NonEmptyString
    //   })
    // })
    // #end

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

  it.skip("should format errors as array", () => {
    const schema = Schema.Struct({
      user: Schema.Struct({
        id: Schema.String
      })
    })
    const result = Schema.decodeUnknownEither(schema)({ user: {} })

    // Format errors as array
    // #start
    const errors = pipe(
      result,
      Either.mapLeft(TODO),
      Either.map(() => []),
      Either.getOrElse((error) => error)
    )
    // #solution
    // const errors = pipe(
    //   result,
    //   Either.mapLeft(ParseResult.ArrayFormatter.formatErrorSync),
    //   Either.map(() => []),
    //   Either.getOrElse((error) => error)
    // )
    // #end

    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      "path": ["user", "id"],
      message: "is missing"
    })
  })

  it.skip("can encode and decode value", () => {
    const DataSchema = Schema.Struct({ createdAt: Schema.Date })
    const originalData = { createdAt: new Date("2026-04-22") }

    // Encode originalData with our schema
    // #start
    const dataDto = pipe(originalData, TODO(DataSchema))
    const decodedData = pipe(dataDto, TODO(DataSchema))
    // #solution
    // const dataDto = pipe(originalData, Schema.encodeSync(DataSchema))
    // const decodedData = pipe(dataDto, Schema.decodeSync(DataSchema))
    // #end

    expect(dataDto).toEqual({ createdAt: "2026-04-22T00:00:00.000Z" })
    expect(decodedData).toEqual(originalData)
  })

  it.skip("can easily create arbitrary data for your tests", () => {
    // const DataSchema = Schema.Struct({ createdAt: Schema.DateFromString, name: Schema.NonEmptyTrimmedString })

    // Generate arbitrary data (aka random generator) from the schema
    // #start
    const arbitrary = TODO
    // #solution
    // const arbitrary = Arbitrary.make(DataSchema)
    // #end

    fc.assert(
      fc.property(arbitrary, (originalData) => {
        const dataDto = pipe(originalData, Schema.encodeSync(DataSchema))
        const decodedData = pipe(dataDto, Schema.decodeSync(DataSchema))

        expect(originalData).toEqual(decodedData)
      })
    )
  })

  it.skip("can create your own schema", () => {
    type Email = string & Brand.Brand<"email">
    const Email = Brand.nominal<Email>()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Construct an Email schema using pattern + brand
    // #start
    const EmailSchema = TODO
    // #solution
    // const EmailSchema = pipe(
    //   Schema.String,
    //   Schema.pattern(emailPattern),
    //   Schema.fromBrand(Email)
    // )
    // #end

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
  it.skip("can annotate errors", () => {
    // Identify invalid data
    // #start
    const Person = Schema.Struct({}).annotations(TODO)
    // #solution
    // const Person = Schema.Struct({})
    //   .annotations({ identifier: "Person" })
    // #end

    // When
    const errors = pipe(
      null,
      Schema.decodeUnknownEither(Person),
      Either.mapLeft(ParseResult.ArrayFormatter.formatErrorSync),
      Either.map(() => []),
      Either.getOrElse((error) => error)
    )

    // Then
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      "path": [],
      message: "Expected Person, actual null"
    })
  })
  it.skip("can provide paths to invalid data", () => {
    // #start
    // Identify invalid paths
    const Person = Schema.Struct(TODO)
      .annotations({ identifier: "Person" })
    // #solution
    // const Person = Schema.Struct({
    //   name: Schema.String.annotations({ identifier: "Name" }),
    //   age: Schema.Number.annotations({ identifier: "Age" })
    // })
    //   .annotations({ identifier: "Person" })
    // #end

    const errors = pipe(
      { age: "42" },
      Schema.decodeUnknownEither(Person, { errors: "all" }),
      Either.mapLeft(ParseResult.ArrayFormatter.formatErrorSync),
      Either.map(() => []),
      Either.getOrElse((error) => error)
    )

    expect(errors).toHaveLength(2)
    expect(errors[0]).toMatchObject({
      "path": ["name"],
      message: "is missing"
    })
    expect(errors[1]).toMatchObject({
      "path": ["age"],
      message: "Expected Age, actual \"42\""
    })
  })
  it.skip("can indicate refinement errors", () => {
    // #start
    // Use a refinement that will fail
    const Person = Schema.Struct({
      age: TODO
    })
      .annotations({ identifier: "Person" })
    // #solution
    // const Person = Schema.Struct({
    //   age: Schema.Positive
    // })
    //   .annotations({ identifier: "Person" })
    // #end

    expect(() => pipe({ id: "", age: -2 }, Schema.decodeUnknownSync(Person))).toThrowError(`Person
└─ ["age"]
   └─ Positive
      └─ Predicate refinement failure
         └─ Expected a positive number, actual -2`)
  })
  it.skip("can customize error message", () => {
    // #start
    // Validate with custom message if invalid
    const Person = Schema.Struct({
      strength: TODO
    })
      .annotations({ identifier: "Person" })
    // #solution
    // const Person = Schema.Struct({
    //   strength: Schema.Number.pipe(Schema.lessThanOrEqualTo(9000, { message: () => "is over 9000 !!!" }))
    // })
    //   .annotations({ identifier: "Person" })
    // #end

    expect(() => pipe({ strength: 9001 }, Schema.decodeUnknownSync(Person))).toThrowError(`Person
└─ ["strength"]
   └─ is over 9000 !!!`.trim())
  })
  it("Customize error output", () => {
    // #start
    const Person = Schema.Struct({
      initials: Schema.transformOrFail(
        Schema.String,
        Schema.String.pipe(Schema.maxLength(TODO)),
        TODO
      )
    })
      .annotations({ identifier: "Person" })
    // #solution
    // const Person = Schema.Struct({
    //   initials: Schema.transformOrFail(
    //     Schema.String,
    //     Schema.String.pipe(Schema.maxLength(2)),
    //     {
    //       strict: true,
    //       decode: (s, _, ast) =>
    //         s.length > 0
    //           ? ParseResult.succeed(s)
    //           : ParseResult.fail(new ParseResult.Type(ast, s)),
    //       encode: ParseResult.succeed
    //     }
    //   )
    // })
    //   .annotations({ identifier: "Person" })
    // #end

    expect(() => pipe({ initials: null }, Schema.decodeUnknownSync(Person)))
      .toThrowError(`Person
└─ ["initials"]
   └─ (string <-> maxLength(2))
      └─ Encoded side transformation failure
         └─ Expected string, actual null`)

    expect(() => pipe({ initials: "" }, Schema.decodeUnknownSync(Person)))
      .toThrowError(`Person
└─ ["initials"]
   └─ (string <-> maxLength(2))
      └─ Transformation process failure
         └─ Expected (string <-> maxLength(2)), actual ""`)

    expect(() => pipe({ initials: "ACL" }, Schema.decodeUnknownSync(Person)))
      .toThrowError(`Person
└─ ["initials"]
   └─ (string <-> maxLength(2))
      └─ Type side transformation failure
         └─ maxLength(2)
            └─ Predicate refinement failure
               └─ Expected a string at most 2 character(s) long, actual "ACL"`)
  })
})
