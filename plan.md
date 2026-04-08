Write the documentation like the best programming teachers in the world.
The reader should never feel lost.
Every concept must feel obvious after reading.

You are an expert technical writer, educator, and documentation architect specializing in high-quality developer documentation.

Your task is to generate a Effect-TS workshop.
The final result is a fullstack app with an api and an app (can see the expected output code here `/packages`)
You need to break the output into exercices structured for learning, using strong pedagogy and "baby steps".
Only focus on Effect-TS and skip informations about others library like `@tanstack/react-router` or `@radix-ui`.

You can start from this plan

```
# Exercices

1.  La syntaxe / S’entrainer au passage de TypeScript classique vers Effect.ts

### Bases

1. On n’utilise pas les erreurs et le contexte TS
    - Sync => Add
    - Async => Delay
    - Pourquoi ?
        - Combinaison pour afficher traces
2. Erreurs (Railway pattern)
    - Sync => Divide
    - Async => Fetch
    - CatchTag / CatchTags
    - promise() instead of tryPromise() ⇒ CatchAll
        - Permet d’introduire error vs defect
3. Contexte
    - Use interface HttpClient.HttpClient
    - Provide implementation
4. Pattern Matching
5. Generators
    - pipe (become a plumber / Image de Mario)
    - curry 🇮🇳
    - dual API
    - Do notation
    - Effect fn/gen
        - yield errors ⇒ Data.Error
```

The ultimate goal is to reuse the ouput of previous exercices to grow in complexity until the end with a fully functional fullstack app

The documentation must be written so that a beginner with minimal prior knowledge can progressively learn the topic.

Follow these core teaching principles:

PEDAGOGY RULES

- Teach concepts progressively from simple to advanced.
- Use baby steps: introduce only ONE new concept at a time.
- Every section must include:
  - Concept explanation
  - Why it matters
  - Visual mental model or analogy when possible
  - Step-by-step instructions
  - Small working example
  - Expected result
- Avoid knowledge jumps.
- Assume the reader forgets everything quickly and needs repetition and reinforcement.

TEACHING STYLE

Read all the content from the folder `/doc/example-companion` and keep the teaching style

Mandatory rules :

1. 3 sections (Intro / Exercices / Knowledge base)
2. Each exercice is clearly explain with link to knowledge base
3. Each exercice as hidden solution a the end + some hint before to avoid open solution

CONTENT STYLE

Use:

- french language
- short paragraphs
- numbered steps
- callout blocks (tip, warning, info)
- progressive difficulty

BEGINNER FRIENDLINESS

Assume the reader:

- may be new to programming
- needs reassurance and clarity

Therefore:

- define every technical term
- never skip steps
- explain commands
- explain file structures

Exercice Documentation  
In the “docs” section of the “exercises” folder, could you write up the documentation to contribute to our workshop guide (Docusaurus site) please? Please, first read and follow all the context I gave you upper. The goal is to be a companion for our student, to discover the exercice, the goal of it and learn by baby steps.  
In terms of structure, I want it to be the same as what we did for a previous workshop—namely, a title, a description of the clues, the solution and link to the principal concepts of Effect.ts and exemple of code in packages folder, you could find the current documentation in the folder /base-de-connaissance. For now, you won’t be able to complete everything—that’s okay (some exercices are in progress). Here’s the URL for the previous workshop: https://typescript-workshop.github.io/typescript-workshop-companion/docs/atelier/selectionner-tous-les-champs/
Create an .md file for each exercises; one exercise = one test file, which you’ll find in @packages/api/\_exercises and @packages/app/\_exercises
Please tell me at the end the point that are missing in base documentation. The ton I want is reassurance, clarity and short.

OUTPUT FORMAT

Return:

1. Output dir `/doc/companion`
2. Markdown files to be used in Docusaurus
3. Clear progression between pages

The documentation must feel like a guided course rather than a reference manual.

Make it extremely clear, structured, and beginner friendly.
