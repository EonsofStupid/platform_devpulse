---
name: planning
description: Research and plan before implementation, creating accompanying documentation
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, Write, TodoWrite
argument-hint: "<topic or sprint to research>"
---

# Planning — Research & Documentation

Research topic: $ARGUMENTS

## Purpose

Before implementation or when parking lot requires research:
1. Investigate the problem space
2. Review existing patterns in codebase
3. Document findings
4. Create or update sprint plan

## Protocol

### 1. Create Research Document
In the sprint directory, create `{SPRINT-NAME}.research.md`:
```markdown
# Research: {topic}

**Date**: {YYYY-MM-DD}
**Sprint**: {associated sprint if any}
**Status**: IN_PROGRESS

## Question/Goal
{What we need to understand}

## Codebase Analysis
{What exists, patterns found, relevant files}

## External Research
{Best practices, documentation, examples}

## Findings
{Key takeaways}

## Recommendations
{Proposed approach with rationale}

## Files Referenced
- {file1}: {why relevant}
- {file2}: {why relevant}
```

### 2. Codebase Research
- Search for existing patterns: `Grep` for similar implementations
- Find related files: `Glob` for file structure
- Read key files: understand current architecture
- Document what you find — don't just read and forget

### 3. External Research (if needed)
- Search for best practices
- Find authoritative documentation
- Look for known solutions to the problem

### 4. Update Sprint Document
If sprint exists:
1. Read sprint file
2. Add `## Research Notes` section linking to research doc
3. Update tasks based on findings
4. Add any new prerequisites discovered

If no sprint exists:
1. Create sprint document following standard format
2. Include all checkboxes for implementation
3. Link research document

### 5. Present Findings
Summarize:
- What was learned
- Recommended approach
- Any remaining questions (→ parking lot)

## Output

Always produce:
1. Research document (detailed notes)
2. Updated/new sprint document (actionable plan)
3. Summary to user (key findings + recommendation)

## Never

- Never start implementation during research
- Never skip documenting findings
- Never assume — verify in the codebase
