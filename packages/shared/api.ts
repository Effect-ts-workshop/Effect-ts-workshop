import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { pipe, Schema } from "effect";
import {
  getAllItemsResponseSchema,
  getItemByIdResponseSchema,
  InventoryItemIdSchema,
  InventoryItemSchema,
} from "./item";

export const Api = HttpApi.make("Api").add(
  HttpApiGroup.make("items")
    .add(
      HttpApiEndpoint.post("addItem", "/items").setPayload(InventoryItemSchema),
    )
    .add(
      HttpApiEndpoint.get("getAllItems", "/items").addSuccess(
        getAllItemsResponseSchema,
      ),
    )
    .add(
      HttpApiEndpoint.get("getItemById", "/items/:itemId")
        .setPath(
          Schema.Struct({
            itemId: InventoryItemIdSchema,
          }),
        )
        .addSuccess(getItemByIdResponseSchema),
    )
    .add(
      HttpApiEndpoint.put("updateItemById", "/items/:itemId")
        .setPath(
          Schema.Struct({
            itemId: InventoryItemIdSchema,
          }),
        )
        .setPayload(pipe(InventoryItemSchema, Schema.omit("id"))),
    )
    .add(
      HttpApiEndpoint.del("removeItemById", "/items/:itemId").setPath(
        Schema.Struct({
          itemId: InventoryItemIdSchema,
        }),
      ),
    ),
);
