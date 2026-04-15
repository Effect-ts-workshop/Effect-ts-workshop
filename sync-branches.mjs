#!/usr/bin/env node
/**
 * sync-branches.mjs
 *
 * Derives two git branches from the current (source-of-truth) branch by
 * transforming spec files, then pushes both branches.
 *
 *   workshop/exercices  → keeps only TODO lines, removes solution blocks
 *   workshop/solutions  → uncomments solution lines, removes TODO lines
 *
 * Source pattern (in *.spec.ts / *.spec.tsx):
 *
 *   // #start
 *   const counter = TODO            ← exercices branch keeps this
 *   // #solution
 *   // const counter = Atom.make(0) ← solutions branch uncomments this
 *   // #end
 *
 * The current branch is never modified — it stays the source of truth.
 * Re-running the script later will overwrite both branches with fresh transforms.
 *
 * Usage:
 *   node sync-branches.mjs [options]
 *
 * Options:
 *   --root <dir>              Directory to search for spec files (default: .)
 *   --ignore <f1,f2,...>      Spec files to skip transformation (basename or path suffix)
 *   --branch-ignore <p1,...>  Paths (relative to repo root) to delete from branch commits
 *                             Supports files and directories. e.g. plan.md,doc,packages/api/src
 *   --exercices-branch <name> Default: workshop/exercices
 *   --solutions-branch <name> Default: workshop/solutions
 *   --no-push                 Skip git push
 *   --dry-run                 Show what would change, without touching git
 */

import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs"
import { join, resolve, relative, basename } from "node:path"
import { execSync } from "node:child_process"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
let rootArg = "."
let ignoreList = []
let branchIgnoreList = []
let exercicesBranch = "workshop/exercices"
let solutionsBranch = "workshop/solutions"
let noPush = false
let dryRun = false

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--root":             rootArg = args[++i]; break
    case "--ignore":           ignoreList = args[++i].split(",").map((s) => s.trim()); break
    case "--branch-ignore":    branchIgnoreList = args[++i].split(",").map((s) => s.trim()); break
    case "--exercices-branch": exercicesBranch = args[++i]; break
    case "--solutions-branch": solutionsBranch = args[++i]; break
    case "--no-push":          noPush = true; break
    case "--dry-run":          dryRun = true; break
    case "--help":
      console.log(`Usage: node sync-branches.mjs [--root <dir>] [--ignore <f1,f2,...>]
       [--branch-ignore <p1,p2,...>]
       [--exercices-branch <name>] [--solutions-branch <name>]
       [--no-push] [--dry-run]`)
      process.exit(0)
  }
}

// ── Git bootstrap ─────────────────────────────────────────────────────────────

function run(cmd, cwd) {
  return execSync(cmd, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  }).trim()
}

const repoRoot = run("git rev-parse --show-toplevel", process.cwd())
const sourceBranch = run("git rev-parse --abbrev-ref HEAD", repoRoot)

// Convenience wrapper — defaults cwd to repoRoot
const git = (cmd, cwd = repoRoot) => run(`git ${cmd}`, cwd)

// Always exclude the script itself from branch commits
const scriptPath = relative(repoRoot, fileURLToPath(import.meta.url))
if (!branchIgnoreList.includes(scriptPath)) branchIgnoreList.push(scriptPath)
const autoExcludePaths = [
".claude",
".github",
"/doc/exemple-companion",
"plan.md"
]
autoExcludePaths.forEach(path => branchIgnoreList.push(relative(repoRoot, path)))

// Spec root relative to repo root (used to locate files inside worktrees)
const absRoot = resolve(rootArg)
const relRoot = relative(repoRoot, absRoot)

// ── File discovery ────────────────────────────────────────────────────────────

function findSpecFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      results.push(...findSpecFiles(join(dir, entry.name)))
    } else if (entry.isFile() && /\.spec\.tsx?$/.test(entry.name)) {
      results.push(join(dir, entry.name))
    }
  }
  return results
}

function isIgnored(filePath) {
  return ignoreList.some((ig) => filePath.endsWith(ig) || basename(filePath) === ig)
}

// ── Transforms ────────────────────────────────────────────────────────────────

/**
 * Exercices: keep lines between #start and #solution (the TODO lines).
 * Remove all three markers and the solution block.
 */
function transformExercices(content) {
  const lines = content.split("\n")
  const out = ['import { TODO } from "shared/utils"']
  let state = "normal" // normal | start | solution


  for (const line of lines) {
    if(/^(\s*)it(\(|\.)(.*)/.test(line)) {
      const skipped = line.replace(/^(\s*)it/, "$1it.skip")
      out.push(skipped)
      continue
    }

    const trimmed = line.trimStart()
    switch (state) {
      case "normal":
        if (trimmed === "// #start")    { state = "start";    break }
        out.push(line)
        break
      case "start":
        if (trimmed === "// #solution") { state = "solution"; break }
        if (trimmed === "// #end")      { state = "normal";   break }
        // Strip leading "// " (or "//" with no space) preserving indentation
        const indent = line.match(/^(\s*)/)[1]
        const uncommented = trimmed.replace(/^\/\/ ?/, "")
        out.push(uncommented.length > 0 ? indent + uncommented : "")
        break
      case "solution":
        if (trimmed === "// #end")      { state = "normal";   break }
        // drop commented solution lines
        break
    }
  }

  return out.join("\n")
}

/**
 * Solutions: uncomment lines between #solution and #end.
 * Remove TODO lines and all three markers.
 */
function transformSolutions(content) {
  const lines = content.split("\n")
  const out = []
  let state = "normal"

  for (const line of lines) {
    const trimmed = line.trimStart()
    switch (state) {
      case "normal":
        if (trimmed === "// #start")    { state = "start";    break }
        out.push(line)
        break
        case "start":
          if (trimmed === "// #solution") { state = "solution"; break }
          if (trimmed === "// #end")      { state = "normal";   break }
          // drop the TODO line(s)
          break
          case "solution": {
            if (trimmed === "// #end")      { state = "normal";   break }
            out.push(line)
        break
      }
    }
  }

  return out.join("\n")
}

// ── Branch sync ───────────────────────────────────────────────────────────────

function syncBranch(branchName, transformFn) {
  console.log(`\n── ${branchName} ${"─".repeat(Math.max(0, 48 - branchName.length))}`)

  // Dry-run: just report which files would change
  if (dryRun) {
    const files = findSpecFiles(absRoot).filter((f) => !isIgnored(f))
    let count = 0
    for (const file of files) {
      const original = readFileSync(file, "utf8")
      if (original !== transformFn(original)) {
        console.log(`  would update: ${relative(repoRoot, file)}`)
        count++
      }
    }
    console.log(`  ${count} file(s) would be updated.`)
    return
  }

  // Safety: refuse to overwrite the source branch
  if (branchName === sourceBranch) {
    console.error(`  ERROR: "${branchName}" is the current source branch. Aborting.`)
    process.exit(1)
  }

  // Create a temp directory for the worktree
  const wtDir = mkdtempSync(join(tmpdir(), "sync-branches-"))

  try {
    // Reset branchName to HEAD and check it out in an isolated worktree.
    // The source branch is never touched.
    git(`worktree add -B "${branchName}" "${wtDir}" HEAD`)

    // Remove paths that should not appear in the branch commit at all
    for (const p of branchIgnoreList) {
      const target = join(wtDir, p)
      rmSync(target, { recursive: true, force: true })
      console.log(`  removed: ${p}`)
    }

    // Transform every spec file in the worktree
    const wtRoot = join(wtDir, relRoot)
    const files = findSpecFiles(wtRoot).filter((f) => !isIgnored(f))
    let count = 0

    for (const file of files) {
      const original = readFileSync(file, "utf8")
      const transformed = transformFn(original)
      if (original !== transformed) {
        writeFileSync(file, transformed, "utf8")
        console.log(`  updated: ${relative(wtDir, file)}`)
        count++
      }
    }

    if (count === 0) console.log("  no spec changes.")

    // Stage everything, then write the index as a tree object
    git("add -A", wtDir)
    const tree = git("write-tree", wtDir)

    // Check whether this tree is identical to what the branch already has
    // (skip commit+push if nothing changed between two runs)
    let currentTree = null
    try { currentTree = git(`rev-parse "${branchName}^{tree}"`) } catch {}

    if (tree === currentTree) {
      console.log("  nothing to commit — already up to date.")
    } else {
      // Create an orphan commit: no -p flag means no parent, so no file history.
      // git commit-tree is a plumbing command — it never runs hooks.
      const commitHash = git(`commit-tree ${tree} -m "sync: ${branchName} from ${sourceBranch}"`, wtDir)

      // Move the branch pointer to the orphan commit (replaces any previous history)
      git(`reset --hard ${commitHash}`, wtDir)
      console.log(`  committed as orphan ${commitHash.slice(0, 8)}.`)

      if (noPush) {
        console.log("  --no-push: skipped.")
      } else {
        git(`push origin "${branchName}" --force --no-verify`, wtDir)
        console.log(`  pushed → origin/${branchName}`)
      }
    }
  } catch (err) {
    console.error(`  error: ${err.message}`)
    throw err
  } finally {
    try { git(`worktree remove "${wtDir}" --force`) } catch {}
    rmSync(wtDir, { recursive: true, force: true })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`Source        : ${sourceBranch}`)
console.log(`Root          : ${relRoot || "."}`)
if (branchIgnoreList.length) console.log(`Branch ignore : ${branchIgnoreList.join(", ")}`)
if (dryRun) console.log("Mode          : dry-run")
if (noPush)  console.log("Push          : disabled")

syncBranch(exercicesBranch, transformExercices)
syncBranch(solutionsBranch, transformSolutions)

console.log("\nDone.")
