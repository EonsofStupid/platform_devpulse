---
paths:
  - "interfaces/desktop/src/**/*.svelte"
  - "interfaces/desktop/src/**/*.ts"
---

# SvelteKit 5 + ColdLight Rules

- Use Svelte 5 runes ($state, $derived, $effect) — NEVER legacy stores
- Use `{#snippet}` blocks — NEVER legacy slots
- Imports MUST use `.js` extension for TypeScript files
- Use `forEach` for Set iteration — NEVER `for...of` on Sets
- TailwindCSS 4 for styling — utility-first, no inline style objects
- ColdLight is SOLE AUTHORITY for all UI components and tokens
- Validation: ArkType everywhere (Zod is DROPPED across entire platform)
- Type-safe IPC: Specta + tauri-specta for TS bindings from Rust types
- NEVER import from @melt-ui directly — ColdLight wraps Melt primitives
- Server Components don't exist in SvelteKit — this is NOT Next.js
- "use client" does not exist here — do NOT add React directives