---
paths:
  - "interfaces/desktop/src/**/*.svelte"
  - "interfaces/desktop/src/**/*.ts"
---

# SvelteKit 5 Rules

- Use Svelte 5 runes syntax ($state, $derived, $effect) — never legacy stores
- Use `{#snippet}` blocks, not legacy slots
- Imports must use `.js` extension for TypeScript files
- Use `forEach` for Set iteration, never `for...of` on Sets
- TailwindCSS 4 for styling — utility-first, no inline style objects
