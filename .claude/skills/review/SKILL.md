---
name: review
description: Code review with anti-pattern detection, SSOT compliance, and actionable feedback.
user-invocable: true
disable-model-invocation: true
argument-hint: "[file or git diff range]"
---

# Code Review

Review: $ARGUMENTS

Current diff context:
!`git diff --stat HEAD~1`

## Review Checklist

For each file changed:

### Standard Checks
1. **Correctness** — Does the logic do what it claims?
2. **Edge cases** — What inputs would break this?
3. **Security** — Any injection, XSS, or auth bypass risks?
4. **Performance** — Any N+1 queries, unbounded loops, or memory leaks?
5. **Readability** — Could a new team member understand this in 60 seconds?
6. **Tests** — Are the changes covered by tests?

### Anti-Pattern Checks (Pre-Release Specific)
7. **Duplicate definitions** — Does this change define a type/const/interface that already exists elsewhere? Check the SSOT.
8. **Bandaid imports** — Does this add a re-export barrel, backward-compat shim, or import redirect?
9. **Optional escape** — Does this make a schema field optional to avoid fixing consumers?
10. **Any types** — Does this introduce `as any`, `: any`, or `as unknown`?
11. **Deleted concepts** — Does this reference taxonomy/, catalog/, semantics/, molecules/, shortcodes/, builders/, or a ui/ folder inside packages/coldlight/? (An app domain's `ui/<name>/` adapters are required — owner 2026-10-21.)
12. **Barrel depth** — Does internal code import from the public API barrel instead of the source file?
13. **Schema weakening** — Does this loosen a Zod schema to avoid fixing the data it validates?

### SSOT Compliance
14. **Import sources** — Do all imports point to the authoritative source, not a re-export?
15. **Type origin** — Are types imported from where they're defined, not from where they're re-exported?
16. **One definition** — Is every exported name defined in exactly one file?

## Output Format

For each issue found:
- **Severity**: Critical / Warning / Nit
- **File:Line**: exact location
- **Issue**: what's wrong
- **Fix**: suggested change
- **Category**: Standard / Anti-Pattern / SSOT

### Summary

```
REVIEW: {target}

Standard:      {pass/X issues}
Anti-Pattern:  {pass/X issues}
SSOT:          {pass/X issues}

VERDICT: APPROVE / REQUEST CHANGES / BLOCK
```

BLOCK if any Critical anti-pattern or SSOT violation found.
