# Sprint Template — ColdLight Foundational Work

> **USE THIS FOR EVERY SPRINT**
> Copy this file, rename to `SPRINT_[NAME].md`, fill in sections

---

## SPRINT RULES (MANDATORY)

1. **RESEARCH FIRST** — No code until research section is complete
2. **MARK CHECKBOXES** — Update this file after EVERY step
3. **ERROR LIMIT** — If same error occurs twice, STOP and add to ERROR LOG
4. **VERIFY EACH STEP** — No skipping verification commands
5. **NO ASSUMPTIONS** — If unsure, research the actual source (node_modules, docs)

---

## SPRINT INFO

| Field | Value |
|-------|-------|
| Name | `[SPRINT NAME]` |
| Created | `[DATE]` |
| Status | `NOT STARTED` / `IN PROGRESS` / `BLOCKED` / `COMPLETE` |
| Layer | `[taxonomy / primitives / recipes / blocks]` |

---

## RESEARCH

> Complete this BEFORE writing any code

### Source of Truth

| What | Location |
|------|----------|
| Package exports | `node_modules/[package]/dist/index.d.ts` |
| Existing code | `[path to existing implementation]` |
| Reference docs | `tech_refs/[folder]/` |

### Findings

```
[Document what you found from actual source inspection]
```

### Key Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| | | |

---

## STEPS

### Step 1: [Description]

File: `[path]`

- [ ] 1.1 [Read file to confirm current state]
- [ ] 1.2 [Make change]
- [ ] 1.3 [Verify change]

**Verification:**
```bash
[command to verify]
```

---

### Step 2: [Description]

File: `[path]`

- [ ] 2.1 [Read file to confirm current state]
- [ ] 2.2 [Make change]
- [ ] 2.3 [Verify change]

**Verification:**
```bash
[command to verify]
```

---

### Step N: Full Verification

- [ ] N.1 Run `pnpm check` from `interfaces/desktop/src`
- [ ] N.2 Confirm zero errors in target files
- [ ] N.3 Update CHECKLIST.md if applicable
- [ ] N.4 Mark sprint COMPLETE

---

## ERROR LOG

> If an error occurs twice, STOP and document here

| Step | Error | Attempts | Resolution |
|------|-------|----------|------------|
| — | — | — | — |

---

## BLOCKED

> If blocked, document here and wait for resolution

| Blocker | Waiting For |
|---------|-------------|
| — | — |

---

## SIGN-OFF

Before marking COMPLETE:

- [ ] All step checkboxes marked
- [ ] Verification commands passed
- [ ] ERROR LOG empty or all resolved
- [ ] CHECKLIST.md updated (if applicable)
- [ ] No assumptions made — all from source

**Sprint Status:** `[NOT STARTED / IN PROGRESS / BLOCKED / COMPLETE]`

---

## NOTES

```
[Any additional context or learnings for future reference]
```
