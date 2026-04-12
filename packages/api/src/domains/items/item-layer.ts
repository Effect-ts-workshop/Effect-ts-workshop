import { Layer, pipe } from "effect"
import { ItemRepository } from "./db/item-repository"
import { ItemRepositoryDrizzle } from "./db/item-repository-drizzle"
import { itemRoutesLive } from "./item-http"

export const itemLayer = pipe(
  itemRoutesLive,
  Layer.provide(ItemRepository.Default),
  Layer.provide(ItemRepositoryDrizzle.Default)
)
