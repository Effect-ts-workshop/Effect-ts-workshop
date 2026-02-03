import { Rpc, RpcGroup } from "@effect/rpc"
import {
  getAllItemsResponseSchema,
  getItemByIdResponseSchema,
  InventoryItemIdSchema,
  InventoryItemSchema
} from "./item"

export class ItemRpcs extends RpcGroup.make(
  Rpc.make("addItem", {
    payload: InventoryItemSchema
  }),
  Rpc.make("getAllItems", {
    success: getAllItemsResponseSchema
  }),
  Rpc.make("getItemById", {
    payload: { id: InventoryItemIdSchema },
    success: getItemByIdResponseSchema
  }),
  Rpc.make("updateItem", {
    payload: InventoryItemSchema
  }),
  Rpc.make("removeItemById", {
    payload: { id: InventoryItemIdSchema }
  })
) {}
