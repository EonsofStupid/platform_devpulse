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
| `tokens.css` | GENERATED | CSS custom properties (`--dp-*`) |
| `types.ts` | GENERATED | TypeScript union types + runtime arrays |
| `tailwind.preset.ts` | GENERATED | Tailwind theme extension via CSS var refs |

**NEVER edit generated files.** Only edit `tokens.ts`, then run `pnpm ds:tokens:build`.

---

## Token Categories

| Category | CSS Prefix | Example | tokens.ts export |
|----------|------------|---------|------------------|
| Hues | `--dp-hue-*` | `--dp-hue-teal` | `hue` |
| Color Scales | `--dp-color-{name}-{step}` | `--dp-color-teal-500` | `color` |
| Glass | `--dp-glass-*` | `--dp-glass-deep` | `glass` |
| Matte | `--dp-matte-*` | `--dp-matte-dark` | `matte` |
| Text | `--dp-text-*` | `--dp-text-primary` | `text` |
| Spacing | `--dp-space-*` | `--dp-space-4` | `space` |
| Radius | `--dp-radius-*` | `--dp-radius-md` | `radius` |
| Blur | `--dp-blur-*` | `--dp-blur-md` | `blur` |
| Glow | `--dp-glow-*` | `--dp-glow-teal` | `glow` |
| Shadow | `--dp-shadow-*` | `--dp-shadow-z2` | `shadow` |
| Bevel | `--dp-bevel-*` | `--dp-bevel-subtle` | `bevel` |
| Z-Index | `--dp-z-*` | `--dp-z-modal` | `z` |
| Duration | `--dp-duration-*` | `--dp-duration-fast` | `duration` |
| Easing | `--dp-ease-*` | `--dp-ease-out` | `ease` |
| Text Size | `--dp-text-size-*` | `--dp-text-size-base` | `textSize` |
| Padding | `--dp-padding-*` | `--dp-padding-md` | `padding` |

---

## Checklist

### Before Adding Tokens

- [ ] Category exists or needs creation in `tokens.ts`
- [ ] Naming follows `--dp-{category}-{name}` pattern
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
