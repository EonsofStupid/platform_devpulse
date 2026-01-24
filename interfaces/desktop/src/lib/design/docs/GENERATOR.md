# ColdLight Documentation Generator

> **Self-healing documentation. If it can't be derived, it doesn't belong.**

---

## Core Principle

Documentation generates from taxonomy + code structure. Manual edits are forbidden in generated files.

```
TAXONOMY (SSOT) + CODE STRUCTURE → GENERATOR → DOCUMENTATION
```

---

## Inputs

### From Taxonomy

| File | Provides |
|------|----------|
| `taxonomy/primitiveKinds.ts` | All `data-kind` values |
| `taxonomy/primitiveRegistry.ts` | Slots per primitive |
| `taxonomy/contracts.ts` | Prop schemas (Zod) |
| `taxonomy/kinds.ts` | Block/semantic kinds |

### From Code Structure

| Source | Provides |
|--------|----------|
| `primitives/*/index.ts` | Primitive exports |
| `primitives/*/types.ts` | Prop interfaces |
| `primitives/*/a11y.md` | Accessibility contracts |
| `semantics/*/index.ts` | Semantic exports |
| `blueprints/*/index.ts` | Blueprint definitions |
| JSDoc comments | Inline documentation |

### From Tokens

| File | Provides |
|------|----------|
| `tokens/tokens.ts` | Design token values |
| Generated `types.ts` | Token type definitions |

---

## Outputs

### Generated Files (NEVER hand-edit)

| File | Generated From |
|------|----------------|
| `tokens/tokens.css` | `tokens/tokens.ts` |
| `tokens/types.ts` | `tokens/tokens.ts` |
| `tokens/tailwind.preset.ts` | `tokens/tokens.ts` |
| `recipes/css/surfaces.gen.css` | `tokens/tokens.ts` |
| `docs/api/primitives.md` | Taxonomy + primitives |
| `docs/api/semantics.md` | Taxonomy + semantics |
| `docs/api/tokens.md` | `tokens/tokens.ts` |

### Generated Diagrams

| Diagram | Shows |
|---------|-------|
| Taxonomy map | All primitive kinds + slots |
| Layer diagram | Token → Recipe → Primitive → Semantic → Blueprint |
| Provider boundary | Melt UI → _internal → ColdLight |
| Variant key reference | `s`, `z`, `l`, `t`, `m` encoding |

---

## Generation Pipeline

### Phase 1: Token Generation

```
tokens/tokens.ts
       ↓
  vite-plugin.ts
       ↓
├── tokens/tokens.css
├── tokens/types.ts
├── tokens/tailwind.preset.ts
└── recipes/css/surfaces.gen.css
```

### Phase 2: Registry Generation

```
taxonomy/*.ts
       ↓
  vite-plugin.ts (audit)
       ↓
├── Validates all primitives have registry entries
├── Validates all slots are documented
└── Generates registry manifest
```

### Phase 3: Documentation Generation

```
taxonomy + primitives + JSDoc
       ↓
  doc-generator (Docusaurus plugin)
       ↓
├── docs/api/primitives.md
├── docs/api/semantics.md
├── docs/api/blueprints.md
└── docs/api/tokens.md
```

### Phase 4: Diagram Generation

```
taxonomy + code structure
       ↓
  diagram-generator (mermaid/graphviz)
       ↓
├── docs/diagrams/taxonomy.svg
├── docs/diagrams/layers.svg
└── docs/diagrams/provider.svg
```

---

## Trigger Points

| Event | What Runs |
|-------|-----------|
| `pnpm dev` | Token generation (watch mode) |
| `pnpm build` | Full pipeline |
| `git commit` (lefthook) | Taxonomy audit |
| `pnpm docs:generate` | Full doc regeneration |

---

## Validation Rules

### Taxonomy Audit

- [ ] Every primitive in `primitives/` has a kind in `primitiveKinds.ts`
- [ ] Every kind has slots in `primitiveRegistry.ts`
- [ ] Every slot file matches registry slots
- [ ] Every primitive has `types.ts`
- [ ] Every primitive has `a11y.md`

### Token Audit

- [ ] All CSS variables use `--dp-` prefix
- [ ] All values are OKLCH for colors
- [ ] No raw hex/rgb values
- [ ] DTCG format compliance

### Recipe Audit

- [ ] All CSS uses `var(--dp-*)` references
- [ ] No hand-written CSS in `*.gen.css` files
- [ ] Variant keys match `v-s{#}z{#}l{#}t{#}m{#}` format

---

## File Markers

Generated files include markers to prevent accidental edits:

```css
/* GENERATED FILE - DO NOT EDIT */
/* Source: tokens/tokens.ts */
/* Generated: 2026-01-23T12:00:00Z */
```

```typescript
/**
 * @generated
 * @source tokens/tokens.ts
 */
```

---

## Docusaurus Integration

### Sidebar Generation

```typescript
// docusaurus.config.js
{
  plugins: [
    ['@docusaurus/plugin-content-docs', {
      sidebarItemsGenerator: async ({ docs }) => {
        // Auto-generate from taxonomy
        return generateFromTaxonomy(docs);
      },
    }],
  ],
}
```

### API Reference Pages

Each primitive gets an auto-generated page:

```markdown
# Dialog

## Kind
`dialog`

## Slots
| Slot | Element | Description |
|------|---------|-------------|
| root | div | Container |
| trigger | button | Opens dialog |
| content | div | Dialog body |
| overlay | div | Backdrop |
| close | button | Closes dialog |

## Props
(Generated from types.ts)

## Accessibility
(Imported from a11y.md)
```

---

## Commands

```bash
# Generate tokens only
pnpm ds:tokens:build

# Full documentation generation
pnpm docs:generate

# Validate taxonomy
pnpm audit:taxonomy

# Watch mode (dev)
pnpm dev
```

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing kind` | Primitive not in registry | Add to `primitiveKinds.ts` |
| `Missing slots` | Slots not defined | Add to `primitiveRegistry.ts` |
| `Invalid variant` | Wrong format | Use `v-s{#}z{#}l{#}t{#}m{#}` |
| `Raw color` | Non-token color | Use `var(--dp-*)` |

---

## Future: AI Integration

The generator pipeline enables:

1. **AI understands structure** — Taxonomy is machine-readable
2. **AI generates compliant code** — Templates from registry
3. **AI validates contributions** — Audit at commit time
4. **AI documents changes** — Auto-generated changelogs

---

**Documentation that heals itself. Humans write taxonomy, machines write docs.**
