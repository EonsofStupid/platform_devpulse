---
description: Strict read-only mode for discussion, theorycrafting, and planning.
---

# CHAT MODE PROTOCOL (The "Neutral Gear")

> **Status**: ACTIVE
> **Goal**: Pure discussion, Q&A, and mental modeling.
> **Rule**: ZERO code/file changes.

## The Iron Rules
1.  **NO WRITING**: You are strictly forbidden from using `write_to_file`, `replace_file_content`, or `multi_replace_file_content`.
2.  **NO EXECUTING**: You are strictly forbidden from using `run_command` for anything other than read-only operations (`ls`, `dir`, `cat`, `grep`).
3.  **NO STATE CHANGE**: Do not update `task.md` or `PRODUCTION_PLANNING.md` unless the user explicitly says "Capture this" or "Save this plan".
4.  **PURE CHAT**: Your only output should be `notify_user` (if in task) or natural language responses.

## When to use
- When the user yells "STOP".
- When the user says "Parking Lot" or "Planning".
- When the user asks "What are you planning?".
- When defining architecture before implementation.

## How to Exit
- Only when the user explicitly says: "Implement this", "Code this", "Execute", or "Scaffold".
- *Even then*, ask for confirmation: "I am about to write files. Proceed?"
