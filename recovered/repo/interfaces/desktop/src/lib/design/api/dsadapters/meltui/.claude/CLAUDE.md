# MeltUI Provider Adapter — Claude Context

> **This is the Provider Adapter Layer for MeltUI.**
> **Architecture: Ports & Adapters (Hexagonal)**

---

## TERMINOLOGY (Industry Correct)

| Term | What It Is | Location |
|------|------------|----------|
| **Headless UI Provider** | MeltUI — behavior engine (ARIA, focus, keyboard) | `@melt-ui/svelte` |
| **Provider Adapter Layer** | Binding that maps MeltUI → ColdLight | `api/dsadapters/meltui/` |
| **Engine field** | Schema declares `engine: "meltui"` per kind | `api/dsadapters/meltui/_internal/{kind}/schema.ts` |

---
YOU DO NOT EXECUTE A SINGLE LINE OF CODE WITHOUT A TRUE PLAN WRITTEN FIRST.
METHODICALLY AND ACTUALLY OFF THE CODEBASE. ZERO ASSUMPTIONS.
THAT PLAN ALLOWS YOU TO HAVE RESEARCH. YOU DO NOT GUESS.
THIS IS FOUNDATIONAL WORK.
---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  COLDLIGHT PRIMITIVES + COMPONENTS (Public API)              │
│  Consumer sees: ColdLight types, ColdLight imports           │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ imports from
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  PROVIDER ADAPTER LAYER (api/dsadapters/meltui/)            │
│  ─────────────────────────────────────────────              │
│  Maps MeltUI → ColdLight AdapterResult interface            │
│                                                             │
│  Per-kind: _internal/{kind}/                                │
│    factory.ts    — wraps MeltUI builder                     │
│    _transport/   — maps attrs/handlers/refs                 │
│    schema.ts     — ComponentSchema with engine:"meltui"     │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ wraps
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  HEADLESS UI PROVIDER (MeltUI)                              │
│  Provides: ARIA, IDs, focus, keyboard, floating, portal     │
│  We PASSTHROUGH — we do NOT fight this                      │
└─────────────────────────────────────────────────────────────┘
```

---

## THE PASSTHROUGH PRINCIPLE

**We do NOT fight MeltUI.**

| MeltUI Provides | We Passthrough | ColdLight Adds |
|-----------------|----------------|----------------|
| `role="dialog"` | Accept | — |
| `aria-modal="true"` | Accept | — |
| `aria-labelledby` | Accept | — |
| ID generation | Accept | — |
| Focus trapping | Accept | — |
| Keyboard handling | Accept | — |
| — | — | `data-kind` |
| — | — | `data-slot` |
| — | — | `data-state` |
| — | — | `class` |

**ColdLight appears as SSOT to consumers. Internally, we're mapping MeltUI.**

---

## ADAPTER RESULT (Universal Interface)

Every MeltUI adapter returns `AdapterResult`:

```typescript
interface AdapterResult {
  states: Record<string, { get current(): boolean; set current(v: boolean) }>;
  attrs: Record<string, Record<string, string | undefined>>;
  handlers: Record<string, Record<string, (e: Event) => void>>;
  context?: Record<string, unknown>;
}
```

---

## FOLDER STRUCTURE

```
api/dsadapters/meltui/
├── _internal/
│   ├── {kind}/
│   │   ├── factory.ts          # Wraps MeltUI builder → AdapterResult
│   │   ├── schema.ts           # ComponentSchema with engine:"meltui"
│   │   ├── _transport/
│   │   │   ├── factory.ts      # Maps slots to attrs/handlers/refs
│   │   │   ├── types.ts        # Transport-specific types
│   │   │   └── index.ts        # Barrel
│   │   └── index.ts            # Barrel
│   └── ...
├── index.ts                    # Barrel export
└── .claude/CLAUDE.md           # This file
```

---

## WHAT THIS FOLDER IS NOT

- NOT the public API (that's `primitives/` and `components/`)
- NOT the design system (that's ColdLight)
- NOT recipes or styling
- NOT documentation for end users

**This IS:**
- The compatibility binding
- The adapter that makes MeltUI usable under ColdLight's rules
- Internal plumbing that consumers never see

---

**This is the MeltUI Provider Adapter. It maps. It doesn't fight.**
