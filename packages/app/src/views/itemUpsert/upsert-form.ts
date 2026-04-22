import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react"
import { InventoryItemId, InventoryItemSchema } from "shared/item"
import { ApiClient } from "../../lib/client"
import type { InventoryItem } from "../../types/inventory"
import { BrandInput, ModelInput } from "./FormFields"

const upsertFormBuilder = FormBuilder.empty
  .addField("brand", InventoryItemSchema.fields.brand)
  .addField("model", InventoryItemSchema.fields.model)

export const updateForm = FormReact.make(upsertFormBuilder, {
  fields: {
    brand: BrandInput,
    model: ModelInput
  },
  onSubmit: ({ editingItem }: { editingItem: InventoryItem }, { decoded, get }) =>
    get.setResult(
      ApiClient.mutation("items", "updateItemById"),
      {
        path: { itemId: editingItem.id },
        payload: { brand: decoded.brand, model: decoded.model },
        reactivityKeys: ["items"]
      }
    )
})

export const createForm = FormReact.make(upsertFormBuilder, {
  fields: {
    brand: BrandInput,
    model: ModelInput
  },
  onSubmit: (_, { decoded, get }) =>
    get.setResult(
      ApiClient.mutation("items", "addItem"),
      {
        payload: {
          id: InventoryItemId(crypto.randomUUID()),
          brand: decoded.brand,
          model: decoded.model
        },
        reactivityKeys: ["items"]
      }
    )
})
