# SPRINT F1: Foundation Infrastructure

> **Status**: READY FOR EXECUTION
> **Scope**: Repo root + `interfaces/desktop/`
> **Depends On**: Nothing — this is Sprint Zero for the real codebase
> **Tasks**: 32 tasks across 6 phases
> **Compact Checkpoint**: After Phase 3 (task 18)

---

## Goal

Establish every config, toolchain pin, linter, scaffolding file, and cleanup that a senior dev demands before any feature code ships. After this sprint, the codebase has: pinned toolchains, enforced linting/formatting, correct TypeScript config, proper SvelteKit scaffolding, clean module boundaries, no dead code, and a CI pipeline that blocks broken PRs.

---

## Current State (Audit: 2026-02-02)

### What's broken
- `tsconfig.json` — `esModuleInterop` + `allowSyntheticDefaultImports` conflict with `verbatimModuleSyntax`
- `tailwind.config.ts` — TW v4 ignores config files entirely. This file is dead. Colors, fonts, animations defined here are NOT applied.
- `app.css` — Manual reset duplicates Tailwind preflight. No `@theme`, no font imports, no token import.
- `app.html` — Missing `<meta name="color-scheme" content="dark" />`
- `sys/index.ts` — Exports dead modules (`appState`, `global`) with missing `.js` extensions

### What's dead (zero consumers)
- `sys/app_state.svelte.ts` — Frame/Sidebar manage their own state
- `sys/runes/global.svelte.ts` — `sidebar_expanded` conflicts with app_state, zero imports

### What's missing
- `biome.json` — No linter, no formatter
- `src/app.d.ts` — No SvelteKit App namespace types
- `src/hooks.client.ts` — No production error handler (this IS the real handler in Tauri SPA)
- `src/hooks.server.ts` — No dev-mode security headers
- `routes/+error.svelte` — No root error boundary
- `routes/(app)/+error.svelte` — No app group error boundary
- `.nvmrc` — Node version not pinned (currently v22.13.1)
- `pnpm-workspace.yaml` — Not a proper pnpm workspace
- `rust-toolchain.toml` — Rust version not pinned (currently 1.89.0)
- `.github/workflows/ci.yml` — No CI pipeline at all
- Domain `index.ts` barrels — Zero exist across 5 domain dirs + 6 app sub-domains

---

## Target State

After this sprint:
```
platform_devpulse/
├── .nvmrc                          # NEW — pins Node 22
├── .github/workflows/ci.yml       # NEW — PR validation
├── pnpm-workspace.yaml            # NEW — workspace config
├── rust-toolchain.toml             # NEW — pins Rust 1.89.0
└── interfaces/desktop/
    ├── biome.json                  # NEW — lint + format config
    ├── tsconfig.json               # FIXED — removed conflicting options
    ├── tailwind.config.ts          # DELETED
    ├── package.json                # UPDATED — biome scripts added
    └── src/
        ├── app.html                # FIXED — dark mode meta
        ├── app.css                 # REWRITTEN — @theme, fonts, token import
        ├── app.d.ts                # NEW — SvelteKit App namespace
        ├── hooks.client.ts         # NEW — error handler
        ├── hooks.server.ts         # NEW — security headers
        ├── routes/
        │   ├── +error.svelte       # NEW — root error boundary
        │   └── (app)/
        │       └── +error.svelte   # NEW — app error boundary
        └── lib/
            ├── sys/
            │   ├── index.ts        # CLEANED — dead exports removed
            │   ├── app_state.svelte.ts   # DELETED
            │   └── runes/
            │       └── global.svelte.ts  # DELETED
            └── domains/
                ├── app/
                │   ├── index.ts          # NEW
                │   ├── devpulse/index.ts  # NEW
                │   ├── devforge/index.ts  # NEW
                │   ├── maestro/index.ts   # NEW
                │   ├── overmind/index.ts  # NEW
                │   ├── ui-demo/index.ts   # NEW
                │   └── wiredfront/index.ts # NEW
                ├── chat/index.ts          # NEW
                ├── common/index.ts        # NEW
                ├── maestro/index.ts       # NEW
                └── notify/index.ts        # NEW
```

---

## Phase 1: Fix Broken Configs (Tasks 1–5)

### Task 1.1: Fix tsconfig.json

Remove `esModuleInterop` and `allowSyntheticDefaultImports`. Both are superseded by `verbatimModuleSyntax` which is already set to `true`. Having all three causes TypeScript to emit conflicting module interop behavior.

- [ ] Remove `esModuleInterop` (line 14)
- [ ] Remove `allowSyntheticDefaultImports` (line 15)
- [ ] Verify: `pnpm check` passes from `interfaces/desktop/`

**File**: `interfaces/desktop/tsconfig.json`

**After edit:**
```json
{
    "extends": "./.svelte-kit/tsconfig.json",
    "compilerOptions": {
        "target": "ESNext",
        "useDefineForClassFields": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "allowJs": true,
        "checkJs": true,
        "isolatedModules": true,
        "strict": true,
        "skipLibCheck": true,
        "verbatimModuleSyntax": true,
        "types": ["node"]
    },
    "include": [
        "**/*.d.ts",
        "**/*.ts",
        "**/*.js",
        "**/*.svelte"
    ],
    "exclude": [
        "node_modules",
        "**/node_modules",
        "src/lib/design/primitives/_archive/**"
    ],
    "references": [
        {
            "path": "./tsconfig.node.json"
        }
    ]
}
```

---

### Task 1.2: Delete dead tailwind.config.ts

Tailwind v4 uses `@tailwindcss/vite` which reads the Vite module graph for content detection. Config files are completely ignored. The colors (void, obsidian, success, warning, error), fonts (Inter, JetBrains Mono), and animations (pulse-glow) defined in this file are NOT being applied. These values will move to `@theme` in `app.css` (Task 2.2).

- [ ] Delete `interfaces/desktop/tailwind.config.ts`
- [ ] Verify: `pnpm dev` still starts (TW v4 doesn't need this file)

---

### Task 1.3: Add dark mode meta to app.html

Tauri SPA runs in dark mode. Without this meta tag, the browser default scrollbar and form controls render in light theme, creating visual flash.

- [ ] Add `<meta name="color-scheme" content="dark" />` to `<head>`

**File**: `interfaces/desktop/src/app.html`

**After edit:**
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

---

### Task 1.4: Rewrite app.css

The current file has a manual reset that duplicates Tailwind's preflight. TW v4's `@import "tailwindcss"` includes preflight automatically. The file needs:
- `@import "tailwindcss"` (keeps preflight)
- `@theme` block with colors, fonts, animations migrated from the dead `tailwind.config.ts`
- Font imports via @fontsource (already in dependencies)
- Token CSS import (when tokens are built — stubbed import for now)
- Remove the manual reset entirely

- [ ] Replace entire file content
- [ ] Verify: `pnpm dev` starts, no CSS errors in console

**File**: `interfaces/desktop/src/app.css`

**After edit:**
```css
/* === DevPulse Desktop — Global Styles === */

/* Tailwind v4 (includes preflight + utilities) */
@import "tailwindcss";

/* Fonts */
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

/* Design tokens (generated — do not hand-edit tokens.css) */
/* @import "$lib/design/tokens/tokens.css"; */
/* ^ Uncomment after running pnpm ds:tokens:build with real SSOT values */

/* Tailwind v4 @theme — migrated from dead tailwind.config.ts */
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --color-void-950: oklch(6% 0.02 195);
  --color-void-900: oklch(8% 0.02 195);
  --color-void-800: oklch(12% 0.02 195);
  --color-obsidian-950: oklch(4% 0.01 195);
  --color-obsidian-900: oklch(6% 0.02 195);
  --color-success: oklch(70% 0.2 145);
  --color-warning: oklch(75% 0.2 85);
  --color-error: oklch(60% 0.25 25);

  --animate-pulse-glow: pulse-glow 4s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Base */
html, body {
  width: 100%;
  height: 100%;
  background-color: var(--color-void-950);
  color: white;
}
```

---

### Task 1.5: Fix tsconfig.json — verify compilation

- [ ] Run `cd interfaces/desktop && pnpm check` — must pass with zero errors from config changes
- [ ] If errors appear from the `esModuleInterop` removal, identify which imports need `type` keyword and fix them

---

## Phase 2: Delete Dead Code + Clean Barrels (Tasks 6–8)

### Task 2.1: Delete dead state modules

Both files have zero consumers. `app_state.svelte.ts` duplicates sidebar state that Frame/Sidebar manage locally. `global.svelte.ts` conflicts with `app_state.svelte.ts` (both have `sidebar_expanded`). Neither is imported anywhere.

- [ ] Delete `interfaces/desktop/src/lib/sys/app_state.svelte.ts`
- [ ] Delete `interfaces/desktop/src/lib/sys/runes/global.svelte.ts`

---

### Task 2.2: Clean sys/index.ts barrel

Remove exports of the deleted modules. Fix missing `.js` extensions per project convention.

- [ ] Remove `appState` export line
- [ ] Remove `global` export line
- [ ] Add `.js` extensions to all import paths
- [ ] Verify: `pnpm check` passes

**File**: `interfaces/desktop/src/lib/sys/index.ts`

**After edit:**
```typescript
/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

// Initialization
export { initSys, isSysInitialized } from './init.js';

// Feature flags
export { flags } from './cfg/flags.js';
export type { FeatureFlags } from './cfg/flags.js';

// Debug tools (dev-only)
export * from './debug/index.js';
```

---

### Task 2.3: Verify no broken imports

- [ ] Run `pnpm check` — confirm zero errors from removed modules
- [ ] If anything imported `appState` or `global`, those imports need to be removed (expected: zero consumers)

---

## Phase 3: Toolchain Pinning + Biome (Tasks 9–14)

### Task 3.1: Create .nvmrc

Pin Node to the version currently installed. This ensures all contributors and CI use the same Node.

- [ ] Create `.nvmrc` at repo root

**File**: `platform_devpulse/.nvmrc`

```
22
```

---

### Task 3.2: Create pnpm-workspace.yaml

Declares the monorepo structure for pnpm. Without this, pnpm doesn't know about workspace packages.

- [ ] Create `pnpm-workspace.yaml` at repo root

**File**: `platform_devpulse/pnpm-workspace.yaml`

```yaml
packages:
  - "interfaces/desktop"
  - "scripts/docs"
```

---

### Task 3.3: Create rust-toolchain.toml

Pin Rust to the version currently installed. Uses the stable channel. This ensures `cargo` uses the correct toolchain without manual `rustup override`.

- [ ] Create `rust-toolchain.toml` at repo root

**File**: `platform_devpulse/rust-toolchain.toml`

```toml
[toolchain]
channel = "1.89.0"
components = ["rustfmt", "clippy", "rust-analyzer"]
```

---

### Task 3.4: Create biome.json

Biome replaces ESLint + Prettier in one tool. Configured for:
- TypeScript + Svelte files
- Strict linting (no `any`, no unused vars, consistent imports)
- Indentation: tabs (Svelte community default)
- Line width: 100
- Ignores generated files, node_modules, build output

- [ ] Create `biome.json` at `interfaces/desktop/`
- [ ] Note: Biome is NOT yet in `devDependencies` — Task 3.5 adds it

**File**: `interfaces/desktop/biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "useImportType": "error",
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".svelte-kit",
      "dist",
      "build",
      "*.generated.*",
      "src/lib/sys/generated/**",
      "src/lib/design/.cowlevel/**",
      "src/lib/design/tokens/tokens.css",
      "src/lib/design/tokens/types.ts",
      "src/lib/design/tokens/tailwind.preset.ts"
    ]
  }
}
```

---

### Task 3.5: Add biome dependency + scripts to package.json

- [ ] Run `cd interfaces/desktop && pnpm add -D @biomejs/biome@latest`
- [ ] Add these scripts to `package.json`:
  - `"lint": "biome check src/"`
  - `"lint:fix": "biome check --write src/"`
  - `"format": "biome format --write src/"`

---

### Task 3.6: Run biome check — audit baseline

- [ ] Run `pnpm lint` and record the count of errors/warnings
- [ ] Do NOT auto-fix everything in this sprint — Biome is now installed and enforcing. Existing violations get cleaned incrementally in future sprints.
- [ ] If any errors are in files we touched in this sprint (app.css, sys/index.ts, etc.), fix those now.

---

## **COMPACT CHECKPOINT — Pause after Phase 3**

Verify before continuing:
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm check` (svelte-check) passes
- [ ] `pnpm lint` runs (may have existing violations — that's fine)
- [ ] `tailwind.config.ts` is deleted
- [ ] `app_state.svelte.ts` and `global.svelte.ts` are deleted
- [ ] `.nvmrc`, `pnpm-workspace.yaml`, `rust-toolchain.toml` exist at repo root
- [ ] `biome.json` exists at `interfaces/desktop/`

---

## Phase 4: SvelteKit Scaffolding (Tasks 15–20)

### Task 4.1: Create app.d.ts

SvelteKit App namespace types. Required for typed `PageData`, `Error`, `Locals`, and `Platform`. Without this, SvelteKit falls back to `any` for all of these.

- [ ] Create `src/app.d.ts`

**File**: `interfaces/desktop/src/app.d.ts`

```typescript
/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
```

---

### Task 4.2: Create hooks.client.ts

In a Tauri SPA, there is no server. `hooks.client.ts` is the ONLY error handler that runs in production. This catches unhandled errors and unexpected navigation errors.

- [ ] Create `src/hooks.client.ts`

**File**: `interfaces/desktop/src/hooks.client.ts`

```typescript
import type { HandleClientError } from "@sveltejs/kit";

export const handleError: HandleClientError = ({ error, event, status, message }) => {
  const err = error as Error;
  console.error(`[DevPulse] Unhandled error at ${event.url.pathname}:`, err);

  return {
    message: message ?? "Something went wrong",
    code: status?.toString() ?? "UNKNOWN",
  };
};
```

---

### Task 4.3: Create hooks.server.ts

Only runs in dev mode (SvelteKit dev server). In production Tauri build, there is no server — this file is inert. Adds security headers during development.

- [ ] Create `src/hooks.server.ts`

**File**: `interfaces/desktop/src/hooks.server.ts`

```typescript
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Security headers for dev mode
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
};
```

---

### Task 4.4: Create root +error.svelte

Catches errors outside the `(app)` group (e.g., 404 on unknown routes). Minimal — no design system dependencies.

- [ ] Create `src/routes/+error.svelte`

**File**: `interfaces/desktop/src/routes/+error.svelte`

```svelte
<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="flex min-h-screen items-center justify-center bg-void-950 text-white">
  <div class="text-center">
    <h1 class="text-4xl font-bold">{$page.status}</h1>
    <p class="mt-2 text-lg text-white/60">{$page.error?.message ?? "Page not found"}</p>
    <a href="/" class="mt-6 inline-block text-sm text-white/40 underline hover:text-white/80">
      Back to DevPulse
    </a>
  </div>
</div>
```

---

### Task 4.5: Create app group +error.svelte

Catches errors inside the `(app)` group. Renders within the app shell (Frame + Sidebar stay visible).

- [ ] Create `src/routes/(app)/+error.svelte`

**File**: `interfaces/desktop/src/routes/(app)/+error.svelte`

```svelte
<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="flex flex-1 items-center justify-center text-white">
  <div class="text-center">
    <h1 class="text-3xl font-bold">{$page.status}</h1>
    <p class="mt-2 text-white/60">{$page.error?.message ?? "Something went wrong"}</p>
    <a href="/devpulse" class="mt-4 inline-block text-sm text-white/40 underline hover:text-white/80">
      Back to dashboard
    </a>
  </div>
</div>
```

---

### Task 4.6: Verify SvelteKit scaffolding

- [ ] Run `pnpm check` — all new files must pass type checking
- [ ] Run `pnpm dev` — navigate to a nonexistent route, confirm error page renders

---

## Phase 5: Domain Barrels (Tasks 21–27)

Each domain must have an `index.ts` that serves as its public API surface. Routes import ONLY from these barrels. For now, each barrel is a minimal placeholder that documents the domain's purpose. Real exports get added as features are built.

### Task 5.1: Create domains/app/index.ts

- [ ] Create file

**File**: `interfaces/desktop/src/lib/domains/app/index.ts`

```typescript
/**
 * @file domains/app/index.ts
 * @module @devpulse/domains/app
 * @description App domain barrel — product silo aggregator
 */

export * from "./devpulse/index.js";
export * from "./devforge/index.js";
export * from "./maestro/index.js";
export * from "./overmind/index.js";
export * from "./ui-demo/index.js";
export * from "./wiredfront/index.js";
```

### Task 5.2: Create app sub-domain barrels

Six files, same pattern. Each barrel documents the sub-domain and re-exports its public API (empty for now).

- [ ] Create `domains/app/devpulse/index.ts`
- [ ] Create `domains/app/devforge/index.ts`
- [ ] Create `domains/app/maestro/index.ts`
- [ ] Create `domains/app/overmind/index.ts`
- [ ] Create `domains/app/ui-demo/index.ts`
- [ ] Create `domains/app/wiredfront/index.ts`

**Template** (replace `{name}` and `{description}`):
```typescript
/**
 * @file domains/app/{name}/index.ts
 * @module @devpulse/domains/app/{name}
 * @description {description}
 */

// Public API — add exports as features are built
```

Descriptions:
- `devpulse` — "Dashboard, community, profile, settings"
- `devforge` — "IDE integration and code workspace"
- `maestro` — "AI orchestrator frontend"
- `overmind` — "ThinkSpace — strategic overview"
- `ui-demo` — "Component showcase and design system playground"
- `wiredfront` — "Network overlay system"

### Task 5.3: Create top-level domain barrels

- [ ] Create `domains/chat/index.ts`
- [ ] Create `domains/common/index.ts`
- [ ] Create `domains/maestro/index.ts`
- [ ] Create `domains/notify/index.ts`

**Template:**
```typescript
/**
 * @file domains/{name}/index.ts
 * @module @devpulse/domains/{name}
 * @description {description}
 */

// Public API — add exports as features are built
```

Descriptions:
- `chat` — "Chat engine — message handling, conversation state"
- `common` — "Shared domain utilities and types"
- `maestro` — "Maestro AI kernel frontend integration"
- `notify` — "Notification system — svelte-sonner provider"

### Task 5.4: Verify domain barrels

- [ ] Run `pnpm check` — all barrels must pass (empty re-exports from empty files may warn — that's fine, just no errors)

---

## Phase 6: CI Pipeline (Tasks 28–32)

### Task 6.1: Create .github/workflows directory

- [ ] Create `.github/workflows/` directory at repo root

### Task 6.2: Create ci.yml

Two jobs: Rust checks and TypeScript checks. Runs on pull requests to `main`. Uses caching for both Cargo and pnpm.

- [ ] Create `.github/workflows/ci.yml`

**File**: `platform_devpulse/.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  rust:
    name: Rust Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: "1.89.0"
          components: rustfmt, clippy

      - name: Cache Cargo
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
          restore-keys: ${{ runner.os }}-cargo-

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --workspace -- -D warnings

      - name: Build
        run: cargo build --workspace

      - name: Test
        run: cargo test --workspace

  desktop:
    name: Desktop Checks
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: interfaces/desktop
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Biome lint
        run: pnpm lint

      - name: Svelte check
        run: pnpm check

      - name: Build
        run: pnpm build
```

---

### Task 6.3: Verify CI workflow syntax

- [ ] Run `cd .github/workflows && cat ci.yml` — confirm YAML is valid
- [ ] If `gh` CLI is available: `gh workflow list` after push to confirm GitHub picks it up

---

### Task 6.4: Add workspace lints to Cargo.toml

Shared clippy and rustdoc configuration for the entire workspace. Every crate inherits these without per-crate config.

- [ ] Add `[workspace.lints.clippy]` and `[workspace.lints.rust]` sections to root `Cargo.toml`

**Append to** `Cargo.toml`:

```toml

[workspace.lints.clippy]
all = { level = "warn", priority = -1 }
unwrap_used = "deny"
expect_used = "warn"
pedantic = { level = "warn", priority = -1 }
module_name_repetitions = "allow"
must_use_candidate = "allow"

[workspace.lints.rust]
unsafe_code = "deny"
missing_docs = "warn"
```

- [ ] Note: Each crate needs `[lints] workspace = true` in its own `Cargo.toml` to inherit these. That's a separate task — this sprint establishes the workspace-level config only.

---

### Task 6.5: Final verification

- [ ] `pnpm dev` starts clean from `interfaces/desktop/`
- [ ] `pnpm check` passes (svelte-check)
- [ ] `pnpm lint` runs (biome — may have pre-existing violations)
- [ ] `cargo check --workspace` passes
- [ ] `cargo fmt --all -- --check` passes
- [ ] All new files exist at expected paths
- [ ] All deleted files are gone
- [ ] No dead imports remain in `sys/index.ts`

---

## Verification Checklist

```
Phase 1: Configs
  [ ] tsconfig.json — no esModuleInterop, no allowSyntheticDefaultImports
  [ ] tailwind.config.ts — deleted
  [ ] app.html — has color-scheme meta + class="dark"
  [ ] app.css — has @theme, fonts, no manual reset
  [ ] pnpm check passes

Phase 2: Dead Code
  [ ] app_state.svelte.ts — deleted
  [ ] runes/global.svelte.ts — deleted
  [ ] sys/index.ts — clean, .js extensions, no dead exports

Phase 3: Toolchain
  [ ] .nvmrc exists — contains "22"
  [ ] pnpm-workspace.yaml exists
  [ ] rust-toolchain.toml exists — pins 1.89.0
  [ ] biome.json exists at interfaces/desktop/
  [ ] @biomejs/biome in devDependencies
  [ ] lint/format scripts in package.json

Phase 4: SvelteKit Scaffolding
  [ ] src/app.d.ts exists — App.Error typed
  [ ] src/hooks.client.ts exists — handleError exported
  [ ] src/hooks.server.ts exists — security headers
  [ ] routes/+error.svelte exists
  [ ] routes/(app)/+error.svelte exists

Phase 5: Domain Barrels
  [ ] domains/app/index.ts exists
  [ ] domains/app/{devpulse,devforge,maestro,overmind,ui-demo,wiredfront}/index.ts — all 6 exist
  [ ] domains/{chat,common,maestro,notify}/index.ts — all 4 exist

Phase 6: CI
  [ ] .github/workflows/ci.yml exists
  [ ] Cargo.toml has [workspace.lints.clippy] section
  [ ] cargo check --workspace passes
```

---

## Dependencies for Next Sprint

After F1 is complete:
- **Sprint F2: Token SSOT** — Write real values to `tokens/tokens.ts`, run `pnpm ds:tokens:build`, uncomment token import in `app.css`
- **Sprint F2 alternate: Rust Foundation** — Add `[lints] workspace = true` to each crate, wire engine in Tauri backend, create `[profile.dev]`/`[profile.release]` in root Cargo.toml
- Biome violations in existing files get cleaned incrementally — not blocking
