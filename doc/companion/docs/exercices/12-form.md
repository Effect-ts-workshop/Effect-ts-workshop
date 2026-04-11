---
sidebar_position: 12
---

# Exercice 12 — Form

Les formulaires posent trois problèmes récurrents : valider les champs, afficher les erreurs au bon moment, et soumettre uniquement quand les données sont valides.

`effect-form-react` résout ces trois problèmes en s'appuyant sur `Schema` pour la validation et `Atom` pour l'état.

Fichier à compléter : `packages/app/_exercices/12-form.spec.tsx`

---

## `FormBuilder` — définir la structure du formulaire

Un formulaire se définit en ajoutant des champs un par un. Chaque champ a un nom et un schema de validation :

<!-- prettier-ignore -->
```typescript
const MyFormBuilder = FormBuilder.empty
  .addField("brand", Schema.NonEmptyTrimmedString)
  .addField("model", Schema.NonEmptyTrimmedString)
```

`FormBuilder` ne contient pas de logique de rendu — c'est une description du formulaire. Le rendu vient ensuite avec `FormReact.make`.

### Exercice

Créez `MyFormBuilder` avec deux champs : `brand` et `model`, tous deux `Schema.NonEmptyTrimmedString` :

<!-- prettier-ignore -->
```typescript
const MyFormBuilder = ??? // À compléter

expect(MyFormBuilder.fields).toMatchObject({
  brand: { schema: Schema.NonEmptyTrimmedString },
  model: { schema: Schema.NonEmptyTrimmedString }
})
```

À vous de jouer !

:::tip Ressources

- [Schema avancé](../base-de-connaissance/10-schema-avance.md)
- [Atom](../base-de-connaissance/11-atom.md)

:::

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const MyFormBuilder = FormBuilder.empty
  .addField("brand", Schema.NonEmptyTrimmedString)
  .addField("model", Schema.NonEmptyTrimmedString)
```

</details>

---

## Champs tableau — `Field.makeArrayField`

Pour un champ qui contient plusieurs valeurs, `Field.makeArrayField` crée un champ tableau :

<!-- prettier-ignore -->
```typescript
const ItemIdsField = Field.makeArrayField("itemIds", Schema.UUID)
const MyFormBuilder = FormBuilder.empty.addField(ItemIdsField)
```

### Exercice

Créez `MyFormBuilder` avec un champ `itemIds` de type `Schema.UUID[]` :

<!-- prettier-ignore -->
```typescript
const MyFormBuilder = ??? // À compléter

expect(MyFormBuilder.fields).toMatchObject({
  itemIds: { itemSchema: Schema.UUID }
})
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const ItemIdsField = Field.makeArrayField("itemIds", Schema.UUID)
const MyFormBuilder = FormBuilder.empty.addField(ItemIdsField)
```

</details>

---

## `FormReact.make` — le formulaire React

`FormReact.make` prend le builder et une configuration pour produire un composant React :

<!-- prettier-ignore -->
```typescript
const loginForm = FormReact.make(loginFormBuilder, {
  fields: {
    username: ({ field }) => (
      <input
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
      />
    ),
    // ... un render par champ
  },
  onSubmit: (values) => console.log(values)
})
```

`field` expose `value`, `onChange`, et `error` (un `Option<string>`).

### Exercice

Créez `loginFormBuilder` pour un formulaire de connexion avec trois champs :

- `username` : `Schema.NonEmptyTrimmedString`
- `password` : `Schema.NonEmptyTrimmedString` avec message `"Required field"`, puis `Schema.minLength(8)` avec message `"Minimum 8 chars"`
- `remember` : `Schema.Boolean`

<!-- prettier-ignore -->
```typescript
const loginFormBuilder = ??? // À compléter
```

À vous de jouer !

#### Indice 1

<details>
  <summary>Combiner plusieurs validations sur un même champ</summary>

Pour `password`, on compose les validations avec `pipe` :

<!-- prettier-ignore -->
```typescript
pipe(
  Schema.NonEmptyTrimmedString.annotations({ message: () => "Required field" }),
  Schema.minLength(8, { message: () => "Minimum 8 chars" })
)
```

</details>

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
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
```

</details>

---

## `useAtomSet` — déclencher la soumission

Le formulaire expose un atom `submit`. `useAtomSet` renvoie un setter — ici, c'est le handler de soumission du `<form>` :

<!-- prettier-ignore -->
```typescript
function TestComponent({ defaultValues }) {
  const submit = useAtomSet(loginForm.submit)

  return (
    <loginForm.Initialize defaultValues={defaultValues}>
      <form onSubmit={submit}>
        <loginForm.username />
        <loginForm.password />
        <button type="submit">Envoyer</button>
      </form>
    </loginForm.Initialize>
  )
}
```

- `loginForm.Initialize` fournit les valeurs par défaut
- `loginForm.username`, `loginForm.password` — les composants de champ définis dans `FormReact.make`
- `submit` — déclenche la validation et appelle `onSubmit` si tout est valide

### Exercice

Récupérez `submit` avec `useAtomSet` :

<!-- prettier-ignore -->
```typescript
function TestComponent({ defaultValues }) {
  const submit = ??? // À compléter
  // ...
}
```

À vous de jouer !

#### Solution

<details>
  <summary>Avant de déplier pour afficher la solution, n'hésitez pas à nous solliciter !</summary>

<!-- prettier-ignore -->
```typescript
const submit = useAtomSet(loginForm.submit)
```

</details>

---

:::tip Récapitulatif du pattern

1. `FormBuilder.empty.addField(...)` → décrit les champs et leur validation
2. `FormReact.make(builder, { fields, onSubmit })` → crée les composants de rendu
3. `useAtomSet(loginForm.submit)` → récupère le handler de soumission
4. `<form.Initialize defaultValues={...}>` → initialise l'état du formulaire
5. La validation s'exécute à la soumission — les erreurs apparaissent champ par champ

:::
