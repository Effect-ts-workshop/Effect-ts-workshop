import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type FormReact } from "@lucas-barake/effect-form-react"
import { Option } from "effect"

export const BrandInput: FormReact.FieldComponent<string> = ({ field }) => (
  <Field data-invalid={Option.isSome(field.error)}>
    <Label htmlFor="brand">Brand</Label>
    <Input
      id="brand"
      value={field.value}
      onChange={(e) =>
        field.onChange(e.target.value)}
      onBlur={field.onBlur}
      placeholder="Enter brand"
      aria-invalid={Option.isSome(field.error)}
    />
    {Option.isSome(field.error) && <FieldError>{field.error.value}</FieldError>}
  </Field>
)

export const ModelInput: FormReact.FieldComponent<string> = ({ field }) => (
  <Field data-invalid={Option.isSome(field.error)}>
    <Label htmlFor="model">Model</Label>
    <Input
      id="model"
      value={field.value}
      onChange={(e) =>
        field.onChange(e.target.value)}
      onBlur={field.onBlur}
      placeholder="Enter model"
      aria-invalid={Option.isSome(field.error)}
    />
    {Option.isSome(field.error) && <FieldError>{field.error.value}</FieldError>}
  </Field>
)
