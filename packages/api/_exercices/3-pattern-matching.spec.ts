import { Array, Match, Option, pipe } from "effect"
import { describe, expect, it } from "vitest"

describe("Pattern matching", () => {
  it("[OPTIONAL] should handle all possible values", () => {
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
        // #start
        // TODO,
        // #solution
        Match.when({ type: "number" }, (field) => String(field.value)),
        Match.when({ type: "text" }, (field) => field.value),
        Match.when({ type: "select", multiple: true }, (field) => field.value.join(", ")),
        Match.when({ type: "select", multiple: false }, (field) => field.value),
        // #end
        Match.exhaustive
      )

    expect(getValue({ type: "number", value: 42 })).toEqual("42")
    expect(getValue({ type: "text", value: "awesome" })).toEqual("awesome")
    expect(getValue({ type: "select", multiple: false, value: "selected" })).toEqual("selected")
    expect(getValue({ type: "select", multiple: true, value: ["selected", "a", "lot"] })).toEqual("selected, a, lot")
  })

  it("[OPTIONAL] should handle optional value", () => {
    const allValues = ["you got me"]

    const getValueAt = (index: number) =>
      pipe(
        allValues,
        Array.get(index),
        // #start
        // TODO
        // #solution
        Option.match({
          onSome: (v) => v.toUpperCase(),
          onNone: () => `DEFAULT`
        })
        // #end
      )

    expect(getValueAt(0)).toEqual("YOU GOT ME")
    expect(getValueAt(42)).toEqual("DEFAULT")
  })

  it("[OPTIONAL] should wrap result in Option with Match.option (product availability)", () => {
    type StockStatus =
      | { status: "in_stock"; quantity: number }
      | { status: "out_of_stock" }
      | { status: "discontinued" }

    const getDeliveryDays = (stock: StockStatus): Option.Option<number> =>
      pipe(
        Match.value(stock),
        // #start
        // TODO
        // #solution
        Match.when({ status: "in_stock" }, (s) => (s.quantity > 10 ? 2 : 5)),
        Match.option
        // #end
      )

    expect(getDeliveryDays({ status: "in_stock", quantity: 50 })).toEqual(Option.some(2))
    expect(getDeliveryDays({ status: "in_stock", quantity: 3 })).toEqual(Option.some(5))
    expect(getDeliveryDays({ status: "out_of_stock" })).toEqual(Option.none())
    expect(getDeliveryDays({ status: "discontinued" })).toEqual(Option.none())
  })

  it("[OPTIONAL] should match on _tag discriminated union (notifications)", () => {
    type EmailNotification = { _tag: "Email"; to: string; subject: string }
    type SmsNotification = { _tag: "Sms"; phone: string; body: string }
    type PushNotification = { _tag: "Push"; deviceId: string; title: string }
    type Notification = EmailNotification | SmsNotification | PushNotification

    const describe = (notif: Notification) =>
      pipe(
        Match.value(notif),
        // #start
        // TODO,
        // #solution
        Match.tag("Email", (n) => `Email to ${n.to}: ${n.subject}`),
        Match.tag("Sms", (n) => `SMS to ${n.phone}: ${n.body}`),
        Match.tag("Push", (n) => `Push on ${n.deviceId}: ${n.title}`),
        // #end
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

  it("[OPTIONAL] should use orElse as a fallback for unmatched cases (payment methods)", () => {
    type PaymentMethod = "card" | "paypal" | "crypto" | "check" | string

    const getProcessingFee = (method: PaymentMethod): string =>
      pipe(
        Match.value(method),
        // #start
        // TODO
        // #solution
        Match.when("card", () => "1.5%"),
        Match.when("paypal", () => "2.9%"),
        Match.when("crypto", () => "0%"),
        Match.orElse(() => "unknown method, default fee: 3%")
        // #end
      )

    expect(getProcessingFee("card")).toEqual("1.5%")
    expect(getProcessingFee("paypal")).toEqual("2.9%")
    expect(getProcessingFee("crypto")).toEqual("0%")
    expect(getProcessingFee("check")).toEqual("unknown method, default fee: 3%")
  })

  it("[OPTIONAL] should exclude a specific case with Match.not (order status)", () => {
    type OrderStatus = "pending" | "processing" | "shipped" | "cancelled"

    const isTrackable = (status: OrderStatus) =>
      pipe(
        Match.value(status),
        // #start
        // TODO,
        // #solution
        Match.not("cancelled", () => true),
        // #end
        Match.orElse(() => false)
      )

    expect(isTrackable("pending")).toEqual(true)
    expect(isTrackable("processing")).toEqual(true)
    expect(isTrackable("shipped")).toEqual(true)
    expect(isTrackable("cancelled")).toEqual(false)
  })

  it("[OPTIONAL] should match multiple conditions with whenOr (user roles)", () => {
    type Role = "viewer" | "editor" | "admin" | "superAdmin"

    const canAccessDashboard = (role: Role) =>
      pipe(
        Match.value(role),
        // #start
        // TODO,
        // #solution
        Match.whenOr("admin", "superAdmin", () => true),
        // #end
        Match.orElse(() => false)
      )

    expect(canAccessDashboard("viewer")).toEqual(false)
    expect(canAccessDashboard("editor")).toEqual(false)
    expect(canAccessDashboard("admin")).toEqual(true)
    expect(canAccessDashboard("superAdmin")).toEqual(true)
  })

  it("[OPTIONAL] should use built-in predicates to match on primitive types (form field validation)", () => {
    type FieldValue = string | number | boolean | null

    const formatForDisplay = (value: FieldValue) =>
      pipe(
        Match.value(value),
        // #start
        // TODO,
        // #solution
        Match.when(Match.null, () => "—"),
        Match.when(Match.boolean, (b) => (b ? "Oui" : "Non")),
        Match.when(Match.number, (n) => n.toLocaleString("fr-FR")),
        Match.when(Match.string, (s) => s),
        // #end
        Match.exhaustive
      )

    expect(formatForDisplay(null)).toEqual("—")
    expect(formatForDisplay(true)).toEqual("Oui")
    expect(formatForDisplay(false)).toEqual("Non")
    expect(formatForDisplay(1234567)).toEqual("1\u202f234\u202f567") // séparateur milliers fr-FR
    expect(formatForDisplay("bonjour")).toEqual("bonjour")
  })
})
