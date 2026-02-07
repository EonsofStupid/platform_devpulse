---
name: parkinglot
description: Handle blockers, confusion, or decision points during implementation
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, TodoWrite
argument-hint: "<brief description of the blocker or decision needed>"
---

# Parking Lot — Decision Point Handler

Blocker/Question: $ARGUMENTS

## Purpose

When implementing a sprint and encountering:
- Ambiguity in requirements
- Multiple valid approaches
- Unexpected errors or conflicts
- Architectural decisions needed

STOP. Do not guess. Do not proceed. Enter parking lot mode.

## Protocol

### 1. Document the Blocker
Create or update `PARKING_LOT.md` in the sprint's directory with:
```markdown
## [TIMESTAMP] Blocker: {brief title}

**Sprint**: {current sprint name}
**Task**: {current task from checklist}
**Status**: AWAITING_DECISION

### Context
{What I was doing when this came up}

### The Problem
{Specific issue or ambiguity}

### Options Identified
1. **Option A**: {description} — {tradeoff}
2. **Option B**: {description} — {tradeoff}
3. **Option C**: {description} — {tradeoff}
```

### 2. Present Multiple Choice to User
Use AskUserQuestion with:
- Clear, specific question
- 2-4 concrete options
- Include "Need more research" option if applicable

### 3. Update Sprint Document
After decision is made:
1. Read the sprint file
2. Add a `## Decisions` section if not present
3. Record: decision, rationale, timestamp
4. Update any affected task descriptions

### 4. Resume Implementation
- Mark parking lot item as RESOLVED
- Continue from where you stopped
- Re-read sprint file before continuing (MANDATORY)

## Exit Conditions

- User makes a decision → Resume implementation
- User requests more research → Invoke `/planning` skill
- User wants to abandon approach → Update sprint, mark task as blocked

## Never

- Never guess when blocked
- Never proceed without user decision
- Never forget to update sprint documentation
