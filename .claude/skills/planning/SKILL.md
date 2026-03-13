---
name: planning
description: Research and plan before implementation. Maps SSOTs, identifies duplicates, creates sprint with owner decision gates.
user-invocable: true
disable-model-invocation: false
argument-hint: "<topic or sprint to research>"
---

# Planning — Research & Documentation

Research topic: $ARGUMENTS

## Purpose

Before implementation or when parking lot requires research:
1. Investigate the problem space
2. Map the existing SSOTs and identify duplicates
3. Document findings
4. Create or update sprint plan with owner decision gates

## Protocol

### 1. SSOT Mapping (NEW — do this FIRST)

Before researching anything else, map what already exists:

```
For the domain this sprint/topic touches:
  - What types exist? Where are they defined? Any duplicates?
  - What schemas exist? Where? Competing Zod schemas?
  - What modules will be imported? Direct source or barrel re-export?
  - What files will be created/modified?
```

If duplicates are found → document them in the research doc and flag for
`/consolidate` before any sprint execution begins.

### 2. Create Research Document

In the sprint directory, create `{SPRINT-NAME}.research.md`:
```markdown
# Research: {topic}

**Date**: {YYYY-MM-DD}
**Sprint**: {associated sprint if any}
**Status**: IN_PROGRESS

## SSOT Map
{What types/schemas exist, where they live, any duplicates found}

## Question/Goal
{What we need to understand}

## Codebase Analysis
{What exists, patterns found, relevant files — VERIFIED by reading them}

## External Research
{Best practices, documentation, examples}

## Findings
{Key takeaways}

## Anti-Pattern Risks
{What bandaid patterns could emerge during implementation, how to avoid them}

## Recommendations
{Proposed approach with rationale}

## Files Referenced
- {file1}: {why relevant}
- {file2}: {why relevant}
```

### 3. Codebase Research

- Search for existing patterns: Grep for similar implementations
- Find related files: Glob for file structure
- **READ the actual files** — do not assume from names or docs
- Document what you find — don't just read and forget
- **Verify docs match reality** — prior sessions may have written docs describing
  architecture that doesn't exist on disk

### 4. External Research (if needed)

- Search for best practices
- Find authoritative documentation
- Look for known solutions to the problem

### 5. Update Sprint Document

If sprint exists:
1. Read sprint file
2. Add `## Research Notes` section linking to research doc
3. Add `## SSOT Map` section listing all types and their authoritative locations
4. Add `## Pre-Sprint Consolidation` if duplicates need merging first
5. Update tasks based on findings
6. Add any new prerequisites discovered

If no sprint exists:
1. Create sprint document following standard format
2. Include all checkboxes for implementation
3. Include SSOT map
4. Link research document

### 6. Present Findings

Summarize:
- What was learned
- What SSOTs were mapped (and any duplicates found)
- Recommended approach
- Any remaining questions (parking lot)

## STOP Points — Owner Decision Protocol

**Sprints are DRY RUNS.** The owner is in charge — not the AI.

### Rules
1. **ZERO ASSUMPTIONS** — If you don't know, you STOP and ask. Period.
2. **STOP at every decision point** — Any place where the direction could go more than one way, you STOP and present options to the owner. You do NOT pick for them.
3. **STOP when you need answers** — Architecture choices, naming, scope, priority, approach — all require owner sign-off before proceeding.
4. **Mark STOP points explicitly** in sprint documents:
   ```markdown
   ### STOP — Owner Decision Required
   **Question**: {what you need answered}
   **Options**: {A, B, C with tradeoffs}
   **Impact**: {what this decision affects downstream}
   ```
5. **Redo if needed** — If the owner says it's wrong, rewrite it. Get it right.
6. **No forward progress past a STOP** — Do NOT continue planning/coding past a STOP point until the owner answers.
7. **Sprint phases gate on owner approval** — Each phase ends with owner review. Next phase does not start without explicit go-ahead.

### What triggers a STOP
- Schema design choices (what fields, what types, what's required vs optional)
- Naming decisions (contract field names, function names, file paths)
- Architecture decisions (where code lives, what depends on what)
- Scope decisions (what's in this sprint vs deferred)
- Priority decisions (what order to build things)
- SSOT conflicts (same concept defined in two places — which wins?)
- Any time you're about to assume what the owner wants
- Any time two valid approaches exist and the "right" one depends on owner intent

## Never

- Never start implementation during research
- Never skip SSOT mapping
- Never skip documenting findings
- Never assume — verify in the codebase by reading the files
- Never describe architecture as existing without verifying on disk
- Never make architecture decisions without owner sign-off
- Never continue past a STOP point without owner answer
- Never treat a sprint as final until owner explicitly approves it
