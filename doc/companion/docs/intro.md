---
sidebar_position: 1
---

# Bienvenue dans l'atelier Effect-TS

Avez-vous déjà écrit du code TypeScript et ressenti que quelque chose manquait ?

- Les erreurs des fonctions `async` disparaissent dans des `Promise` non typées.
- Il est impossible de savoir, sans lire le code, de quoi dépend une fonction.
- Enchaîner des opérations qui peuvent échouer force à écrire des `try/catch` imbriqués.

Effect-TS répond à ces trois problèmes en un seul concept : le type `Effect`.

## Qu'allons-nous apprendre ?

À la fin de cet atelier, vous aurez un modèle mental pour écrire des programmes TypeScript asynchrones, faillibles et testables avec Effect. Pas une liste d'API mémorisées — une façon de penser les programmes.

Le repository contient une application fullstack complète (API REST + frontend React) à titre d'exemple. À la fin de l'atelier, vous aurez toutes les clés pour en construire une similaire.

<details>
  <summary>Lancer l'application d'exemple (API + Frontend)</summary>

```bash
docker-compose up -d   # Lance PostgreSQL
npm run dev            # Lance l'API et l'app
```

Services disponibles :

- API : http://localhost:3000
- App : http://localhost:5173
- Documentation API : http://localhost:3000/docs
- Traces : http://localhost:9999 (admin@signoz.local / admin123)

</details>

## Rejoindre Effect-TS Workshop Companion et le repo d'exercices

<p className="font--industrial" style={{fontSize: "1.4rem"}}>[https://urls.fr/aniNPv](https://effect-ts-workshop.github.io/Effect-ts-workshop/)</p>

<p className="font--industrial" style={{fontSize: "1.4rem"}}>[Github](https://github.com/Effect-ts-workshop/Effect-ts-workshop)</p>

## Comment est organisé cet atelier ?

L'atelier est divisé en **3 grandes sections** :

### 1. Les Exercices

Douze exercices progressifs. Chaque exercice introduit un concept, construit sur le précédent.

**Les fondations — du type `Effect` aux services :**

| #   | Thème            | Concepts clés                                          |
| --- | ---------------- | ------------------------------------------------------ |
| 1   | Bases            | `pipe`, `Effect.succeed/map/flatMap`, `Effect.promise` |
| 2   | Erreurs          | `Effect.fail`, `Data.TaggedError`, `Effect.catchTag`   |
| 3   | Interruption     | `Scope`, ressources, interruption de fibers            |
| 4   | Pattern Matching | `Match`, exhaustivité                                  |
| 5   | Context & Layer  | Services, `Layer`, injection de dépendances            |
| 6   | Générateurs      | `Effect.fn`, syntaxe generator                         |
| 7   | Schema           | Validation, inférence de types                         |

**En pratique — appliquer ces concepts à une vraie application :**

| #   | Thème      | Concepts clés                                  |
| --- | ---------- | ---------------------------------------------- |
| 8   | HTTP API   | `@effect/platform`, définir un contrat         |
| 9   | SQL        | `@effect/sql`, Drizzle, testcontainers         |
| 10  | API Client | Consommer une API typée côté client            |
| 11  | Atom       | State réactif, intégration React               |
| 12  | Form       | `effect-form-react`, validation de formulaires |

### 2. La Base de Connaissance

Des fiches de référence pour chaque concept abordé. Chaque exercice y renvoie.

## Prérequis

- Connaissances de base en TypeScript
- Votre ordinateur 💻
- Un éditeur de code (VS Code recommandé)
- Docker installé et démarré (requis pour l'exercice 9 — SQL)

## Installation

Une fois le repository cloné :

```bash
npm install
```

## Déroulement d'un exercice

1. **Lancez les tests** en mode watch depuis la racine du projet :

```bash
npm run test
```

2. **Ouvrez le fichier de test** correspondant à la page du companion (indiqué en haut de chaque exercice).

3. **Retirez le `.skip`** devant le test sur lequel vous travaillez — le test passe rouge.

4. **Faites passer le test au vert.**

5. Passez au test suivant.

:::note Erreurs TypeScript dans les fichiers de spec

Certains fichiers de test contiennent des erreurs TypeScript dès l'ouverture — c'est normal. Ces erreurs disparaîtront au fur et à mesure que vous complétez les exercices. **Ignorez-les jusqu'à ce que vous arriviez à l'exercice concerné**.

:::

## Conseils avant de commencer

- Chaque exercice n'introduit **qu'un seul nouveau concept** à la fois.
- Utilisez les **indices** avant de regarder la solution.
- La section **"Ressources"** de chaque exercice pointe vers la base de connaissance.
- **Sollicitez-nous au maximum — on est là pour ça.**

## La philosophie d'Effect

Avant de plonger dans le code, voici l'idée centrale d'Effect :

> Un `Effect` est une **description** d'un programme. Ce n'est pas le programme lui-même.

Exactement comme une recette de cuisine n'est pas le plat. La recette décrit ce qu'il faut faire. Le plat n'existe que quand on exécute la recette.

<!-- prettier-ignore -->
```typescript
// Ceci ne fait rien — c'est juste une description
const myEffect = Effect.succeed(42);

// Ceci exécute la description et produit le résultat
const result = Effect.runSync(myEffect); // 42
```

Cette distinction est fondamentale. Elle permet à Effect de composer des programmes complexes avant de les exécuter.

**Commençons l'aventure Effect ! 💪**
