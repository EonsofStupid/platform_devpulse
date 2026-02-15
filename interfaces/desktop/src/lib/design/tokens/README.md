# Tokens

> Layer 0: Design Token SSOT

---

## Pipeline

```
tokens.ts (SSOT) --> ds-tokens-build.ts --> tokens.css, types.ts, tailwind.preset.ts
```

**Command**: `pnpm ds:tokens:build`

---

## Files

| File | Type | Description |
|------|------|-------------|
| `tokens.ts` | SSOT | Hand-edited source of truth |
| `tokens.css` | GENERATED | CSS custom properties (unprefixed) |
| `types.ts` | GENERATED | TypeScript union types + runtime arrays |
| `tailwind.preset.ts` | GENERATED | Tailwind theme extension via CSS var refs |

**NEVER edit generated files.** Only edit `tokens.ts`, then run `pnpm ds:tokens:build`.

---

## Token Categories

| Category | CSS Prefix | Example | tokens.ts export |
|----------|------------|---------|------------------|
| Hues | `--hue-*` | `--hue-teal` | `hue` |
| Color Scales | `--color-{name}-{step}` | `--color-teal-500` | `color` |
| Glass | `--glass-*` | `--glass-deep` | `glass` |
| Matte | `--matte-*` | `--matte-dark` | `matte` |
| Text | `--text-*` | `--text-primary` | `text` |
| Spacing | `--space-*` | `--space-4` | `space` |
| Radius | `--radius-*` | `--radius-md` | `radius` |
| Blur | `--blur-*` | `--blur-md` | `blur` |
| Glow | `--glow-*` | `--glow-teal` | `glow` |
| Shadow | `--shadow-*` | `--shadow-z2` | `shadow` |
| Bevel | `--bevel-*` | `--bevel-subtle` | `bevel` |
| Z-Index | `--z-*` | `--z-modal` | `z` |
| Duration | `--duration-*` | `--duration-fast` | `duration` |
| Easing | `--ease-*` | `--ease-out` | `ease` |
| Text Size | `--text-size-*` | `--text-size-base` | `textSize` |
| Padding | `--padding-*` | `--padding-md` | `padding` |

---

## Checklist

### Before Adding Tokens

- [ ] Category exists or needs creation in `tokens.ts`
- [ ] Naming follows `--{category}-{name}` pattern
- [ ] Values use OKLCH for colors
- [ ] Added to the correct export in `tokens.ts`
- [ ] If new category, added to `enums` and to `generateCss()` in `ds-tokens-build.ts`

### After Adding Tokens

- [ ] Run `pnpm ds:tokens:build`
- [ ] Verify `tokens.css` updated
- [ ] Verify `types.ts` updated
- [ ] Verify `tailwind.preset.ts` updated
- [ ] `pnpm check` passes

---

**This is Layer 0 of ColdLight.**
