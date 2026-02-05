import { SqlClient } from "@effect/sql"
import type { SqlError } from "@effect/sql/SqlError"
import { Context, Effect, Layer } from "effect"

export type User = {
  id: number
  name: string
}

export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    getUsers: Effect.Effect<ReadonlyArray<User>, SqlError, never>
  }
>() {}

const makeUserService = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  // Ici, sql`...` est de type Effect<ReadonlyArray<User>, SqlError, SqlClient>
  const getUsers = sql<{
    readonly id: number
    readonly name: string
  }>`
    SELECT id, name
    FROM users
    ORDER BY id
  `

  return { getUsers }
})

export const UserServiceLive = Layer.effect(UserService, makeUserService)

// import { SqlClient } from "@effect/sql"
// import { Context, Effect, Layer } from "effect"

// export interface User {
//   id: number
//   name: string
// }

// export class UserService extends Context.Tag("UserService")<
//   UserService,
//   {
//     getUsers: () => Effect.Effect<Array<User>, never>
//   }
// >() {}

// const makeUserService = Effect.gen(function*() {
//   const sql = yield* SqlClient.SqlClient
//   const getUsers = () =>
//     sql.run(
//       sql<Array<User>>`
//         SELECT id, name
//         FROM users
//         ORDER BY id
//       `
//     )

//   return { getUsers }
// })

// export const UserServiceLive = Layer.effect(UserService, makeUserService)

// import { RepositoryError } from "@comet/effect-utils"
// import { now } from "@comet/luxon"
// import type { Context } from "effect"
// import { Array, Effect, HashMap, Layer, Option, pipe, Record } from "effect"
// import { db, executeQueryEffect } from "../../database"
// import { type Lunches, LunchNotFoundError } from "../lunch"
// import { lunchFields, toLunch } from "./lunch-database"
// import { lunchVoucherFields, toLunchVoucher } from "./lunch-voucher-database"

// export interface User {
//   id: number
//   name: string
// }

// const tableName = "cobureau_lunches"

// export const usersLive: Context.Tag.Service<Array<User>> = {
//   getAllLunches: Effect.fn(function*(interval) {
//     const query = db
//       .selectFrom(tableName)
//       .innerJoin(
//         "cobureau_lunch_vouchers",
//         "cobureau_lunch_vouchers.salesforce_event_id",
//         "cobureau_lunches.salesforce_event_id"
//       )
//       .where("cobureau_lunches.date", ">=", interval.start.toJSDate())
//       .where("cobureau_lunches.date", "<=", interval.end.toJSDate())
//       .select([...lunchFields, ...lunchVoucherFields])

//     return yield* executeQueryEffect(
//       query,
//       Effect.fn(function*(rs) {
//         return yield* pipe(
//           rs.rows,
//           Array.groupBy((a) => a.lunch__salesforce_event_id),
//           Record.map(
//             Effect.fn(function*(rows) {
//               const lunch = yield* toLunch(rows[0])
//               const teamMembers = yield* pipe(
//                 rows,
//                 Array.map(
//                   Effect.fn(function*(row) {
//                     const lunchVoucher = yield* toLunchVoucher(row)
//                     return [
//                       lunchVoucher.email.toString(),
//                       {
//                         email: lunchVoucher.email,
//                         status: lunchVoucher.status
//                       }
//                     ] as const
//                   })
//                 ),
//                 Effect.all,
//                 Effect.map(HashMap.fromIterable)
//               )
//               return {
//                 ...lunch,
//                 teamMembers
//               }
//             })
//           ),
//           Record.values,
//           Effect.all
//         )
//       })
//     ).pipe(
//       Effect.catchTag(
//         "DatabaseError",
//         (error) => new RepositoryError({ tableName, cause: "Database error", error })
//       )
//     )
//   })
// }
