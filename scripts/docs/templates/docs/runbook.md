# Operations Runbook

> **Status**: Draft
> **Last Updated**: [DATE]

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm check            # TypeScript check

# Documentation
pnpm docs:scan        # Scan codebase
pnpm docs:validate    # Validate against policy
pnpm docs:preflight:check   # Run enforcement checks
pnpm docs:preflight:fix     # Apply fixes (interactive)
pnpm docs:check       # Full pipeline
```

### Health Checks

- [ ] Dev server starts without errors
- [ ] Build completes successfully
- [ ] TypeScript check passes
- [ ] Preflight checks pass

## Troubleshooting

### Issue: Preflight Check Fails

**Symptoms**: `pnpm docs:preflight:check` returns errors

**Resolution**:
1. Read the error messages carefully
2. Run `pnpm docs:preflight:fix` for auto-fixable issues
3. For manual fixes, follow the suggestions in the output

### Issue: Domain Boundary Violation

**Symptoms**: "Invalid domain import" error

**Resolution**:
1. Routes must import from `$lib/domains/{namespace}/{domain}/index.ts`
2. Or from `$lib/domains/{namespace}/{domain}/pages/**`
3. Never import directly from features/, state/, or services/

### Issue: Raw String Route Detected

**Symptoms**: "Raw string route detected" error

**Resolution**:
1. Import the route helper: `import { route } from '$lib/sys/generated/ROUTES'`
2. Replace `href="/path"` with `href={route('/path')}`
3. Replace `goto('/path')` with `goto(route('/path'))`

## Deployment

### Pre-deployment Checklist

- [ ] All tests pass
- [ ] Preflight checks pass
- [ ] Documentation is up to date
- [ ] Version bumped appropriately

### Rollback Procedure

1. Identify the issue
2. Revert to previous known-good version
3. Investigate root cause
4. Fix and re-deploy

## Monitoring

### Key Metrics

- Build time
- Bundle size
- Documentation coverage

### Alerts

[Alert configuration and escalation paths]
