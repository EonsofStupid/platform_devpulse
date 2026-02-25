---
sidebar_position: 1
slug: /
---

# DevPulse Platform Documentation

DevPulse is a local-first hybrid desktop application built on Tauri 2.0 + SvelteKit 5.

## Platform Architecture

```mermaid
flowchart TD
    subgraph "interfaces/desktop"
        SK[SvelteKit 5] --> CL[ColdLight Design System]
        SK --> Sys[System Layer]
        SK --> Dom[Feature Domains]
        SK --> Tauri[Tauri 2.0 IPC]
    end
    subgraph "systems/engine"
        Engine[DevPulse Engine - Rust]
    end
    subgraph "kernel/maestro"
        Maestro[AI Orchestrator - Rust]
    end
    Tauri --> Engine
    Engine --> Maestro
```

## Namespaces

| Namespace | Scope | Language |
|-----------|-------|----------|
| `@devpulse/coldlight` | Design system | TypeScript / Svelte |
| `@devpulse/sys` | System layer | TypeScript |
| `@devpulse/domains/{name}` | Feature domains | TypeScript / Svelte |
| `@devpulse/routes` | SvelteKit routes | Svelte |
| `@devpulse/tauri` | Desktop commands | Rust |
| `@devpulse/engine` | Signal engine | Rust |
| `@devpulse/maestro` | AI orchestrator | Rust |
| `@devpulse/scripts` | Build automation | TypeScript |

## Quick Links

- [ColdLight Design System](/coldlight/overview) — tokens, primitives, recipes, components
- [API Reference](/api) — TypeDoc-generated API documentation
- [Platform Scanner](/platform/header-compliance) — header compliance and file coverage
- [Sprints](/sprints) — sprint planning and tracking
