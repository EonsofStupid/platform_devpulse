# Git Discipline

> **Conventional commits + tags + labels = automation fuel, not busywork.**

---

## Conventional Commits (Non-Negotiable)

All commits MUST follow conventional commit format.

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `style` | Formatting, no code change |
| `perf` | Performance improvement |

### Scopes (Boundary-Aligned)

| Scope | Folder | Example |
|-------|--------|---------|
| `taxonomy` | `taxonomy/` | `feat(taxonomy): add hoverCard kind` |
| `tokens` | `tokens/` | `feat(tokens): add ember glow color` |
| `primitives` | `primitives/` | `feat(primitives): implement dialog` |
| `recipes` | `recipes/` | `feat(recipes): add liquid metal surface` |
| `semantics` | `semantics/` | `feat(semantics): add GlassButton` |
| `blueprints` | `blueprints/` | `feat(blueprints): add FormBlueprint` |
| `blocks` | `blocks/` | `feat(blocks): add HeroGlass` |
| `_internal` | `sys/api/_internal/` | `refactor(_internal): update melt types` |
| `docs` | `docs/` | `docs(docs): update terminology` |
| `generator` | `vite-plugin.ts` | `feat(generator): add diagram output` |

### Examples

```bash
# Good
feat(primitives): implement tooltip with Melt UI
fix(recipes): correct glass blur token reference
docs(taxonomy): add hoverCard to registry
refactor(_internal): simplify state extraction

# Bad - missing scope
feat: add tooltip
# Bad - wrong type
update(primitives): implement tooltip
# Bad - not descriptive
feat(primitives): changes
```

---

## Git Tags

Tags mark system milestones, not arbitrary releases.

### Tag Format

```
v{major}.{minor}.{patch}
```

### Milestone Tags

| Tag | Milestone |
|-----|-----------|
| `v0.1.0` | Taxonomy backbone locked |
| `v0.2.0` | Primitive catalog stable |
| `v0.3.0` | Semantic layer complete |
| `v0.4.0` | Blueprint layer complete |
| `v0.5.0` | Docs generator v1 |
| `v1.0.0` | Production ready |

### Creating Tags

```bash
# Annotated tags (required for milestones)
git tag -a v0.1.0 -m "Taxonomy backbone locked"
git push origin v0.1.0
```

---

## GitHub Labels

Labels align with scopes and enable automation.

### Boundary Labels

| Label | Color | Description |
|-------|-------|-------------|
| `taxonomy` | `#0E8A16` | Taxonomy changes |
| `tokens` | `#1D76DB` | Token system |
| `primitives` | `#5319E7` | Primitive components |
| `recipes` | `#FBCA04` | Styling recipes |
| `semantics` | `#B60205` | Semantic components |
| `blueprints` | `#006B75` | Blueprint definitions |
| `blocks` | `#D93F0B` | Block components |
| `_internal` | `#666666` | Internal API layer |
| `docs` | `#0075CA` | Documentation |
| `generator` | `#E4E669` | Code generation |

### Status Labels

| Label | Color | Description |
|-------|-------|-------------|
| `breaking-change` | `#B60205` | Requires migration |
| `pre-release` | `#FBCA04` | Not production ready |
| `a11y` | `#0E8A16` | Accessibility related |
| `performance` | `#1D76DB` | Performance related |
| `needs-review` | `#5319E7` | Awaiting review |

---

## GitHub Milestones

Milestones match tag milestones.

| Milestone | Description |
|-----------|-------------|
| ColdLight Book Spine | Design book hub complete |
| Taxonomy SSOT Locked | All kinds/slots defined |
| Primitive Catalog Stable | Core primitives complete |
| Semantic API v1 | Semantic layer stable |
| Blueprint Layer v1 | Blueprint system complete |
| Docs Generator v1 | Auto-documentation working |

---

## Branch Strategy

### Main Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |

### Feature Branches

```
<type>/<scope>/<description>
```

Examples:
```
feat/primitives/tooltip
fix/recipes/glass-blur
docs/taxonomy/hovercard
```

### Branch Rules

- [ ] `main` requires PR review
- [ ] `main` requires passing CI
- [ ] `main` requires conventional commit message
- [ ] Feature branches deleted after merge

---

## Lefthook Configuration

Pre-commit hooks enforce discipline.

```yaml
# .lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      run: pnpm lint
    typecheck:
      run: pnpm check
    audit:
      run: pnpm audit:taxonomy

commit-msg:
  commands:
    validate:
      run: npx commitlint --edit {1}
```

### Commitlint Config

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'taxonomy',
      'tokens',
      'primitives',
      'recipes',
      'semantics',
      'blueprints',
      'blocks',
      '_internal',
      'docs',
      'generator',
    ]],
  },
};
```

---

## Release Process

### 1. Prepare Release

```bash
# Ensure all changes committed
git status

# Create release branch
git checkout -b release/v0.2.0

# Update version in package.json
# Update CHANGELOG.md
```

### 2. Create Tag

```bash
git tag -a v0.2.0 -m "Primitive catalog stable"
```

### 3. Merge and Push

```bash
git checkout main
git merge release/v0.2.0
git push origin main --tags
```

### 4. Cleanup

```bash
git branch -d release/v0.2.0
```

---

## Changelog

Changelog is auto-generated from conventional commits.

```markdown
# Changelog

## [0.2.0] - 2026-01-23

### Features
- **primitives:** implement tooltip with Melt UI
- **primitives:** implement dialog with portal

### Fixes
- **recipes:** correct glass blur token reference

### Documentation
- **taxonomy:** add hoverCard to registry
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm check
      - run: pnpm audit:taxonomy
      - run: pnpm test
```

---

## Summary

| Practice | Tool | Enforcement |
|----------|------|-------------|
| Conventional commits | commitlint | Pre-commit hook |
| Scoped commits | commitlint config | Pre-commit hook |
| Taxonomy audit | vite-plugin | Pre-commit hook |
| Type checking | TypeScript | CI |
| Tag milestones | git tag | Manual + CI |
| Labels | GitHub | PR template |

---

**Commits + tags + labels = automation fuel. Do it right from day one.**
