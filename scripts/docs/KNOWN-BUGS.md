# Known Bugs — DevPulse Platform

**Status**: Living document — update as bugs are found and fixed
**Purpose**: Capture all experienced bugs with root cause and fix/workaround. Share upstream where applicable.

---

## Style Dictionary v5

### SD5-001: sizePxToRem transform fails on clamp() values
- **Severity**: HIGH
- **Component**: `style-dictionary@5.3.1` built-in `size/pxToRem` transform
- **Symptom**: Token values containing `clamp()` are silently corrupted. The transform tries to `parseFloat()` a complex CSS function and either returns `NaN` or extracts only the first numeric segment, discarding the rest.
- **Example**: `clamp(1rem, 0.1786vw + 0.9643rem, 1.125rem)` → outputs `1rem` (only the first part)
- **Root cause**: The built-in transform assumes all `$type: "dimension"` values are simple numbers with optional `px` suffix. It has no awareness of CSS functions like `clamp()`, `calc()`, `min()`, `max()`.
- **ColdLight fix**: Custom transform `coldlight/dimension-to-css` replaces the built-in. Checks if value starts with `clamp(` or ends with `rem` and passes through. Only converts bare `px` values.
- **Upstream reportable**: YES — SD5 should handle CSS function values gracefully in dimension transforms.

### SD5-002: expand:true + inset shadows → `inset` keyword leaks into sub-properties
- **Severity**: MODERATE
- **Component**: `style-dictionary@5.3.1` expand behavior + custom inset transform
- **Symptom**: When `expand: true` is set and a shadow token has `$extensions.com.coldlight.inset: true`, the custom inset transform prepends `inset` to EVERY expanded sub-property (color, offset-x, offset-y, blur, spread) instead of only the shorthand.
- **Example**: `--bevel-subtle-1-color: inset oklch(...)` — the `inset` should only appear in the composed shorthand, not on individual sub-properties.
- **Root cause**: The custom `shadowCssShorthand` transform runs before expansion, or the inset logic applies at the wrong level. SD5's expand happens before custom transforms process.
- **ColdLight fix**: Bevel shorthands assembled manually in `aliases.css` from DTCG source values. The expanded sub-properties are not used directly.
- **Upstream reportable**: PARTIAL — this is an interaction between custom transforms and SD5's expand. May need better documentation on transform ordering with expand.

### SD5-003: Fluid compounding scale produces min > max at negative steps
- **Severity**: LOW
- **Component**: `generate-scales.mjs` (ColdLight, not SD5)
- **Symptom**: `--text-size-3xs: clamp(0.4823rem, -0.1799vw + 0.5182rem, 0.3563rem)` — the min (0.4823rem) is LARGER than the max (0.3563rem). This produces invalid CSS that the browser ignores.
- **Root cause**: At negative compounding steps, `baseMin * ratioMin^(-4)` can exceed `baseMax * ratioMax^(-4)` when `ratioMax > ratioMin`. The steeper ratio at desktop makes large sizes larger AND small sizes smaller — at extreme negative steps, the desktop "small" undershoots the mobile "small".
- **Fix needed**: Swap min/max when the compounding produces an inversion. Add: `if (minPx > maxPx) [minPx, maxPx] = [maxPx, minPx];` before calling `computeFluid()`.
- **Upstream reportable**: NO — this is our formula, not SD5.

### SD5-004: Token collisions when same key exists in multiple source files
- **Severity**: MODERATE
- **Component**: `style-dictionary@5.3.1` source merging
- **Symptom**: `Token collisions detected` warnings when `textSize` exists in both `generated-scales.tokens.json` and `typography.json`. SD5 logs warnings but silently uses one value (undefined which wins).
- **ColdLight fix**: Removed duplicate `textSize` from `typography.json`. Single source of truth in `generated-scales.tokens.json`.
- **Upstream reportable**: NO — this is a source authoring issue, not an SD5 bug. SD5's collision warning is correct behavior.

---

## SurrealDB

### SURREAL-001: Embedded HTTP API uses custom auth, not SurrealDB native
- **Severity**: HIGH
- **Component**: `devpulse-engine` axum HTTP server on port 8822
- **Symptom**: `surreal sql --endpoint http://127.0.0.1:8822` fails with 404 on `/rpc`. The HTTP API exposes `/sql`, `/health`, `/version` but NOT the standard SurrealDB WebSocket RPC endpoint.
- **Root cause**: The engine's HTTP server is a custom axum implementation that wraps the embedded SurrealKV instance. It serves a subset of SurrealDB's HTTP API but not the full protocol.
- **Auth**: Uses `devpulse_engine:dp_sys_2026!` via Basic Auth, NOT `root:root`.
- **Fix needed**: Either expose `/rpc` for CLI compatibility, or accept that the MCP bridge replaces CLI access.
- **Upstream reportable**: NO — this is our custom server, not a SurrealDB bug.

### SURREAL-002: shared_learnings table schema rejects datetime default
- **Severity**: LOW
- **Component**: Embedded SurrealDB schema
- **Symptom**: `CREATE shared_learnings SET ... created_at = time::now()` fails with `Expected any, got datetime`.
- **Root cause**: Schema field `created_at` has `DEFAULT time::now()` but the field type constraint doesn't accept the output type of `time::now()` when explicitly provided in the INSERT.
- **Fix needed**: Audit schema field types. Remove explicit `created_at` from INSERT and let the default handle it.
- **Upstream reportable**: MAYBE — this could be a SurrealDB type coercion issue with DEFAULT + explicit SET.

---

## Svelte 5

### SVELTE-001: SVG stroke-linecap attribute rejects CSS var() values
- **Severity**: LOW
- **Component**: Svelte 5 template type checking
- **Symptom**: `stroke-linecap="var(--cl-svg-stroke-linecap)"` produces TypeScript error: `Type '"var(--cl-svg-stroke-linecap)"' is not assignable to type '"round" | "butt" | "square"'`.
- **Root cause**: Svelte 5's SVG attribute types are strict enums from the SVG spec. CSS custom properties are strings, not enum members.
- **ColdLight fix**: Hardcode `stroke-linecap="round"` on SVG elements. Use glue CSS `[data-svg-slot]` selectors to override if needed.
- **Upstream reportable**: MAYBE — Svelte could allow `string` for SVG presentation attributes that accept CSS values.

---

## Tailwind CSS v4

### TW4-001: @theme registers ALL CSS custom properties — no tier filtering
- **Severity**: MODERATE (for design systems)
- **Component**: `@tailwindcss/vite` v4
- **Symptom**: Every CSS custom property in `@theme` becomes a Tailwind utility class. No way to register a var for intellisense without also generating a utility.
- **Root cause**: Tailwind v4's `@theme` is both a registration mechanism and a utility generator. There's no "register but don't generate utility" mode.
- **ColdLight fix**: Filter which tokens go into `@theme` output at the SD5 level. Only brand + semantic tokens get `@theme`. Full spectrum stays in `:root` only.
- **Upstream reportable**: FEATURE REQUEST — `@theme` should support a `register-only` mode for tokens that need intellisense but shouldn't generate utilities.

---

## Template: Adding New Bugs

```markdown
### {ID}: {Brief title}
- **Severity**: HIGH | MODERATE | LOW
- **Component**: {package@version or module}
- **Symptom**: {What the developer sees}
- **Root cause**: {Why it happens}
- **ColdLight fix**: {What we did to work around it}
- **Upstream reportable**: YES | NO | MAYBE — {reason}
```
