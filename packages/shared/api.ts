import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { pipe, Schema } from "effect";
import { InventoryItemIdSchema, InventoryItemSchema } from "./item.ts";

export const Api = HttpApi.make("Api").add(
  HttpApiGroup.make("items")
    .add(
      HttpApiEndpoint.post("addItem", "/items").setPayload(InventoryItemSchema),
    )
    .add(
      HttpApiEndpoint.get("getAllItems", "/items").addSuccess(
        Schema.Struct({ items: Schema.Array(InventoryItemSchema) }),
      ),
    )
    .add(
      HttpApiEndpoint.get("getItemById", "/items/:itemId")
        .setPath(
          Schema.Struct({
            itemId: InventoryItemIdSchema,
          }),
        )
        .addSuccess(Schema.Option(InventoryItemSchema)),
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
