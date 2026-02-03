import { Brand, Schema } from "effect"

export type InventoryItemId = string & Brand.Brand<"inventory_item_id">
export const InventoryItemId = Brand.nominal<InventoryItemId>()

export const InventoryItemIdSchema = Schema.UUID.pipe(
  Schema.fromBrand(InventoryItemId, {
    jsonSchema: {
      format: "uuid"
    }
  })
)

export const InventoryItemSchema = Schema.Struct({
  id: InventoryItemIdSchema,
  brand: Schema.String,
  model: Schema.String
})

export const getItemByIdResponseSchema = Schema.Option(InventoryItemSchema)

export const getAllItemsResponseSchema = Schema.Struct({
  items: Schema.Array(InventoryItemSchema)
})
