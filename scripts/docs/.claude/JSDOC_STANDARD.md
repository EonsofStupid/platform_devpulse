# ColdLight JSDoc Standard

> **SSOT** for all file headers, function docs, type docs, and component docs.
> TypeDoc 0.28 + typedoc-plugin-markdown + typedoc-plugin-mermaid.
> tsdoc.json custom tags registered and TypeDoc-aware.

---

## Rule: TypeScript Types Are Truth — JSDoc Adds INTENT

Do NOT repeat type information in JSDoc. TypeScript declares types. JSDoc explains:
- **Why** this exists
- **How** to use it (examples)
- **What** to watch out for (throws, edge cases)
- **Where** it fits in the architecture (layer, kind, mermaid diagrams)

---

## Custom Tags (registered in tsdoc.json)

### Block Tags (carry content)

| Tag | Purpose | Example |
|-----|---------|---------|
| `@layer` | Architecture layer | `@layer primitives` |
| `@kind` | Component kind | `@kind button` |
| `@slot` | Slot declaration (repeatable) | `@slot root — The main element` |
| `@package` | Package scope | `@package @devpulse/coldlight` |
| `@aria` | ARIA attribute docs (repeatable) | `@aria aria-pressed — Toggle state` |
| `@keyboard` | Keyboard binding docs (repeatable) | `@keyboard Enter — Activates the button` |
| `@dataattr` | Data attribute docs (repeatable) | `@dataattr data-state — open \| closed` |
| `@transport` | Transport adapter reference | `@transport AccordionTransport` |
| `@builder` | Builder reference | `@builder new Accordion()` |

### Modifier Tags (boolean flags)

| Tag | Purpose |
|-----|---------|
| `@primitive` | Marks as primitive layer |
| `@recipe` | Marks as recipe layer |
| `@material` | Marks as material/token layer |
| `@focus` | Has focus management |
| `@taxonomy` | Part of taxonomy system |
| `@internal` | Internal — not part of public API |

---

## File Header Templates

### Primitive types.ts

```typescript
/**
 * @file primitives/{kind}/types.ts
 * @kind {kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * {Kind} primitive type declarations — structural props, slot/state vocabularies.
 *
 * ariaStateProvider: "{coldlight|meltui}" — who owns ARIA for this primitive.
 *
 * WAI-ARIA APG: {link}
 */
```

### Primitive contract.ts

```typescript
/**
 * @file primitives/{kind}/contract.ts
 * @kind {kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * {Kind} PrimitiveContract — SSOT declaration for the {kind} primitive.
 *
 * ariaStateProvider: "{coldlight|meltui}"
 *
 * @slot root — The main wrapper element
 * @slot trigger — Button that toggles the {kind}
 * @keyboard Enter — Activates the trigger
 * @keyboard Space — Activates the trigger
 * @aria aria-expanded — Open state of the content
 *
 * WAI-ARIA APG: {link}
 */
```

### Primitive {Kind}.svelte

```svelte
<!--
  @component {Kind}Root
  @file primitives/{kind}/{Kind}.svelte
  @kind {kind}
  @layer primitives
  @package @devpulse/coldlight

  Structureless {kind} primitive — semantic HTML with data attributes only.
  Contract: kind="{kind}", slot="root"

  Zero ARIA at primitive layer. ARIA applied by components/{kind}/.
  Styling applied by recipe class string from component layer.

  @example
  ```svelte
  <{Kind} class="recipe-class">Content</{Kind}>
  ```

  WAI-ARIA APG: {link}
-->
```

### _internal factory.ts

```typescript
/**
 * @file api/adapters/meltui/_internal/{kind}/factory.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * MeltUI {Kind} Factory — ONLY file that imports from `melt` for {kind}.
 * Wraps melt v0.44 {Kind} class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * @builder new {Kind}()
 *
 * WAI-ARIA APG: {link}
 */
```

### _internal _transport/types.ts

```typescript
/**
 * @file api/adapters/meltui/_internal/{kind}/_transport/types.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Typed transport interface for the MeltUI {kind} adapter.
 * Maps melt v0.44 {Kind} API → ColdLight slot vocabulary.
 *
 * @slot trigger — Maps to melt {kind}.trigger
 * @slot content — Maps to melt {kind}.content
 *
 * @transport {Kind}Transport
 *
 * WAI-ARIA APG: {link}
 */
```

### _internal _transport/factory.ts

```typescript
/**
 * @file api/adapters/meltui/_internal/{kind}/_transport/factory.ts
 * @package @devpulse/coldlight
 * @internal
 *
 * Creates a ColdLight {kind} transport from melt v0.44 {Kind}.
 * Maps melt {Kind} getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt {kind}.trigger → slots.trigger
 *   melt {kind}.content → slots.content
 *
 * @example
 * ```typescript
 * const transport = create{Kind}Transport({ open: false });
 * // transport.slots.trigger → SlotAttrs
 * // transport.states.open → boolean
 * ```
 */
```

### Utility action

```typescript
/**
 * @file actions/{name}.ts
 * @package @devpulse/coldlight
 *
 * Svelte action: {name} — {one-line description}.
 *
 * @example
 * ```svelte
 * <div use:{name}={options}>...</div>
 * ```
 *
 * @param node - The DOM element the action is applied to
 * @param options - Configuration options
 * @returns Action lifecycle (update, destroy)
 */
```

### Utility function

```typescript
/**
 * @file utils/{name}.ts
 * @package @devpulse/coldlight
 *
 * {One-line description}.
 *
 * @example
 * ```typescript
 * const result = {name}(input);
 * ```
 *
 * @param {paramName} - What it is
 * @returns What comes back
 */
```

### Test file

```typescript
/**
 * @file primitives/{kind}/{Kind}.test.ts
 * @kind {kind}
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * {Kind} primitive browser tests.
 * Tests the STRUCTURAL contract — data attributes, HTML semantics, slot passthrough.
 *
 * Runner: Vitest 4 browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */
```

---

## Mermaid Diagrams in JSDoc

Use fenced code blocks — works in TypeDoc HTML, GitHub, and markdown output:

```typescript
/**
 * Token resolution pipeline.
 *
 * ```mermaid
 * flowchart TD
 *   G[Global Tokens] --> S[Semantic Tokens]
 *   S --> C[Component Tokens]
 *   C --> CSS[CSS Custom Properties]
 * ```
 */
```

### Architecture diagrams for key files:

```typescript
/**
 * ColdLight adapter layer.
 *
 * ```mermaid
 * flowchart LR
 *   subgraph "_internal (cloaked)"
 *     Factory[factory.ts] --> Melt[melt/builders]
 *     Transport[_transport/] --> Factory
 *   end
 *   Primitive[Primitive.svelte] --> Transport
 *   Primitive -.-> Contract[contract.ts]
 *   Component[Component.svelte] --> Primitive
 * ```
 */
```

```typescript
/**
 * Primitive → Component → Block flow.
 *
 * ```mermaid
 * flowchart TD
 *   Token[SD5 Tokens] --> Recipe[Recipe]
 *   Contract[Contract] --> Primitive[Primitive.svelte]
 *   Primitive --> Component[Component.svelte]
 *   Recipe --> Component
 *   Component --> Block[Block]
 * ```
 */
```

---

## Svelte 5 Component Props Documentation

Document props in the TypeScript interface — these show on hover in VSCode:

```typescript
interface Props {
  /**
   * Visual variant controlling color scheme and emphasis.
   *
   * | Variant | Use Case |
   * |---------|----------|
   * | `primary` | Main actions |
   * | `secondary` | Supporting actions |
   * | `ghost` | Minimal chrome |
   * | `danger` | Destructive actions |
   */
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';

  /**
   * Size preset — controls padding, font-size, min-height.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /** Content rendered inside the component */
  children: Snippet;
}
```

---

## What NOT To Document

- Do NOT add `@param {string}` when TypeScript already types it
- Do NOT add `@returns {boolean}` when TypeScript already types it
- Do NOT add `@type` — use TypeScript type annotations
- Do NOT add `@typedef` — use `type` or `interface`
- Do NOT add comments to self-evident code (`// increment counter` before `counter++`)
- Do NOT add JSDoc to every property — only document non-obvious ones

---

## Verification

Run `docs:api` to generate and verify:

```bash
pnpm docs:api        # Generate markdown docs → .cowlevel/docs/
pnpm docs:api:json   # Generate JSON API → .cowlevel/api.json
```

TypeDoc will warn on:
- Invalid `{@link}` references
- Unknown tags (if not registered in tsdoc.json + typedoc.json)

TypeDoc will NOT warn on:
- Missing documentation (notDocumented: false)
- Non-exported symbols (notExported: false)
