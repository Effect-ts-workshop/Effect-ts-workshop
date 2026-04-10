---
sidebar_position: 1
---

# Bienvenue dans l'atelier Effect-TS

Avez-vous déjà écrit du code TypeScript et ressenti que quelque chose manquait ?

- Les erreurs des fonctions `async` disparaissent dans des `Promise` non typées.
- Il est impossible de savoir, sans lire le code, de quoi dépend une fonction.
- Enchaîner des opérations qui peuvent échouer force à écrire des `try/catch` imbriqués.

Effect-TS répond à ces trois problèmes en un seul concept : le type `Effect`.

## Qu'allons-nous construire ?

À la fin de cet atelier, vous aurez les clés pour comprendre et écrire une application fullstack complète avec Effect-TS :

- Une **API REST** avec gestion d'erreurs typée, injection de dépendances, et traçage distribué.
- Un **frontend React** qui consomme cette API via Effect.

Le code final est visible dans le dossier `/packages` du repository. Chaque exercice vous en rapproche progressivement.

## Comment est organisé cet atelier ?

L'atelier est divisé en **3 grandes sections** :

### 1. Les Exercices

Cinq parties, chacune introduisant un nouveau concept Effect-TS :

| Partie | Thème            | Concepts                                             |
| ------ | ---------------- | ---------------------------------------------------- |
| 1      | Premiers pas     | `Effect.succeed`, `Effect.sleep`, `Effect.runSync`   |
| 2      | Erreurs          | `Data.TaggedError`, `Effect.fail`, `Effect.catchTag` |
| 3      | Contexte         | Services, `Layer`, injection de dépendances          |
| 4      | Pattern Matching | `Match`, `Option`                                    |
| 5      | Générateurs      | `pipe`, `Effect.gen`, `Effect.fn`                    |

### 2. La Base de Connaissance

Des fiches de référence pour chaque concept abordé. Chaque exercice y fait référence.

## Prérequis

- Connaissances de base en TypeScript
- Votre ordinateur 💻
- Un éditeur de code (VS Code recommandé)

## Installation

Une fois le repository cloné :

```bash
npm install
```

Pour lancer l'application finale (API + Frontend) :

```bash
docker-compose up -d   # Lance PostgreSQL
npm run dev            # Lance l'API et l'app
```

:::info Services disponibles

- API : http://localhost:3000
- App : http://localhost:5173
- Documentation API : http://localhost:3000/docs
- Traces : http://localhost:9999 (admin@signoz.local / admin123)
  :::

## Conseils avant de commencer

- Chaque exercice n'introduit **qu'un seul nouveau concept** à la fois.
- Utilisez les **indices** avant de regarder la solution.
- La section **"Ressources"** de chaque exercice pointe vers la base de connaissance.
- N'hésitez pas à appeler les formateurs en cas de doute !

## La philosophie d'Effect

Avant de plonger dans le code, voici l'idée centrale d'Effect :

> Un `Effect` est une **description** d'un programme. Ce n'est pas le programme lui-même.

Exactement comme une recette de cuisine n'est pas le plat. La recette décrit ce qu'il faut faire. Le plat n'existe que quand on exécute la recette.

```typescript
// Ceci ne fait rien — c'est juste une description
const monEffect = Effect.succeed(42);

// Ceci exécute la description et produit le résultat
const résultat = Effect.runSync(monEffect); // 42
```

Cette distinction est fondamentale. Elle permet à Effect de composer des programmes complexes avant de les exécuter.

**Bonne chance et bon courage ! 🚀**
