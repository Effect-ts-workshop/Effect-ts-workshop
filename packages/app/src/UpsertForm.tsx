import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react"
import { Effect, Option } from "effect"
import { InventoryItemId, InventoryItemSchema } from "shared/item"
import { Field, FieldError } from "./components/ui/field"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { ApiClient } from "./lib/client"
import type { InventoryItem } from "./types/inventory"

const upsertFormBuilder = FormBuilder.empty
  .addField("brand", InventoryItemSchema.fields.brand)
  .addField("model", InventoryItemSchema.fields.model)

export const upsertForm = FormReact.make(upsertFormBuilder, {
  fields: {
    brand: ({ field }) => (
      <Field data-invalid={Option.isSome(field.error)}>
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          placeholder="Enter brand"
          aria-invalid={Option.isSome(field.error)}
        />
        {Option.isSome(field.error) && <FieldError>{field.error.value}</FieldError>}
      </Field>
    ),
    model: ({ field }) => (
      <Field data-invalid={Option.isSome(field.error)}>
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          placeholder="Enter model"
          aria-invalid={Option.isSome(field.error)}
        />
        {Option.isSome(field.error) && <FieldError>{field.error.value}</FieldError>}
      </Field>
    )
  },
  onSubmit: ({ editingItem }: { editingItem: InventoryItem | null }, { decoded, get }) =>
    Effect.gen(function*() {
      if (editingItem) {
        yield* get.setResult(
          ApiClient.mutation("items", "updateItemById"),
          {
            path: { itemId: editingItem.id },
            payload: { brand: decoded.brand, model: decoded.model },
            reactivityKeys: ["items"]
          }
        )
      } else {
        yield* get.setResult(
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
      }
    })
})
