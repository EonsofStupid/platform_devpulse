# Tokens

> Layer 0: Design Token SSOT

---

## Definition

Tokens are **atomic, immutable values** that define the visual language.

```
tokens.ts (SSOT) → Vite Plugin → tokens.css, types.ts, tailwind.preset.ts
```

---

## Files

| File | Type | Description |
|------|------|-------------|
| `tokens.ts` | SSOT | Hand-edited source of truth |
| `tokens.css` | GENERATED | CSS custom properties |
| `types.ts` | GENERATED | TypeScript types |
| `tailwind.preset.ts` | GENERATED | Tailwind theme |
| `schema.ts` | Manual | Zod validators |

---

## Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Hues | `--dp-hue-*` | `--dp-hue-teal` |
| Color Scales | `--dp-{color}-{step}` | `--dp-teal-500` |
| Glass | `--dp-glass-*` | `--dp-glass-deep` |
| Matte | `--dp-matte-*` | `--dp-matte-dark` |
| Text | `--dp-text-*` | `--dp-text-primary` |
| Spacing | `--dp-space-*` | `--dp-space-4` |
| Radius | `--dp-radius-*` | `--dp-radius-md` |
| Blur | `--dp-blur-*` | `--dp-blur-md` |
| Glow | `--dp-glow-*` | `--dp-glow-teal` |
| Shadow | `--dp-shadow-*` | `--dp-shadow-z2` |
| Bevel | `--dp-bevel-*` | `--dp-bevel-outset` |
| Z-Index | `--dp-z-*` | `--dp-z-modal` |
| Duration | `--dp-duration-*` | `--dp-duration-fast` |
| Easing | `--dp-ease-*` | `--dp-ease-out` |

---

## Checklist

### Before Adding Tokens

- [ ] Category exists or needs creation
- [ ] Naming follows `--dp-{category}-{name}` pattern
- [ ] Values use OKLCH for colors
- [ ] Added to `tokens.ts` SSOT

### After Adding Tokens

- [ ] Run `pnpm ds:tokens:build`
- [ ] Verify `tokens.css` updated
- [ ] Verify `types.ts` updated
- [ ] Verify `tailwind.preset.ts` updated
- [ ] `pnpm check` passes

### Rules

- [ ] NEVER edit `tokens.css` directly
- [ ] NEVER edit `types.ts` directly
- [ ] NEVER edit `tailwind.preset.ts` directly
- [ ] Only edit `tokens.ts`

---

## Auto-Documentation

When tokens change:
1. Vite plugin generates CSS/types
2. Audit validates token coverage
3. Updates docs/tokens.md
4. Docusaurus generates token reference

---

**This is Layer 0 of ColdLight.**
