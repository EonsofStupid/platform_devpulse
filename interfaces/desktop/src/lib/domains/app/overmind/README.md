# domains/app/overmind

> **Status:** `SCAFFOLD`
> **Version:** `0.1.0`
> **Last Updated:** `2026-01-22`
> **Layer:** `domains`
> **Kind:** `hub`
> **Route:** `/overmind`
> **Mode Default:** `PLANNING`

---

## Overview

> **Philosophy**: "Where thinking happens."

The **Ephemeral Sandbox** — for research, analytics, education, theorycrafting, prototyping, and CLI learning. Nothing leaves here unless explicitly **Graduated** or **Saved**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🧪 OVERMIND                                        [Not committed yet]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ACTIVE SESSIONS                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │   │
│  │  │ Fitness App     │  │ Auth Patterns   │  │ + New Session   │      │   │
│  │  │ Ideas           │  │ Research        │  │                 │      │   │
│  │  │ 75% explored    │  │ 40% explored    │  │    🧪           │      │   │
│  │  │ 2 days old      │  │ 5 hours old     │  │  Start fresh    │      │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  QUICK TEMPLATES (One-off personas)                                  │   │
│  │  [🔬 Researcher]  [🏗️ Architect]  [🧬 Scientist]                    │   │
│  │  [⚙️ Engineer]    [💻 Carmack]    [+ Custom]                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ EVICTION WARNING: "Fitness App Ideas" expires in 28 days        │   │
│  │     [Graduate to Project] [Export] [Dismiss]                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The 4 Pillars

1. **Learning** - Research, Analytics, Education (The Classroom)
2. **Theorycrafting** - "What if?" scenarios, Idea Bouncing, Echo Chamber
3. **Prototyping** - Code staging, UI Design ideas, Safe testing (Sandboxed)
4. **CLI/Terminal** - UI-driven way to learn Command Line

---

## Persona Cards (Standard Loadout)

Sub-Agents to help the user theorycraft:

| Persona | Purpose | Prompt Focus |
|---------|---------|--------------|
| **The Researcher** | "Find everything about X" | Deep information gathering |
| **The Architect** | "Structure this idea" | System design, organization |
| **The Scientist** | "Test this hypothesis" | Experiment design, validation |
| **The Engineer** | "Build this prototype" | Implementation, code staging |
| **The Carmack** | "Optimize this code" | Performance, efficiency |

---

## Governance & Policies

### Ephemerality Rules

| Trigger | Action |
|---------|--------|
| 30 days inactive | Auto-evict with prior warning |
| Disk < 20% free | Early eviction of oldest unsaved |
| > 20 workspaces | Prompt cleanup |
| > 50GB total | Force eviction with warning |

### Safety

- **Sandboxed execution** - No impact on Core Project Memories
- **Low-weight vectors** - Not persisted until graduation
- **Explicit graduation** - User action required to move to libSQL

---

## Child Routes

| Route | Purpose | Component |
|-------|---------|-----------|
| `/overmind` | Dashboard (default) | `OvermindDashboard.svelte` |
| `/overmind/session/:id` | Active sandbox | `SessionWorkspace.svelte` |
| `/overmind/classroom` | Visual lessons | `ClassroomPage.svelte` |
| `/overmind/agents` | Agent testing | `AgentTestingPage.svelte` |

---

## Exploration Cards

| State | Icon | Meaning |
|-------|------|---------|
| DECIDED | ✅ | Firm decision made |
| UNSURE | 🤔 | Needs more exploration |
| OPEN | ❓ | Not yet explored |

---

## Structure (Strict Hyper-Modular)

```
domains/app/overmind/
├── README.md               # This file
├── CHECKLIST.md            # Quality gates (TODO)
├── index.ts                # Barrel exports (TODO)
├── services/
│   └── overmind.service.ts # Ephemeral state logic
├── stores/
│   └── session.store.svelte.ts # Svelte 5 Runes for local state
├── components/
│   ├── SessionCard.svelte
│   ├── ExplorationCard.svelte
│   ├── PersonaCard.svelte
│   └── EvictionWarning.svelte
├── pages/
│   ├── OvermindDashboard.svelte
│   ├── SessionWorkspace.svelte
│   ├── ClassroomPage.svelte
│   └── AgentTestingPage.svelte
└── utils/
    └── sandbox.utils.ts    # Sandbox-specific helpers
```

---

## State Dependencies

```typescript
onMount(() => {
    global.setDomain('overmind');
});
```

### Chat Mode

OverMind supports **PLANNING** (default) and **GENERAL** modes only.

---

## Data Sources

| Source | Purpose |
|--------|---------|
| **Session store** | Active sandbox state (ephemeral) |
| **Low-weight vectors** | Exploration embeddings (not persisted) |
| **Eviction queue** | 30-day auto-cleanup tracking |

---

## ADR References

| ADR | Status | Title |
|-----|--------|-------|
| ADR-015 | PENDING | Session eviction policy |
| ADR-016 | PENDING | Graduation to project flow |

---

## Related

| Resource | Path | Purpose |
|----------|------|---------|
| Container | `domains/app/README.md` | Parent container |
| DevForge | `domains/app/devforge/` | Graduation target |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-22 | Enhanced specification with pillars and personas |
