---
sidebar_position: 11
---

# Exercice 11 — Form

Les formulaires posent trois problèmes récurrents : valider les champs, afficher les erreurs au bon moment, et soumettre uniquement quand les données sont valides.

`effect-form-react` résout ces trois problèmes en s'appuyant sur `Schema` pour la validation et `Atom` pour l'état.

Fichier à compléter : `packages/app/_exercices/11-form.spec.tsx`

---

## Définir la structure d'un formulaire

Un formulaire se définit en ajoutant des champs un par un. Chaque champ a un nom et un schema de validation :

<!-- prettier-ignore -->
```typescript
const contactFormBuilder = FormBuilder.empty
  .addField("name", Schema.NonEmptyTrimmedString)
  .addField("email", Schema.NonEmptyTrimmedString)
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

## Ajouter un champ tableau

Pour un champ qui contient plusieurs valeurs, `Field.makeArrayField` crée un champ tableau :

<!-- prettier-ignore -->
```typescript
const RoleIdsField = Field.makeArrayField("roleIds", Schema.UUID)
const profileFormBuilder = FormBuilder.empty.addField(RoleIdsField)
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

## Créer le rendu React d'un formulaire

`FormReact.make` prend le builder et une configuration pour produire un composant React :

<!-- prettier-ignore -->
```typescript
const searchForm = FormReact.make(searchFormBuilder, {
  fields: {
    query: ({ field }) => (
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

L'objet retourné expose deux catégories d'atoms :

**Atoms en lecture** — à utiliser avec `useAtomValue` :

| Atom | Type | Description |
|------|------|-------------|
| `form.values` | `Atom<Option<Values>>` | Valeurs courantes de tous les champs |
| `form.isDirty` | `Atom<boolean>` | `true` si au moins un champ a changé depuis l'initialisation |
| `form.hasChangedSinceSubmit` | `Atom<boolean>` | `true` si des changements existent depuis la dernière soumission |
| `form.lastSubmittedValues` | `Atom<Option<Values>>` | Valeurs de la dernière soumission valide |
| `form.submitCount` | `Atom<number>` | Nombre de tentatives de soumission |

**Atoms en écriture** — à utiliser avec `useAtomSet` :

| Atom | Description |
|------|-------------|
| `form.submit` | Déclenche la validation puis appelle `onSubmit` si valide |
| `form.validate` | Déclenche la validation manuellement sans soumettre |
| `form.reset` | Remet le formulaire à son état initial |
| `form.revertToLastSubmit` | Revient aux valeurs de la dernière soumission valide |
| `form.setValues` | Remplace programmatiquement toutes les valeurs |

**Chaque champ** reçoit un objet `field` dans son composant de rendu :

| Propriété | Type | Description |
|-----------|------|-------------|
| `field.value` | `T` | Valeur courante |
| `field.onChange` | `(v: T) => void` | Mettre à jour la valeur |
| `field.onBlur` | `() => void` | Marquer le champ comme touché |
| `field.error` | `Option<string>` | Message d'erreur à afficher |
| `field.isTouched` | `boolean` | `true` si le champ a été interagi |
| `field.isDirty` | `boolean` | `true` si la valeur a changé depuis l'init |

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

## Déclencher la soumission

Le formulaire expose un atom `submit`. `useAtomSet` renvoie un setter — ici, c'est le handler de soumission du `<form>` :

<!-- prettier-ignore -->
```typescript
function SearchWidget({ defaultValues }) {
  const submit = useAtomSet(searchForm.submit)

  return (
    <searchForm.Initialize defaultValues={defaultValues}>
      <form onSubmit={submit}>
        <searchForm.query />
        <button type="submit">Search</button>
      </form>
    </searchForm.Initialize>
  )
}
```

- `searchForm.Initialize` fournit les valeurs par défaut
- `searchForm.query` — le composant de champ défini dans `FormReact.make`
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
