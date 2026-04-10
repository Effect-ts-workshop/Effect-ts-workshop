---
sidebar_position: 1
---

# Exercice 12 — Formulaires

## Pourquoi un système de formulaires basé sur Schema ?

Valider un formulaire, c'est exactement ce que fait `Schema` : vérifier que des données de type inconnu (`string` venant d'un `<input>`) correspondent à un type métier.

`effect-form-react` tire parti de cette idée : on décrit les champs du formulaire avec des Schemas Effect, et la librairie gère la validation, les messages d'erreur et la soumission.

## Construire un formulaire avec `FormBuilder`

Un formulaire se définit en deux étapes : le **builder** (description des champs), puis le **composant React** (rendu de chaque champ).

### Étape 1 — décrire les champs

```typescript
import { FormBuilder } from "@lucas-barake/effect-form-react"
import { Schema } from "effect"

const loginFormBuilder = FormBuilder.empty
  .addField("username", Schema.NonEmptyTrimmedString)
  .addField("password", Schema.NonEmptyTrimmedString)
  .addField("remember", Schema.Boolean)
```

Chaque champ est associé à un Schema. La validation est automatique à la soumission.

:::tip Personnaliser les messages d'erreur
Les annotations Effect permettent de remplacer les messages par défaut :

```typescript
.addField(
  "password",
  Schema.NonEmptyTrimmedString.annotations({ message: () => "Champ requis" })
)
```
:::

### Ajouter un champ tableau

```typescript
import { Field, FormBuilder } from "@lucas-barake/effect-form-react"
import { Schema } from "effect"

const ItemIdsField = Field.makeArrayField("itemIds", Schema.UUID)
const formBuilder = FormBuilder.empty.addField(ItemIdsField)
```

`Field.makeArrayField` crée un champ dont la valeur est un tableau d'éléments validés par le Schema fourni.

### Étape 2 — créer le composant React

```typescript
import { FormReact } from "@lucas-barake/effect-form-react"

const loginForm = FormReact.make(loginFormBuilder, {
  fields: {
    username: ({ field }) => (
      <>
        <input
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
        />
        {Option.isSome(field.error) && (
          <span>{field.error.value}</span>
        )}
      </>
    ),
    // ... autres champs
  },
  onSubmit: (values) => console.log(values)
})
```

Chaque champ reçoit `field.value`, `field.onChange`, et `field.error` (un `Option<string>`).

## Utiliser le formulaire dans un composant

```typescript
function LoginPage() {
  const submit = useAtomSet(loginForm.submit)

  return (
    <loginForm.Initialize defaultValues={{ username: "", password: "", remember: false }}>
      <form onSubmit={submit}>
        <loginForm.username />
        <loginForm.password />
        <loginForm.remember />
        <button type="submit">Se connecter</button>
      </form>
    </loginForm.Initialize>
  )
}
```

- `loginForm.Initialize` fournit les valeurs initiales et l'état du formulaire
- `loginForm.username`, `loginForm.password` sont les composants de rendu définis dans `FormReact.make`
- `useAtomSet(loginForm.submit)` retourne le handler de soumission — il valide avant d'appeler `onSubmit`

:::info Validation à la soumission
`onSubmit` n'est appelé **que si tous les champs sont valides**. Si un champ échoue à la validation, son `field.error` passe à `Option.some(message)` et le rendu affiche le message d'erreur.
:::

## Lien avec l'exercice 7 (Schema)

Les Schemas définis dans l'exercice 7 s'utilisent directement ici. `Schema.NonEmptyTrimmedString` garantit que le champ n'est pas vide et sans espaces superflus — le même Schema qu'on utiliserait côté serveur pour valider un payload.

## Exercice

Fichier de test : `packages/app/_exercices/12-form.spec.tsx`

Les tests couvrent trois cas :

1. **Builder de base** — créer un `FormBuilder` avec des champs simples
2. **Champ tableau** — ajouter un `Field.makeArrayField`
3. **Intégration React** — soumettre un formulaire valide, afficher les erreurs, personnaliser les messages

:::tip Ressources

- [`effect-form-react` sur npm](https://www.npmjs.com/package/@lucas-barake/effect-form-react)
- [Exercice 7 — Schema](../08-schema/01-schema.md)

:::

## Indice 1

<details>
  <summary>Comment créer un FormBuilder avec deux champs ?</summary>

```typescript
import { FormBuilder } from "@lucas-barake/effect-form-react"
import { Schema } from "effect"

const MyForm = FormBuilder.empty
  .addField("brand", Schema.NonEmptyTrimmedString)
  .addField("model", Schema.NonEmptyTrimmedString)
```

Le builder est immutable : chaque `.addField` retourne un nouveau builder.

</details>

## Indice 2

<details>
  <summary>Comment afficher un message d'erreur dans le rendu d'un champ ?</summary>

`field.error` est un `Option<string>`. On l'affiche avec `Option.isSome` :

```typescript
import { Option } from "effect"

username: ({ field }) => (
  <>
    <input value={field.value} onChange={(e) => field.onChange(e.target.value)} />
    {Option.isSome(field.error) && <span>{field.error.value}</span>}
  </>
)
```

</details>

## Indice 3

<details>
  <summary>Comment personnaliser le message d'erreur d'un champ ?</summary>

```typescript
import { pipe, Schema } from "effect"

.addField(
  "password",
  pipe(
    Schema.NonEmptyTrimmedString.annotations({ message: () => "Champ requis" }),
    Schema.minLength(8, { message: () => "Minimum 8 caractères" })
  )
)
```

Chaque validation peut avoir son propre message. Le premier qui échoue est affiché.

</details>

## Solution

<details>
  <summary>Avant de déplier, essayez encore ! Les indices sont là pour vous aider.</summary>

**Builder de base :**
```typescript
import { FormBuilder } from "@lucas-barake/effect-form-react"
import { Schema } from "effect"

const MyFormBuilder = FormBuilder.empty
  .addField("brand", Schema.NonEmptyTrimmedString)
  .addField("model", Schema.NonEmptyTrimmedString)
```

**Champ tableau :**
```typescript
import { Field, FormBuilder } from "@lucas-barake/effect-form-react"
import { Schema } from "effect"

const ItemIdsField = Field.makeArrayField("itemIds", Schema.UUID)
const MyFormBuilder = FormBuilder.empty.addField(ItemIdsField)
```

**Intégration React :**
```typescript
const loginForm = FormReact.make(loginFormBuilder, {
  fields: {
    username: ({ field }) => (
      <>
        <input value={field.value} onChange={(e) => field.onChange(e.target.value)} />
        {Option.isSome(field.error) && (
          <span data-testid="username-field-error">{field.error.value}</span>
        )}
      </>
    ),
    password: ({ field }) => (
      <>
        <input
          type="password"
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
        />
        {Option.isSome(field.error) && (
          <span data-testid="password-field-error">{field.error.value}</span>
        )}
      </>
    ),
    remember: ({ field }) => (
      <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.value === "on")} />
    )
  },
  onSubmit
})

function TestComponent({ defaultValues }) {
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
```

Si `username` est vide, `field.error` devient `Option.some("Expected a non empty string, actual \"\"")` et `onSubmit` n'est pas appelé.

</details>
