# 2026 Documentation Automation Strategy

> **Goal:** Zero manual MD file maintenance. Code = Source of Truth.
> **Stack:** Docusaurus + TypeDoc + Conventional Commits + Mermaid + GitHub Actions
> **Created:** 2026-01-22
> **Updated:** 2026-01-22

---

## SETUP COMPLETED ✅

The following infrastructure is now in place:

| Component | Status | Location |
|-----------|--------|----------|
| **Lefthook** (git hooks) | ✅ Configured | `lefthook.yml` |
| **Commitlint** | ✅ Configured | `commitlint.config.js` |
| **Custom Props Extractor** | ✅ Created | `tools/docgen/` |
| **TSDoc Config** | ✅ Created | `interfaces/desktop/src/lib/design/tsdoc.json` |
| **Release-Please** | ✅ Configured | `release-please-config.json` |
| **GitHub Actions** | ✅ Created | `.github/workflows/release.yml` |

### Commit Scopes Configured

```
Core:       engine, maestro, desktop
Design:     coldlight, primitives, tokens, recipes, taxonomy
Hubs:       wiredfront, pixvix, viziwizi, devmaestro, overmind
Infra:      xtask, ci, deps, config, lab
Docs:       docs, changelog
```

### Release Tags (Monorepo)

| Package | Tag Format | Example |
|---------|------------|---------|
| ColdLight | `coldlight-v{version}` | `coldlight-v0.1.0` |
| Desktop | `devpulse-desktop-v{version}` | `devpulse-desktop-v0.1.0` |
| Engine | `devpulse-engine-v{version}` | `devpulse-engine-v0.1.0` |
| Maestro | `devpulse-maestro-v{version}` | `devpulse-maestro-v0.1.0` |

### Svelte 5 Props Extractor (Replaces sveld)

**sveld does not work with Svelte 5 runes.** We built a custom ts-morph based extractor:

```bash
cd tools/docgen
pnpm install
pnpm extract:primitives  # Outputs docs/generated/primitives.json
```

The extractor parses `types.ts` files and extracts:
- Interface names and descriptions
- Property names, types, required/optional
- JSDoc comments and @tags
- Slots arrays and State types

---

## CORE PRINCIPLE

```
Code (TSDoc/JSDoc) → Auto-Generated → Docusaurus
Commits (Conventional) → Auto-Generated → Changelog/Releases
Tests (Vitest) → Auto-Generated → Coverage Badges
Structure (Imports) → Auto-Generated → Architecture Diagrams
```

**You write code with TSDoc comments, commit with conventional format, and everything else generates automatically.**

---

## 1. TSDoc IN CODE → API DOCS

### Tags to Use Consistently

Every primitive, type, and function gets TSDoc comments that generate docs:

```typescript
/**
 * @file primitives/dialog/Content.svelte
 * @layer primitives
 * @kind dialog
 *
 * Dialog content - the main container for dialog UI.
 *
 * @remarks
 * ColdLight owns ARIA. This component adds:
 * - `role="dialog"`
 * - `aria-modal="true"`
 * - `data-kind="dialog"`
 * - `data-slot="content"`
 *
 * @example
 * ```svelte
 * <Dialog.Content>
 *   <Dialog.Title>Confirm</Dialog.Title>
 *   <Dialog.Description>Are you sure?</Dialog.Description>
 * </Dialog.Content>
 * ```
 *
 * @see {@link DialogRootProps} for parent configuration
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | WAI-ARIA Dialog Pattern}
 *
 * @public
 */
```

### Custom Tags for ColdLight

Define in `tsdoc.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["@microsoft/api-extractor/extends/tsdoc-base.json"],
  "tagDefinitions": [
    { "tagName": "@layer", "syntaxKind": "modifier" },
    { "tagName": "@kind", "syntaxKind": "modifier" },
    { "tagName": "@slot", "syntaxKind": "modifier" },
    { "tagName": "@aria", "syntaxKind": "block" },
    { "tagName": "@keyboard", "syntaxKind": "block" },
    { "tagName": "@dataattr", "syntaxKind": "block" }
  ]
}
```

### Tools

| Tool | Purpose | Output |
|------|---------|--------|
| [TypeDoc](https://typedoc.org/) | Parse TSDoc → JSON/HTML | `.api.json` files |
| [docusaurus-plugin-typedoc-api](https://github.com/milesj/docusaurus-plugin-typedoc-api) | TypeDoc → Docusaurus pages | `/api/*` routes |
| [typedoc-plugin-markdown](https://typedoc-plugin-markdown.org/) | TypeDoc → Markdown | `.md` files |
| [API Extractor](https://api-extractor.com/) | Validate + bundle `.d.ts` | Clean API surface |
| ~~sveld~~ | ⚠️ Does NOT work with Svelte 5 runes | Use `tools/docgen` instead |

---

## 2. CONVENTIONAL COMMITS → CHANGELOG

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types we use:**

| Type | Triggers | Description |
|------|----------|-------------|
| `feat` | MINOR bump | New feature |
| `fix` | PATCH bump | Bug fix |
| `docs` | No bump | Documentation only |
| `style` | No bump | Formatting |
| `refactor` | No bump | Code restructure |
| `perf` | PATCH bump | Performance |
| `test` | No bump | Tests |
| `chore` | No bump | Build/tooling |
| `BREAKING CHANGE` | MAJOR bump | In footer |

**Scopes for ColdLight:**

```
primitives, taxonomy, tokens, recipes, sys, dialog, select, tooltip, popover, tabs, sheet, alertdialog, combobox
```

### Example Commits

```bash
feat(primitives): add Select primitive with listbox ARIA

Implements Select with:
- Generic <T> type support
- data-selected/data-highlighted presence attributes
- Full keyboard navigation

Closes #123

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

```bash
fix(tooltip): add missing role="tooltip" attribute

ADR-008: Bits UI does not add role="tooltip" automatically.
ColdLight now adds it in Content.svelte.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Tools

| Tool | Purpose |
|------|---------|
| [release-please](https://github.com/googleapis/release-please-action) | Auto PR + changelog + version bump |
| [commitlint](https://commitlint.js.org/) | Enforce commit format |
| [husky](https://typicode.github.io/husky/) | Git hooks (pre-commit, commit-msg) |
| [standard-version](https://github.com/conventional-changelog/standard-version) | Local changelog generation |

### GitHub Action: release-please

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node
          package-name: "@devpulse/coldlight"
          changelog-types: |
            [
              {"type": "feat", "section": "Features", "hidden": false},
              {"type": "fix", "section": "Bug Fixes", "hidden": false},
              {"type": "perf", "section": "Performance", "hidden": false},
              {"type": "docs", "section": "Documentation", "hidden": false},
              {"type": "refactor", "section": "Code Refactoring", "hidden": true}
            ]
```

---

## 3. ARCHITECTURE DIAGRAMS → AUTO-GENERATED

### Option A: Swark (VS Code Extension)

[Swark](https://github.com/swark-io/swark) uses GitHub Copilot to analyze code and generate Mermaid diagrams automatically.

**Use for:** High-level architecture views, dependency graphs

### Option B: Mermaid in TSDoc

Embed diagrams directly in code comments:

```typescript
/**
 * @remarks
 * ```mermaid
 * flowchart TD
 *   A[Dialog.Root] --> B[Dialog.Trigger]
 *   A --> C[Dialog.Portal]
 *   C --> D[Dialog.Overlay]
 *   C --> E[Dialog.Content]
 *   E --> F[Dialog.Title]
 *   E --> G[Dialog.Description]
 *   E --> H[Dialog.Close]
 * ```
 */
```

TypeDoc + Docusaurus render Mermaid natively.

### Option C: Code Analysis Scripts

Generate diagrams from imports:

```typescript
// scripts/generate-diagrams.ts
import { Project } from "ts-morph";
import { writeFileSync } from "fs";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

// Analyze primitives folder
const primitives = project.getDirectory("src/lib/design/primitives");

// Generate component hierarchy
function generateMermaid(dir) {
  let mermaid = "flowchart TD\n";
  // ... analyze exports, imports, generate nodes
  return mermaid;
}
```

---

## 4. TEST COVERAGE → BADGES + DOCS

### Vitest Config

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/lib/design/primitives/**/*.{ts,svelte}"],
    },
  },
});
```

### Badge Generation

```yaml
# .github/workflows/coverage.yml
- name: Generate Coverage Badges
  uses: jpb06/coverage-badges-action@v1
  with:
    coverage-summary-path: ./coverage/coverage-summary.json
    output-folder: ./badges
    logo: vitest
```

### Coverage in Docusaurus

```mdx
<!-- docs/primitives/overview.mdx -->
import CoverageBadge from '@site/static/badges/coverage.svg';

# Primitives

<CoverageBadge />

Current test coverage for all primitives.
```

---

## 5. ADR (Architecture Decision Records) → AUTO-INDEXED

### Structure

```
docs/
├── adr/
│   ├── index.md              # Auto-generated index
│   ├── 0001-bits-ui-adapter.md
│   ├── 0002-aria-ownership.md
│   ├── 0003-tabs-snippetprops-gap.md
│   ├── 0007-tooltip-provider.md
│   └── 0008-manual-role-attribution.md
```

### Template (MADR)

```markdown
# ADR-{NUMBER}: {TITLE}

## Status

{Proposed | Accepted | Deprecated | Superseded by ADR-XXX}

## Context

{What is the issue?}

## Decision

{What was decided?}

## Consequences

{What are the results?}

## References

- {Links to relevant code, issues, docs}
```

### Auto-Index Script

```typescript
// scripts/generate-adr-index.ts
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const adrDir = "docs/adr";
const files = readdirSync(adrDir).filter(f => f.match(/^\d{4}-.*\.md$/));

const index = `# Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|
${files.map(f => {
  const content = readFileSync(join(adrDir, f), "utf-8");
  const title = content.match(/# ADR-\d+: (.+)/)?.[1] || "Unknown";
  const status = content.match(/## Status\n\n(.+)/)?.[1] || "Unknown";
  return `| [${f.replace(".md", "")}](./${f}) | ${title} | ${status} |`;
}).join("\n")}

*Auto-generated from ADR files.*
`;

writeFileSync(join(adrDir, "index.md"), index);
```

---

## 6. PRIMITIVES AUDIT → AUTO-REPORT

### Existing Script Enhancement

Your `audit:primitives` script can output JSON:

```typescript
// scripts/audit-primitives.ts
interface PrimitiveAudit {
  name: string;
  complete: boolean;
  hasTypes: boolean;
  hasTests: boolean;
  hasA11y: boolean;
  testCount: number;
  slots: string[];
  missingFiles: string[];
}

// Output to JSON for Docusaurus consumption
const audit: PrimitiveAudit[] = [...];
writeFileSync("docs/data/primitives-audit.json", JSON.stringify(audit, null, 2));
```

### Docusaurus Component

```tsx
// src/components/PrimitivesStatus.tsx
import auditData from "@site/docs/data/primitives-audit.json";

export default function PrimitivesStatus() {
  return (
    <table>
      <thead>
        <tr>
          <th>Primitive</th>
          <th>Status</th>
          <th>Tests</th>
          <th>A11y Doc</th>
        </tr>
      </thead>
      <tbody>
        {auditData.map(p => (
          <tr key={p.name}>
            <td>{p.name}</td>
            <td>{p.complete ? "✅" : "🚧"}</td>
            <td>{p.testCount}</td>
            <td>{p.hasA11y ? "✅" : "❌"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 7. GITHUB ACTIONS WORKFLOW

### Complete CI/CD Pipeline

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
    paths:
      - "interfaces/desktop/src/lib/design/**"
      - "docs/**"

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install

      # Generate API docs from TSDoc
      - name: Generate API Docs
        run: pnpm typedoc

      # Run primitives audit
      - name: Audit Primitives
        run: pnpm audit:primitives --json > docs/data/primitives-audit.json

      # Generate ADR index
      - name: Generate ADR Index
        run: pnpm tsx scripts/generate-adr-index.ts

      # Generate coverage badges
      - name: Run Tests with Coverage
        run: pnpm test:run --coverage

      - name: Generate Coverage Badges
        uses: jpb06/coverage-badges-action@v1
        with:
          coverage-summary-path: ./interfaces/desktop/coverage/coverage-summary.json
          output-folder: ./docs/static/badges

      # Build Docusaurus
      - name: Build Docusaurus
        run: cd docs && pnpm build

      # Deploy to GitHub Pages
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/build
```

---

## 8. FILE HEADER CONVENTION

Every file gets a standardized header that tools can parse:

```typescript
/**
 * @file primitives/select/Item.svelte
 * @layer primitives
 * @kind select
 * @slot item
 *
 * @description
 * Select item - selectable option within the listbox.
 *
 * @aria
 * - role="option" (Bits UI)
 * - aria-selected="true/false" (Bits UI)
 * - aria-disabled (when disabled)
 *
 * @dataattr
 * - data-kind="select"
 * - data-slot="item"
 * - data-selected (presence)
 * - data-highlighted (presence)
 *
 * @keyboard
 * - Enter/Space: Select item
 * - ArrowUp/Down: Navigate (parent handles)
 *
 * @example
 * <Select.Item value="apple">
 *   {#snippet children({ selected })}
 *     Apple {#if selected}✓{/if}
 *   {/snippet}
 * </Select.Item>
 *
 * @since 0.1.0
 * @see {@link SelectItemProps}
 */
```

---

## 9. IMPLEMENTATION ORDER

### Phase 1: Foundation (This Week)
1. [ ] Add `tsdoc.json` config to `interfaces/desktop/src/lib/design/`
2. [ ] Set up commitlint + husky for conventional commits
3. [ ] Configure TypeDoc with markdown output
4. [ ] Create ADR template in `docs/adr/`
5. [ ] Start adding TSDoc headers to primitives as we rebuild

### Phase 2: Automation (Next Sprint)
1. [ ] Add release-please GitHub Action
2. [ ] Add coverage badge generation
3. [ ] Enhance primitives audit to output JSON
4. [ ] Set up Docusaurus with TypeDoc plugin

### Phase 3: Integration (Sprint After)
1. [ ] Auto-generate ADR index on commit
2. [ ] Auto-generate architecture diagrams (Swark or custom)
3. [ ] Link everything in Docusaurus sidebar
4. [ ] Add search (Algolia DocSearch or local)

---

## 10. QUICK WINS (COMPLETED ✅)

### 1. ✅ Commitlint + Lefthook (not husky)

Already configured at root level:
- `commitlint.config.js` - Scopes for all packages
- `lefthook.yml` - Git hooks including commit-msg validation

### 2. ✅ TSDoc Config

Created `interfaces/desktop/src/lib/design/tsdoc.json` with ColdLight-specific tags:
- `@layer`, `@kind`, `@slot`, `@primitive`
- `@aria`, `@keyboard`, `@dataattr`
- `@recipe`, `@material`, `@focus`, `@taxonomy`

### 3. ✅ Svelte 5 Props Extractor

Created `tools/docgen/` with ts-morph based extraction (replaces sveld).

### 4. Add TypeDoc (TODO)

```bash
cd interfaces/desktop
pnpm add -D typedoc typedoc-plugin-markdown
```

```json
// typedoc.json
{
  "entryPoints": ["src/lib/design/primitives/index.ts"],
  "out": "../../docs/docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "excludePrivate": true,
  "excludeProtected": true
}
```

### 4. Standardize File Headers

Add TSDoc headers to primitives as we rebuild them (third time).

---

## SOURCES

- [TypeDoc](https://typedoc.org/) - TypeScript documentation generator
- [TSDoc](https://tsdoc.org/) - Doc comment standard for TypeScript
- [API Extractor](https://api-extractor.com/) - Microsoft's API analysis tool
- [release-please](https://github.com/googleapis/release-please-action) - Automated releases from conventional commits
- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - Changelog generation
- [Mermaid](https://mermaid.js.org/) - Diagrams from text
- [Swark](https://github.com/swark-io/swark) - Auto-generate architecture diagrams from code
- [MADR](https://adr.github.io/madr/) - Markdown Architecture Decision Records
- [docusaurus-plugin-typedoc-api](https://github.com/milesj/docusaurus-plugin-typedoc-api) - TypeDoc + Docusaurus integration
- [sveld](https://github.com/carbon-design-system/sveld) - Svelte component documentation generator
- [Vitest Coverage](https://vitest.dev/guide/coverage) - Test coverage configuration
- [Coverage Badges Action](https://github.com/jpb06/coverage-badges-action) - Generate badges from coverage
- [Knapsack](https://www.knapsack.cloud/) - Design system documentation automation
- [Deno JSDoc Guide](https://deno.com/blog/document-javascript-package) - JSDoc best practices

---

## TL;DR

| What | How | When |
|------|-----|------|
| API Docs | TSDoc → TypeDoc → Docusaurus | Every build |
| Changelog | Conventional Commits → release-please | Every merge to main |
| Coverage | Vitest → json-summary → badges | Every PR |
| Diagrams | Mermaid in TSDoc or Swark | On-demand |
| ADRs | MADR template → auto-index | When decisions made |
| Audit | audit:primitives → JSON → Docusaurus | Every build |

---

## PREVIOUS NOTES (Reference)

The following are working notes from earlier sessions, preserved for context:

### Taxonomy Registries Defined

```typescript
// taxonomy/pseudo/registry.ts
export const PseudoRegistry = {
  "glow-border": {
    element: "before",
    position: "inset: -1px",
    background: "gradient-glow-135",
    animation: "gradient-shift",
    mask: "border-only",
  },
  "shimmer": {
    element: "after",
    position: "inset: 0",
    background: "gradient-shimmer-90",
    animation: "shimmer-slide",
  },
} as const;

// taxonomy/layers/shadow-stack.ts
export const ShadowStackRecipes = {
  "standard-depth": {
    outer: "0 4px 16px rgba(0, 0, 0, 0.3)",
    insetTop: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    insetBottom: "inset 0 -1px 1px rgba(0, 0, 0, 0.2)",
  },
  "glow-depth": {
    outer: "0 4px 20px rgba(127, 47, 168, 0.4)",
    ambient: "0 0 30px rgba(127, 47, 168, 0.2)",
  },
} as const;

// taxonomy/transform/depth-mode.ts
export const DepthMode = {
  "2d": { property: "translateY", preserveFlat: true },
  "3d": { property: "translateZ", preserveFlat: false, perspective: "150px" },
} as const;

// taxonomy/materials/index.ts
export const MaterialRegistry = {
  glass: {
    recipes: ["glass-subtle", "glass-medium", "glass-intense", "glass-ultra"],
    requiredTokens: ["blur", "saturation", "bg", "border"],
    supportsDepth: true,
  },
  metal: {
    recipes: ["metal-brushed", "metal-chrome", "metal-copper"],
    requiredTokens: ["gradient", "specular", "roughness"],
    supportsDepth: true,
  },
  solid: {
    recipes: ["solid-matte", "solid-satin"],
    requiredTokens: ["bg", "border"],
    supportsDepth: false,
  },
} as const;
```

### Class Composition Pattern

```html
<button class="btn btn-primary v-cyber s-glass e-2 sz-md">
         │      │           │       │      │    │
         │      │           │       │      │    └── size
         │      │           │       │      └── elevation
         │      │           │       └── surface/material
         │      │           └── recipe (schema contract)
         │      └── semantic intent
         └── base component
```

### Internal vs External Classes

| External (user sees) | Internal (system applies) |
|---------------------|--------------------------|
| `btn btn-primary` | `_motion-pulse` |
| `v-cyber` | `_blend-cool-bright` |
| `s-glass e-2 sz-md` | Token resolution |

### Architecture Flow

```
DTCG Tokens (SSOT)
       │
       ├──► manifest.generated.json
       │           │
       │           ├──► schemas.generated.ts (Zod)
       │           ├──► types.generated.ts (TypeScript)
       │           └──► css/*.css (Style Dictionary)
       │
       ├──► Recipe JSON files (validated against Zod schemas)
       │           │
       │           └──► VPB reads recipe → shows only valid props
       │
       └──► User cannot create invalid configuration
                    │
                    └──► Output guaranteed valid by construction
```

### Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| Provider | State/behavior only (bits-ui internals) |
| Primitives | ARIA attributes, data-kind, data-slot, data-state |
| ColdLight | ALL visual output, only ColdLight selectors |
| DTCG | Source of truth for all values |
| Zod | Runtime validation at boundaries |
| VPB | UI prevents invalid, consumes schemas |
