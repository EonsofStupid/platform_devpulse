# ColdLight Adapter Documentation

> **SSOT for ColdLight primitive contracts, slots, and states.**

---

## Documents

| Document | Purpose |
|----------|---------|
| [COLDLIGHT_SPEC.md](./COLDLIGHT_SPEC.md) | **Master specification** — Complete architecture |
| [STATE_TOKENS.md](./STATE_TOKENS.md) | **State vocabulary** — All `data-state` tokens |
| [SLOT_VOCABULARY.md](./SLOT_VOCABULARY.md) | **Slot vocabulary** — All `data-slot` values |
| [_internal/README.md](./_internal/README.md) | **Mapping format** — `*.internal.ts` file structure |

---

## Quick Reference

### Three Required Attributes

```html
<div
  data-kind="accordion"
  data-slot="content"
  data-state="open focused"
>
```

### State Token Format

```html
<!-- Space-separated tokens -->
data-state="open focused invalid"
```

```css
/* CSS uses ~= for token matching */
[data-state~="open"] { ... }
```

### Slot Naming

- lowercase kebab-case
- semantic part names
- provider-agnostic

### File Structure

```
coldlight/
├── README.md              # This file
├── COLDLIGHT_SPEC.md      # Master specification
├── STATE_TOKENS.md        # State vocabulary
├── SLOT_VOCABULARY.md     # Slot vocabulary
└── _internal/
    ├── README.md          # Mapping format guide
    └── *.internal.ts      # Per-primitive mappings
```

---

## Before Creating a Primitive

1. ✅ `_internal/<kind>.internal.ts` exists
2. ✅ Slots defined in SLOT_VOCABULARY.md
3. ✅ States defined in STATE_TOKENS.md
4. ✅ Kind exists in taxonomy

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  ColdLight                       │
│  (SSOT: data-kind, data-slot, data-state)       │
├─────────────────────────────────────────────────┤
│              Adapter Layer                       │
│  (_internal/*.internal.ts mappings)             │
├─────────────────────────────────────────────────┤
│           Provider (MeltUI)                      │
│  (ARIA, focus, keyboard, positioning)           │
└─────────────────────────────────────────────────┘
```

---

**Read COLDLIGHT_SPEC.md for the complete specification.**
