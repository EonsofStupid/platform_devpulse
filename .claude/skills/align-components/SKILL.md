# Align Components

Mass-fix existing ColdLight components to match the established enterprise pattern.
Zero exceptions. No backwards compat. No shortcuts. Fix root causes.

## When to use
- User says "align components" or "fix all components"
- After author-component skill is updated and existing components don't match
- Any time components are found with hardcoded styleId or missing intent prop

## What this skill does

Scans ALL components in `design/components/` and fixes each one to match
the gold standard pattern established in `author-component/SKILL.md`.

## The Pattern (non-negotiable)

Every component MUST have:

1. **`intent` prop** — selects the DTCG style preset
2. **`$derived` styleId** — `const styleId = $derived(\`{kind}-${intent}\`)`
3. **`@defaults` header** — seed values matching style-presets.json
4. **`@styleIds` annotation** — listing all available presets
5. **StyleMacro wrapper** — `<StyleMacro kind="{kind}" style={styleId}>`
6. **`data-kind` + `data-slot`** on root element
7. **UIBaseProps** in types (not ComponentProps — that's deprecated)
8. **`.js` extensions** on all imports
9. **5 DTCG presets** in style-presets.json (default, stark, glass, flat, matte)

## Execution Protocol

### Phase 1: Scan

```bash
# Find all components with hardcoded styleId
grep -r 'const styleId = "' components/ --include="*.svelte" -l

# Find all components missing intent prop
grep -rL 'intent' components/ --include="*.svelte" | head -20

# Count total components
ls -d components/*/  | wc -l
```

### Phase 2: Fix — per component

For EACH component that doesn't match:

1. **Read the .svelte file** fully
2. **Read the types file** fully
3. **Fix the .svelte file:**
   - Replace `const styleId = "{kind}-default"` with `const styleId = $derived(\`{kind}-${intent}\`)`
   - Add `intent = "default"` to `$props()` destructuring
   - Verify @defaults header exists and values are correct
   - Verify @styleIds lists all presets
4. **Fix the types file:**
   - Add `{Kind}Intent` type union
   - Add `intent?: {Kind}Intent` to props interface
   - Ensure it extends `UIBaseProps` not `ComponentProps`
5. **Fix the index.ts barrel:**
   - Export the Intent type
6. **Run `pnpm svelte-check`** after EACH component — not after batching

### Phase 3: Verify DTCG

For each fixed component, verify that style-presets.json has the 5 standard presets.
If presets are missing, add them.

### Phase 4: Rebuild

```bash
pnpm ds:tokens:build
pnpm svelte-check  # must be 0 errors
```

## Batch size

Process components in batches of 5. After each batch:
- `pnpm svelte-check`
- Report which components were fixed
- Report any that need special handling

## Special cases

### Components with semantic variants (not visual intents)

Some components have variants that are functionally different, not just visually:
- `ChatBubble` — `variant="ai"|"user"|"system"` (different content roles)
- `Alert` — `variant="informative"|"positive"|"negative"` (different semantic meanings)
- `Badge` — `variant="neutral"|"positive"|"negative"` (different semantic meanings)

These keep `variant` AND also get `intent` for visual preset selection:
```typescript
export interface AlertProps extends UIBaseProps {
	variant?: AlertVariant;  // semantic role
	intent?: AlertIntent;    // visual preset (default, stark, glass, flat, matte)
}

const styleId = $derived(`alert-${variant}-${intent}`);
// or if variant maps directly to preset:
const styleId = $derived(`alert-${variant}`);
```

### Components without primitive hooks

Many components don't have a primitive hook yet. That's OK — fix the visual pattern now:
- Add `intent` prop
- Fix `$derived` styleId
- Fix types
- Hook authoring is a separate sprint

## Order of operations

Fix these first (most visible, most used):
1. Heading
2. Text
3. Button (already correct — use as reference)
4. Card
5. Badge
6. Progress
7. TextField
8. All remaining (~55 components)

## BANNED during alignment

- Skipping a component because "it works fine"
- Adding backwards compat aliases
- Leaving hardcoded styleId "for now"
- Batching 10+ components before checking compilation
- Creating new files when existing files just need editing
