# DevPulse Documentation Enforcement System

> Enterprise documentation and architecture enforcement for DevPulse platform.
>
> **⚠ Kernel references in this tree are historical.** The sprint docs, specs,
> and ADRs under `scripts/docs/` span eras; the AI layer (connectome, model
> loading/inference, RRD) left this repo on 2026-07-08 and lives at
> `github.com/EonsofStupid/clyffyos`. Any `kernel/…` path or `devpulse-clyffy`
> crate reference predates that cut — read it as project memory, not a working
> path. Active sprints in here remain active; this marker does not declare the
> folder dead. Current truth: `docs/platform/CLYFFYOS_DEVPULSE_SEPARATION.md`
> + `ARCHITECTURE.md`.

## Quick Start

```bash
# Install dependencies
cd scripts/docs
pnpm install

# Run checks
pnpm preflight:check

# See what would be fixed
pnpm preflight:dry-run

# Interactively apply fixes
pnpm preflight:fix
```

## Commands

### Preflight (Enforcement)

| Command | Description |
|---------|-------------|
| `pnpm preflight:check` | Run all enforcement checks |
| `pnpm preflight:fix` | Interactively apply fixes |
| `pnpm preflight:dry-run` | Preview fixes without applying |

### Pipeline (Documentation Generation)

| Command | Description |
|---------|-------------|
| `pnpm scan` | Scan codebase structure |
| `pnpm validate` | Validate against policy |
| `pnpm extract` | Extract API documentation |
| `pnpm stage` | Stage docs for publishing |
| `pnpm lock` | Create documentation lockfile |
| `pnpm verify` | Verify against lockfile |
| `pnpm check` | Full pipeline (scan + validate + preflight) |

## Architecture

```
scripts/docs/
├── policy/                 # Enforcement rules
│   ├── cowlevel.policy.json    # Main policy file
│   ├── enforcement.tiers.json  # Tier definitions
│   └── doc-coverage.gates.json # Coverage thresholds
│
├── preflight/              # Enforcement engine
│   ├── engine/             # Core runner
│   ├── checks/             # Individual checks
│   └── fixers/             # Auto-fix modules
│
├── pipeline/               # Documentation generation
│   ├── scan.ts             # Codebase scanner
│   ├── validate.ts         # Policy validation
│   ├── extract/            # Documentation extractors
│   ├── stage.ts            # Staging for publish
│   ├── lock.ts             # Lockfile generation
│   └── verify.ts           # Lockfile verification
│
└── templates/              # Seed templates
    ├── docs/               # Documentation templates
    ├── adr/                # ADR templates
    └── diagrams/           # Mermaid diagram templates
```

## Enforcement Rules

### Tier 1: Critical (Blocks Commit)

1. **thin-routes** - Routes must be adapters only
2. **domain-boundaries** - Routes import only from domain index.ts
3. **typed-routes** - No raw string routes
4. **state-vs-streams** - State in domains, streams in sys/

### Tier 2: Standard (Warning)

5. **naming-conventions** - Follow naming patterns

### Naming Patterns

| Type | Pattern |
|------|---------|
| Domain pages | `*.page.svelte` |
| State modules | `*.state.svelte.ts` |
| Services | `*.svc.ts` |
| Contracts | `*.contract.ts` |
| Registries | `*.registry.ts` |

## Fixer Behavior

Fixers operate in three modes:

1. **Interactive (default)** - Prompts before each fix
2. **Dry-run** - Shows what would change, saves state
3. **Apply** - Applies fixes (requires prior dry-run)

```bash
# Interactive (default)
pnpm preflight:fix

# Dry-run first
pnpm preflight:dry-run

# Then apply (after reviewing dry-run output)
pnpm preflight:fix --no-interactive
```

## Integration

### Lefthook (Pre-commit)

Add to your `lefthook.yml`:

```yaml
pre-commit:
  commands:
    docs-preflight:
      glob: "interfaces/desktop/src/**/*.{ts,svelte}"
      run: pnpm --filter @devpulse/docs-enforcement preflight:check
```

### CI Pipeline

```yaml
- name: Documentation Checks
  run: |
    cd scripts/docs
    pnpm install
    pnpm check
```

## Policy Configuration

### cowlevel.policy.json

The main policy file defines:

- **rules**: Enforcement rules with scope and tier
- **kindMatrix**: Documentation requirements by file type

### enforcement.tiers.json

Defines how each tier behaves:

- **Tier 1**: Blocks commit, fails CI
- **Tier 2**: Warns but allows commit
- **Tier 3**: Info only

### doc-coverage.gates.json

Sets coverage thresholds:

- **minimum**: Required for CI pass
- **target**: Goal for healthy codebase

## Troubleshooting

### "Check not found in registry"

The check ID in policy doesn't match a registered check. Verify check IDs match.

### "No files matched scope"

The glob patterns in policy scope don't match any files. Check paths are correct.

### "Dry-run required"

Auto-apply mode requires a prior dry-run. Run `pnpm preflight:dry-run` first.

## Contributing

1. Add new checks in `preflight/checks/`
2. Register in check file: `registry.registerCheck(yourCheck)`
3. Add to policy in `cowlevel.policy.json`
4. Test with `pnpm preflight:check`
