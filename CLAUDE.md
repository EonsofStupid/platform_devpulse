# DevPulse Platform Architecture

## Structure

```
platform_devpulse/
├── interfaces/desktop/     # Tauri + SvelteKit 5 desktop app
│   ├── src/                # SvelteKit app source
│   └── src-ui/             # UI layer
├── systems/engine/         # Rust engine, managed by desktop facade for Maestro
├── kernel/maestro/         # SENSITIVE IP - AI orchestrator kernel
│                           # Minions, CAG, RAG, HYDE, KV cache tier
└── lab/                    # Separate - observer pattern, subscribes only
```

## Tech Stack

- **Frontend**: SvelteKit 5 + Svelte 5 (runes)
- **Desktop**: Tauri 2.0 (Rust)
- **Backend**: Rust
- **Databases**: libpq (PostgreSQL), SurrealDB, DuckDB
  - Platform has its own DB instances
  - Lab has its own separate DB instances

## Architecture Pattern

- **Local-first** hybrid web app
- Web traffic funneled via angryvibers and devpulse.app
- Desktop facade manages Rust engine
- Maestro kernel orchestrates AI workloads

## Design System: ColdLight (@devpulse/coldlight)

Location: `interfaces/desktop/src/lib/design/`

### Layers
1. **Tokens** - Design tokens (colors, spacing, typography)
2. **Primitives** - Unstyled, accessible components (Bits UI + custom ARIA)
3. **Recipes** - Styling patterns applied via class prop
4. **Components** - Composed primitives with recipes
5. **Blocks** - Page-level compositions
6. **Renderers** - Dynamic block rendering

### Key Dependencies
- bits-ui ^2.15.4
- svelte-sonner ^1.0.7
- @tanstack/svelte-table ^8.21.3
- @tanstack/svelte-query ^6.0.17
- @tanstack/svelte-virtual ^3.13.18
- tailwindcss ^4.1.18

## Working Directory

Primary dev work: `interfaces/desktop/src/`

## Commands

```bash
cd interfaces/desktop/src
pnpm dev          # Start dev server
pnpm build        # Build
pnpm check        # TypeScript check
```
