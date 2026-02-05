import { useAtomSet, useAtomValue } from "@effect-atom/atom-react"
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react"
import { Effect, Option, pipe, Schema } from "effect"
import { InventoryItemId } from "shared/item"
import { Button } from "./components/ui/button"
import { Field, FieldError } from "./components/ui/field"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { ApiClient } from "./lib/client"
import type { InventoryItem } from "./types/inventory"

const upsertFormBuilder = FormBuilder.empty
  .addField("brand", pipe(Schema.String, Schema.nonEmptyString({ message: () => "Mandatory field" })))
  .addField("model", pipe(Schema.String, Schema.nonEmptyString({ message: () => "Mandatory field" })))

// eslint-disable-next-line react-refresh/only-export-components
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

export function SubmitButton({ editingItem }: { editingItem: InventoryItem | null }) {
  const submitResult = useAtomValue(upsertForm.submit)
  const submit = useAtomSet(upsertForm.submit)
  return (
    <Button type="submit" onClick={() => submit({ editingItem })} disabled={submitResult.waiting}>
      {editingItem ? "Update" : "Add"}
    </Button>
  )
}
