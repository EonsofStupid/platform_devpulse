---
name: explain
description: Explain code in plain English for non-technical audiences
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task
argument-hint: "<file path or concept>"
---

# Code Explainer (Layman Mode)

Explain this in plain English that a non-programmer could understand: $ARGUMENTS

## Rules

1. No jargon — if you must use a technical term, define it in parentheses
2. Use analogies to everyday objects (offices, kitchens, libraries, mail systems)
3. Start with the "what does this DO for the user" before the "how"
4. Use numbered steps for processes
5. Keep paragraphs to 2-3 sentences max
6. End with a one-sentence "In short:" summary
