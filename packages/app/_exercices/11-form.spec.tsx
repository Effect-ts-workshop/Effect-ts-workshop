import { useAtomSet } from "@effect-atom/atom-react"
import { Field, FormBuilder, FormReact } from "@lucas-barake/effect-form-react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { Option, pipe, Schema } from "effect"
import { describe, expect, it, vi } from "vitest"

describe("Form", () => {
  describe("Form core", () => {
    it("should create simple form builder", () => {
      const MyFormBuilder = FormBuilder.empty
        .addField("brand", Schema.NonEmptyTrimmedString)
        .addField("model", Schema.NonEmptyTrimmedString)

      expect(MyFormBuilder.fields).toMatchObject({
        brand: { schema: Schema.NonEmptyTrimmedString },
        model: { schema: Schema.NonEmptyTrimmedString }
      })
    })

    it("should create form builder with array field", () => {
      const ItemIdsField = Field.makeArrayField("itemIds", Schema.UUID)
      const MyFormBuilder = FormBuilder.empty
        .addField(ItemIdsField)

      expect(MyFormBuilder.fields).toMatchObject({
        itemIds: { itemSchema: Schema.UUID }
      })
    })
  })

  describe("Form react", () => {
    it("should integrate basic login", async () => {
      const onSubmit = vi.fn()
      const loginFormBuilder = FormBuilder.empty
        .addField("username", Schema.NonEmptyTrimmedString)
        .addField(
          "password",
          pipe(
            Schema.NonEmptyTrimmedString.annotations({ message: () => "Required field" }),
            Schema.minLength(8, { message: () => "Minimum 8 chars" })
          )
        )
        .addField("remember", Schema.Boolean)

      const loginForm = FormReact.make(loginFormBuilder, {
        fields: {
          username: ({ field }) => (
            <>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
              {Option.isSome(field.error) && <span data-testid="username-field-error">{field.error.value}</span>}
            </>
          ),
          password: ({ field }) => (
            <>
              <input
                type="password"
                value={field.value}
                data-testid="password-field-input"
                onChange={(e) => field.onChange(e.target.value)}
              />
              {Option.isSome(field.error) && <span data-testid="password-field-error">{field.error.value}</span>}
            </>
          ),
          remember: ({ field }) => (
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.value === "on")}
            />
          )
        },
        onSubmit
      })

      const formSchema = FormBuilder.buildSchema(loginFormBuilder)
      const TestComponent: React.FC<{ defaultValues: typeof formSchema.Encoded }> = ({ defaultValues }) => {
        const submit = useAtomSet(loginForm.submit)

        return (
          <loginForm.Initialize defaultValues={defaultValues}>
            <form onSubmit={submit}>
              <loginForm.username />
              <loginForm.password />
              <loginForm.remember />

              <button type="submit">SUBMIT</button>
            </form>
          </loginForm.Initialize>
        )
      }

      const validValues = { username: "toto", password: "", remember: false }
      render(<TestComponent defaultValues={validValues} />)

      act(() => screen.getByText("SUBMIT").click())
      expect(screen.queryByTestId("username-field-error")).toBeNull()
      expect(screen.getByTestId("password-field-error")).toHaveTextContent("Required field")

      act(() => fireEvent.change(screen.getByTestId("password-field-input"), { target: { value: "fail" } }))
      expect(screen.getByTestId("password-field-error")).toHaveTextContent("Minimum 8 chars")
      expect(onSubmit).not.toHaveBeenCalled()

      act(() => fireEvent.change(screen.getByTestId("password-field-input"), { target: { value: "Str0ngPa$$wOrd" } }))
      act(() => screen.getByText("SUBMIT").click())
      expect(onSubmit).toHaveBeenCalled()
    })
  })
})
