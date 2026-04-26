# RENDERFORGE.md — the runtime styling resolver

> **Authority:** this file. Replaces all references to the non-existent
> "RenderForge.md Law N" comments scattered through the renderforge/* sources.
> See TRUTH.md for the architecture-wide ground truth.

`renderForge` is the runtime styling resolver. One pure function, called
by every styled ColdLight component, that maps a `(kind, preset, state)`
triple to a `(dataAttrs, cssVars)` pair the component spreads onto its
DOM root.

This document describes what the function actually does today, the
properties it must preserve, the known bugs, and the contract it owes
its callers.

---

## 1. Public API

```ts
import { renderForge, cssVarString } from '$lib/design/renderforge';

const m = $derived(renderForge({ kind: 'button', preset: 'primary', state: 'default' }));
// m: { kind: 'button', dataAttrs: {...}, cssVars: {...} }
```

**Inputs** — `StyleMacroInput`:

```ts
interface StyleMacroInput {
  kind: KindName | `${KindName}/${string}` | (string & {});
  preset?: PresetId | SemanticIntent | (string & {});  // default 'primary'
  state?: RenderState;                                   // default 'default'
}
```

**Output** — `ResolvedMacro`:

```ts
interface ResolvedMacro {
  kind: string;                              // echoed back
  dataAttrs: StyleDataAttrs;                 // Tier 1 attrs (data-kind, data-cl-*)
  cssVars: Record<string, string>;           // 20 longhand CSS custom properties
}
```

**Helper** — `cssVarString`:

```ts
const styleString = cssVarString(m.cssVars);
// → '--background-color:var(...);--color:var(...);...'
```

`cssVarString` is the *only* sanctioned bridge from `m.cssVars` to the
DOM. Components do not iterate the cssVars object themselves.

---

## 2. The five locked properties of `renderForge`

These are the constraints that keep the resolver portable, predictable,
and testable. Removing any of them is a TRUTH.md-level change, not a
local refactor.

### P1 — Pure function

Same input → same output, always. No DOM access. No Svelte runes. No React
hooks. No global state. No `Date.now()`. No randomness. No closures over
mutable state outside the function.

**Why:** the resolver is the SSOT for both Svelte and React deployments.
A pure function compiles unchanged into both runtimes. Any impurity
fractures that.

**Test:** the resolver's tests must pass in plain Node Vitest, with no
browser mode and no jsdom. If they require a browser, the function isn't
pure.

### P2 — Two-tier var() chain (default state)

```
var(--style-{kind}-{preset}-{axis},     ← per-kind override
    var(--preset-{preset}-{axis},        ← shared preset default
        {fallback}))                      ← absolute fallback
```

**Why:** StyleOS users can fork a single (kind, preset, axis) tuple
without forking the whole preset. This is the customization story
sold to enterprise buyers.

### P3 — Five-tier var() chain (non-default state) — INTENDED

```
var(--style-{kind}-{preset}-{state}-{axis},  ← per-kind state override
    var(--preset-{preset}-{state}-{axis},     ← shared preset state
        var(--style-{kind}-{preset}-{axis},   ← per-kind default
            var(--preset-{preset}-{axis},      ← shared preset default
                {fallback}))))
```

**Status:** The current `render.ts` implements only a 3-tier chain in the
state branch (skips the per-kind state tier). See bug B1 below.

### P4 — Canonical longhand CSS variable names

The `cssVars` map keys are full CSS custom property names matching real
CSS longhand properties (`--background-color`, not `--bg`; `--font-family`,
not `--font`). They map 1:1 to the consumer rules in `render-base.css`.

**Anti-pattern:** any shortened key like `-bg` is dead. Any test asserting
`m.cssVars["-bg"]` is broken. (Bugs B4, B5, B6 below.)

### P5 — Tier 1 attribute discipline

`m.dataAttrs` carries only Tier 1 attributes (per TRUTH.md §3):
`data-kind` and `data-cl-{family}`. The component itself authors `data-slot`,
`data-state`, and any Tier 3 attributes; the resolver does not.

---

## 3. Resolution chain — worked example

Input:

```ts
renderForge({ kind: 'button', preset: 'primary', state: 'disabled' })
```

Step 1 — Resolve intent. `'primary'` is a `SemanticIntent` (per
`visual/preset-id.ts`), so we look it up in `INTENT_MAP`:

```
'primary' → 'glass-deep'
```

Step 2 — Build the prefixes:

```
perKind = '--style-button-glass-deep'
shared  = '--preset-glass-deep'
```

Step 3 — For each axis, build the var() chain. For `--background-color`
in the `disabled` state (with all 5 tiers, per P3):

```
var(--style-button-glass-deep-disabled-background-color,
    var(--preset-glass-deep-disabled-background-color,
        var(--style-button-glass-deep-background-color,
            var(--preset-glass-deep-background-color,
                transparent))))
```

Step 4 — Look up the kind's families in `KIND_FAMILIES` and emit the
matching `data-cl-{family}` markers:

```
KIND_FAMILIES['button'] = ['frame', 'interactive', 'surface', 'text']
→ dataAttrs = {
    'data-kind': 'button',
    'data-cl-frame': '',
    'data-cl-interactive': '',
    'data-cl-surface': '',
    'data-cl-text': '',
  }
```

Step 5 — Return the sealed object. Component spreads `m.dataAttrs` and
serializes `m.cssVars` via `cssVarString`. Browser resolves the var()
chains against the CSS custom properties emitted by SD5 and applies the
matching family rules from `render-base.css`.

---

## 4. The 20 runtime CSS custom properties

The resolver pre-computes 20 longhand vars even though `render-base.css`
consumes 16 today. The extras are forward-compatibility for axes that
have authored values but no glue-CSS rule yet.

| Var | Family | Glue rule? | Source axis |
|---|---|---|---|
| `--background-color` | surface | yes | backgroundColor |
| `--background-alpha` | surface | no (forward) | backgroundColor |
| `--box-shadow` | surface | yes | shadow |
| `--border-color` | surface | yes | border |
| `--gradient` | surface | yes (as `background-image`) | gradient |
| `--background-image` | surface | no (forward) | gradient/backgroundImage |
| `--border-width` | frame | yes | border |
| `--border-style` | frame | yes | border |
| `--border-radius` | frame | yes | borderRadius |
| `--color` | text | yes | color |
| `--font-family` | text | yes | typography |
| `--font-size` | text | yes | typography |
| `--font-weight` | text | yes | typography |
| `--tracking` | text | yes (as `letter-spacing`) | typography |
| `--leading` | text | yes (as `line-height`) | typography |
| `--backdrop-filter` | overlay | yes | backgroundBlur |
| `--opacity` | universal | yes (on `[data-kind]`) | opacity |
| `--animation` | universal | yes (on `[data-kind]`) | animation |
| `--transition-duration` | universal | yes (on `[data-kind]`) | transition |
| `--transition-timing` | universal | yes (on `[data-kind]`) | transition |

---

## 5. Known bugs (Phase 2 fix targets)

| ID | Severity | File | Description | Fix |
|---|---|---|---|---|
| B1 | **HIGH** | `render.ts` ~L114–L130 | State branch implements 3-tier chain, not 5-tier. `--style-button-glass-deep-disabled-background-color` is never consulted. | Replace inline state-handling block with full 5-tier `sv()` builder mirroring P3. |
| B2 | **HIGH** | `types.ts` L17 | `RenderState = 'default' \| 'disabled' \| 'active'` — missing `'hover'` and `'focus'`. | Expand to `'default' \| 'hover' \| 'focus' \| 'active' \| 'disabled'`. Audit downstream callsites. |
| B3 | MEDIUM | `render.ts` L106 | `'--border-style': "solid"` hardcoded; bypasses var chain. | Replace with `v('border-style', 'solid')`. |
| B4 | **HIGH** | `resolve.test.ts` | Multiple assertions of `m.cssVars["-bg"]`. Resolver emits `--background-color`. All `-bg` assertions fail. | Delete and rewrite as `render.test.ts` from scratch (per Phase 2 plan). |
| B5 | **HIGH** | `components/chat-frame/ChatFrame.test.ts` L107–L112 | `expect(style).toContain("-bg")`. Same root cause as B4. | Replace with `expect(style).toContain('--background-color')`. |
| B6 | **HIGH** | `components/chat-footer/ChatFooter.test.ts` L57–L63 | Same as B5. | Same fix. |
| B7 | MEDIUM | `generated/kind-families.ts` | `glass`, `glass-deep`, `chat-frame`, etc. don't include `overlay` in their family list. The resolver emits `--backdrop-filter` for these kinds, but the `[data-cl-overlay]` rule never fires because the marker isn't on the element. | Architectural call: see PARKING-LOT.md PL-003. Either fix `kind-families.ts` or rewrite the CSS rule. |
| B8 | LOW | Multiple | Code comments reference "Per RenderForge.md Law 1/5/6" and "Per MACRO-LAW.md Law 5" — neither doc exists. | Replace with citations to TRUTH.md / RENDERFORGE.md / MACRO-LAW.md as appropriate. |

---

## 6. The pass-through quirk in `intent-map.ts`

`resolvePresetId` (in `visual/intent-map.ts:38`) has this check:

```ts
if (preset.includes("-") && !["primary", "secondary"].includes(preset)) {
  return preset as PresetId;
}
```

It exempts `'primary'` and `'secondary'` from the "contains a hyphen →
treat as PresetId" pass-through, since neither contains a hyphen anyway.
This is structurally fragile — the special-case list is incomplete and
appears to be guarding against a class of inputs that doesn't exist.

**Better shape (suggested for Phase 2 follow-up):**

```ts
if (SEMANTIC_INTENTS.includes(preset as SemanticIntent)) {
  return INTENT_MAP[preset as SemanticIntent];
}
return preset as PresetId; // or fallback
```

This makes the intent-vs-preset decision based on the closed set of
semantic names, not on hyphen-counting. Logged for Phase 2 cleanup;
not blocking.

---

## 7. Performance notes

- The resolver is called once per component instance per render via `$derived`.
- It allocates a new `Record<string, string>` of 20 entries each call.
- `cssVarString` does a single-pass concat. No intermediate arrays.
- For 65 primitive kinds × ~10 instances per typical screen × ~20 vars,
  the work per render is ~13,000 string concats. Negligible.

The tradeoff: pre-computing all 20 vars when only ~6 might be needed for a
text-only kind is intentional. CSS treats unset custom properties as no-ops,
so emitting all 20 always doesn't hurt rendering. It does hurt the DOM size
(each component carries an inline style with 20 declarations). If that
becomes a problem, the optimization is to filter by kind family at the
resolver — but that breaks P3 (forward compatibility).

---

## 8. Testing contract

Every renderForge test must:

1. **Run in plain Node Vitest.** No browser mode. No jsdom. (Enforces P1.)
2. **Assert canonical longhand keys only.** No `'-bg'`, no `'-fg'`. (Enforces P4.)
3. **Cover both default and non-default state branches.** (Validates P3.)
4. **Verify both var() chain tiers appear in the right order** for default
   state (per-kind before shared) and all four reachable tiers for
   non-default state (per-kind state before shared state before per-kind
   default before shared default).
5. **Verify `m.dataAttrs` contains only Tier 1 attributes.** No Tier 2
   or Tier 3 attribute names should leak into the resolver output.
6. **Include a purity check.** Mutate the resolver's output, then call again;
   second call's output must be unaffected.

---

## 9. Cross-references

- TRUTH.md — architecture-wide ground truth, file paths, taxonomy
- MACRO-LAW.md — the family-split CSS contract that consumes these vars
- PARKING-LOT.md — deferred decisions, including B7's resolution path
- `visual/axes.ts` — the 11 (or 12) DTCG axes
- `visual/intent-map.ts` — the 14 semantic intent → preset mapping
- `generated/render-base.css` — the consumer side of the var contract
