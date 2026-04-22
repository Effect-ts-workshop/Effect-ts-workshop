import { Array, Match, Option, pipe } from "effect"
import { TODO } from "shared/utils"
import { describe, expect, it } from "vitest"

describe("Pattern matching", () => {
  it.skip("should handle all possible values", () => {
    type NumberField = { type: "number"; value: number }
    type TextField = { type: "text"; value: string }
    type SelectField = { type: "select"; multiple: false; value: string }
    type MultipleSelectField = { type: "select"; multiple: true; value: Array<string> }
    type AnyField =
      | NumberField
      | TextField
      | SelectField
      | MultipleSelectField

    const getValue = (field: AnyField) =>
      pipe(
        Match.value(field),
        TODO,
        Match.exhaustive
      )

    expect(getValue({ type: "number", value: 42 })).toEqual("42")
    expect(getValue({ type: "text", value: "awesome" })).toEqual("awesome")
    expect(getValue({ type: "select", multiple: false, value: "selected" })).toEqual("selected")
    expect(getValue({ type: "select", multiple: true, value: ["selected", "a", "lot"] })).toEqual("selected, a, lot")
  })

  it.skip("should match on _tag discriminated union (notifications)", () => {
    type EmailNotification = { _tag: "Email"; to: string; subject: string }
    type SmsNotification = { _tag: "Sms"; phone: string; body: string }
    type PushNotification = { _tag: "Push"; deviceId: string; title: string }
    type Notification = EmailNotification | SmsNotification | PushNotification

    const describe = (notif: Notification) =>
      pipe(
        Match.value(notif),
        TODO,
        Match.exhaustive
      )

    expect(describe({ _tag: "Email", to: "alice@example.com", subject: "Hello" })).toEqual(
      "Email to alice@example.com: Hello"
    )
    expect(describe({ _tag: "Sms", phone: "+33612345678", body: "Votre code: 1234" })).toEqual(
      "SMS to +33612345678: Votre code: 1234"
    )
    expect(describe({ _tag: "Push", deviceId: "device-42", title: "Nouvelle commande" })).toEqual(
      "Push on device-42: Nouvelle commande"
    )
  })

  it.skip("should use orElse as a fallback for unmatched cases (payment methods)", () => {
    type PaymentMethod = "card" | "paypal" | "crypto" | "check"

    const getProcessingFee = (method: PaymentMethod): string =>
      pipe(
        Match.value(method),
        TODO
      )

    expect(getProcessingFee("card")).toEqual("1.5%")
    expect(getProcessingFee("paypal")).toEqual("2.9%")
    expect(getProcessingFee("crypto")).toEqual("0%")
    expect(getProcessingFee("check")).toEqual("unknown method, default fee: 3%")
  })

  it.skip("[OPTIONAL] should exclude a specific case with Match.not (order status)", () => {
    type OrderStatus = "pending" | "processing" | "shipped" | "cancelled"

    const isTrackable = (status: OrderStatus) =>
      pipe(
        Match.value(status),
        TODO,
        Match.orElse(() => false)
      )

    expect(isTrackable("pending")).toEqual(true)
    expect(isTrackable("processing")).toEqual(true)
    expect(isTrackable("shipped")).toEqual(true)
    expect(isTrackable("cancelled")).toEqual(false)
  })

  it.skip("[OPTIONAL] should match multiple conditions with whenOr (user roles)", () => {
    type Role = "viewer" | "editor" | "admin" | "superAdmin"

    const canAccessDashboard = (role: Role) =>
      pipe(
        Match.value(role),
        TODO,
        Match.orElse(() => false)
      )

    expect(canAccessDashboard("viewer")).toEqual(false)
    expect(canAccessDashboard("editor")).toEqual(false)
    expect(canAccessDashboard("admin")).toEqual(true)
    expect(canAccessDashboard("superAdmin")).toEqual(true)
  })

  it.skip("[OPTIONAL] should use built-in predicates to match on primitive types (form field validation)", () => {
    type FieldValue = string | number | boolean | null

    const formatForDisplay = (value: FieldValue) =>
      pipe(
        Match.value(value),
        TODO,
        Match.exhaustive
      )

    expect(formatForDisplay(null)).toEqual("-")
    expect(formatForDisplay(true)).toEqual("Oui")
    expect(formatForDisplay(false)).toEqual("Non")
    expect(formatForDisplay(1234567)).toEqual("1\u202f234\u202f567") // séparateur milliers fr-FR
    expect(formatForDisplay("bonjour")).toEqual("bonjour")
  })

  it.skip("[OPTIONAL] should handle optional value", () => {
    const allValues = ["you got me"]

    const getValueAt = (index: number) =>
      pipe(
        allValues,
        Array.get(index),
        TODO
      )

    expect(getValueAt(0)).toEqual("YOU GOT ME")
    expect(getValueAt(42)).toEqual("DEFAULT")
  })

  it.skip("[OPTIONAL] should wrap result in Option with Match.option (product availability)", () => {
    type StockStatus =
      | { status: "in_stock"; quantity: number }
      | { status: "out_of_stock" }
      | { status: "discontinued" }

    const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
      pipe(
        Match.value(stock),
        TODO
      )

    expect(getDeliveryDays({ status: "in_stock", quantity: 50 })).toEqual(Option.some(2))
    expect(getDeliveryDays({ status: "in_stock", quantity: 3 })).toEqual(Option.some(5))
    expect(getDeliveryDays({ status: "out_of_stock" })).toEqual(Option.none())
    expect(getDeliveryDays({ status: "discontinued" })).toEqual(Option.none())
  })
})
