# sys/generated/

Machine-generated outputs. **Never hand-edit.**

## Files

| File | Generator | Purpose |
|------|-----------|---------|
| `ROUTES.ts` | `scripts/docs/generators/routes/` | Typed route helpers |
| `routes.inventory.json` | `scripts/docs/generators/routes/` | Hub-aware nav structure |

## Regeneration

```bash
pnpm routes:generate
```

## Rules

1. Do not edit files in this directory manually
2. Files are regenerated on:
   - Dev server start (via Vite plugin)
   - Pre-commit (via lefthook)
   - CI pipeline
3. Changes to route structure require regeneration
