import { Arbitrary, FastCheck, Schema } from "effect"

export const REPLACE_ME__ENCODE_DATA = <T>(input: T): T => input
export const REPLACE_ME__DECODE_DATA = <T>(input: T): T => input

export const REPLACE_ME__MAKE_ARBITRARY = (): FastCheck.Arbitrary<any> => Arbitrary.make(Schema.Struct({}))
export const REPLACE_ME__MAKE_SAMPLE_FROM =
  (_sampleSize: number) => (_arbitrary: FastCheck.Arbitrary<any>): Array<any> =>
    FastCheck.sample(Arbitrary.make(Schema.Struct({})), 0)

