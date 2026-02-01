---
name: review
description: Code review with actionable feedback
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task, Bash
argument-hint: "[file or git diff range]"
---

# Code Review

Review: $ARGUMENTS

Current diff context:
!`git diff --stat HEAD~1`

## Review Checklist

For each file changed:
1. **Correctness** — Does the logic do what it claims?
2. **Edge cases** — What inputs would break this?
3. **Security** — Any injection, XSS, or auth bypass risks?
4. **Performance** — Any N+1 queries, unbounded loops, or memory leaks?
5. **Readability** — Could a new team member understand this in 60 seconds?
6. **Tests** — Are the changes covered by tests?

## Output Format

For each issue found:
- **Severity**: Critical / Warning / Nit
- **File:Line**: exact location
- **Issue**: what's wrong
- **Fix**: suggested change
