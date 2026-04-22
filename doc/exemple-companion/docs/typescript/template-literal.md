---
sidebar_position: 11
---

# Template Literals

## Literal types

Les _types littéraux_ permettent de restreindre un type à une valeur spécifique. Par exemple :

```ts
type French = "french";
```

## Templates

Il est également possible de définir des _gabarits_ de types littéraux.

```ts
type ContactLanguageInfo = `This user speaks ${string}.`; // <= this is a 'template' literal type

const displayContactLanguageInfo = (
  contactLanguage: string
): ContactLanguageInfo => {
  return `This user speaks ${contactLanguage}.`;
};
```

Quand une union est employée dans une section interpolée, le type résultant est l'ensemble des combinaisons découlant de chaque membre de l'union :

```ts
type English = "english";
type French = "french";

type ContactLanguageInfo = `This user speaks ${French | English}.`;
//          ^? type ContactLanguageInfo = "This user speaks french." | "This user speaks english."
```

## Inference

Il est possible d'inférer un type à partir d'un template par substitution.

```ts
type FrenchSpeakingCountryCode<Locale> = Locale extends `fr_${infer Country}`
  ? Country
  : never;

type FranceCountryCode = FrenchSpeakingCountryCode<"fr_FR">;
//        ^? type FranceCountryCode = "FR"
type CanadaCountryCode = FrenchSpeakingCountryCode<"fr_CA">;
//        ^? type CanadaCountryCode = "CA"
type BelgiumCountryCode = FrenchSpeakingCountryCode<"fr_BE">;
//        ^? type BelgiumCountryCode = "BE"
```
