import { Effect } from "effect"
import { UserService } from "./users-repository"

export const program = Effect.gen(function*() {
  const userService = yield* UserService
  const users = yield* userService.getUsers
  console.log("COUCOU Users:", users)
})
