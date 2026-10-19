# COLD LIGHT Vite Plugin Specification

> **Authoritative reference for the `vite-plugin-coldlight` orchestration layer.**

---

## Overview

The `coldlight` Vite plugin is the orchestration layer that:

1. **Watches** token source files
2. **Generates** outputs via Style Dictionary
3. **Verifies** registries at startup
4. **Provides** virtual modules for registry access
5. **Triggers** HMR/reload on changes

---

## Plugin Responsibilities

### A) Token Pipeline

On dev server start + on file change:

```
Watch: design/tokens/tokens.ts
    ↓
Export: tokens.ts → tokens.json (DTCG)
    ↓
Build: SD4 transforms → outputs
    ↓
Outputs:
├── tokens.css
├── types.ts
├── tailwind.preset.ts
└── surfaces.gen.css
```

### B) Registry Verification (Fail Fast)

On startup/build:

- Verify kinds have contracts (every kind in `kinds.ts` has matching schema)
- Verify recipe IDs exist (every recipe referenced exists in registry)
- Verify presets match kind+recipe constraints
- Verify `requires[]` actions exist
- Optionally verify VPB palette consistency

### C) HMR + Reload Strategy

| File Change | Action |
|-------------|--------|
| `tokens.ts` | Full reload (CSS changes require it) |
| `recipes/**/*.ts` | HMR reload virtual module |
| `taxonomy/**/*.ts` | HMR reload virtual module |
| `presets/**/*.ts` | HMR reload virtual module |

### D) Tailwind JIT Coverage Enforcement

Validate Tailwind content array includes:

```javascript
content: [
  "./src/**/*.{html,js,svelte,ts}",
  "./packages/coldlight/recipes/**/*.ts",  // CRITICAL
]
```

If missing → error loudly in dev overlay.

### E) Virtual Module Exports

Provide virtual modules so VPB and debug UIs can import:

```typescript
// Available virtual modules
"virtual:coldlight-registry/kinds"
"virtual:coldlight-registry/recipes"
"virtual:coldlight-registry/presets"
"virtual:coldlight-registry/actions"
```

---

## Plugin Implementation

```typescript
// vite-plugins/coldlight.ts
import type { Plugin } from "vite";
import { exec } from "child_process";

export function coldlight(): Plugin {
  let watcher: FSWatcher | null = null;

  return {
    name: "vite-plugin-coldlight",

    configResolved(config) {
      // Store config for later use
    },

    buildStart() {
      // Run token build on startup
      this.runTokenBuild();
      this.verifyRegistries();
      this.verifyTailwindContent();
    },

    configureServer(server) {
      // Watch tokens.ts for changes
      watcher = chokidar.watch("packages/coldlight/tokens/tokens.ts", {
        ignoreInitial: true,
      });

      watcher.on("change", () => {
        this.runTokenBuild();
        server.ws.send({ type: "full-reload" });
      });

      // Watch registry files
      const registryWatcher = chokidar.watch([
        "packages/coldlight/recipes/**/*.ts",
        "packages/coldlight/taxonomy/**/*.ts",
        "packages/coldlight/recipes/presets/**/*.ts",
      ], { ignoreInitial: true });

      registryWatcher.on("change", (file) => {
        this.verifyRegistries();
        server.ws.send({
          type: "custom",
          event: "coldlight:registry-update",
          data: { file },
        });
      });
    },

    resolveId(id) {
      if (id.startsWith("virtual:coldlight-registry/")) {
        return id;
      }
    },

    load(id) {
      if (id === "virtual:coldlight-registry/kinds") {
        return this.generateKindsModule();
      }
      if (id === "virtual:coldlight-registry/recipes") {
        return this.generateRecipesModule();
      }
      if (id === "virtual:coldlight-registry/presets") {
        return this.generatePresetsModule();
      }
      if (id === "virtual:coldlight-registry/actions") {
        return this.generateActionsModule();
      }
    },

    buildEnd() {
      if (watcher) {
        watcher.close();
      }
    },

    // Internal methods
    runTokenBuild() {
      exec("pnpm ds:tokens:build", (err, stdout, stderr) => {
        if (err) {
          console.error("[coldlight] Token build failed:", stderr);
          // Show error overlay in dev
          this.showErrorOverlay({
            message: "Token build failed",
            detail: stderr,
          });
        } else {
          console.log("[coldlight] Tokens rebuilt successfully");
        }
      });
    },

    verifyRegistries() {
      const errors: string[] = [];

      // Verify kinds have contracts
      for (const [kind, entry] of Object.entries(KindRegistry)) {
        if (!entry.schema) {
          errors.push(`Kind "${kind}" has no schema`);
        }
      }

      // Verify recipes exist
      for (const [recipeId, recipe] of Object.entries(RecipeRegistry)) {
        if (!recipe.classes) {
          errors.push(`Recipe "${recipeId}" has no classes() function`);
        }
        // Verify required actions exist
        for (const actionId of recipe.requires || []) {
          if (!ActionRegistry[actionId]) {
            errors.push(`Recipe "${recipeId}" requires unknown action "${actionId}"`);
          }
        }
      }

      // Verify presets match constraints
      for (const [presetId, preset] of Object.entries(PresetRegistry)) {
        const kindEntry = KindRegistry[preset.kind];
        if (!kindEntry) {
          errors.push(`Preset "${presetId}" references unknown kind "${preset.kind}"`);
          continue;
        }
        if (!kindEntry.allowedRecipes.includes(preset.recipe)) {
          errors.push(`Preset "${presetId}" uses recipe "${preset.recipe}" not allowed for kind "${preset.kind}"`);
        }
      }

      if (errors.length > 0) {
        console.error("[coldlight] Registry verification failed:");
        errors.forEach(e => console.error(`  - ${e}`));
        if (process.env.NODE_ENV === "production") {
          throw new Error("Registry verification failed");
        }
      }
    },

    verifyTailwindContent() {
      // Read tailwind.config.js and verify content array
      const config = require("./tailwind.config.js");
      const required = "packages/coldlight/recipes/**/*.ts";

      if (!config.content.includes(required)) {
        console.error(`[coldlight] Tailwind content missing: ${required}`);
        console.error("[coldlight] Recipe classes will not be generated!");
      }
    },

    generateKindsModule() {
      return `
        export const kinds = ${JSON.stringify(Object.keys(KindRegistry))};
        export const KindRegistry = ${JSON.stringify(KindRegistry)};
      `;
    },

    generateRecipesModule() {
      return `
        export const recipes = ${JSON.stringify(Object.keys(RecipeRegistry))};
        export const RecipeRegistry = ${JSON.stringify(RecipeRegistry)};
      `;
    },

    generatePresetsModule() {
      return `
        export const presets = ${JSON.stringify(Object.keys(PresetRegistry))};
        export const PresetRegistry = ${JSON.stringify(PresetRegistry)};
      `;
    },

    generateActionsModule() {
      return `
        export const actions = ${JSON.stringify(Object.keys(ActionRegistry))};
        export const ActionRegistry = ${JSON.stringify(ActionRegistry)};
      `;
    },

    showErrorOverlay(error) {
      // Integration with Vite's error overlay
    },
  };
}
```

---

## Generated Artifacts

### Token Outputs

```
design/tokens/generated/
├── tokens.dtcg.json       # DTCG 2025.10 format
├── tokens.css             # CSS custom properties (root only)
├── tokens.types.ts        # TypeScript types + enum arrays
└── tailwind.preset.ts     # Tailwind theme extension
```

### Registry Snapshot

```
design/registry/generated/
└── registry.snapshot.ts   # Virtual module source (optional)
```

---

## Virtual Modules Usage

```typescript
// In VPB or debug UI
import { kinds, KindRegistry } from "virtual:coldlight-registry/kinds";
import { recipes, RecipeRegistry } from "virtual:coldlight-registry/recipes";
import { presets, PresetRegistry } from "virtual:coldlight-registry/presets";
import { actions, ActionRegistry } from "virtual:coldlight-registry/actions";

// Build palette from registry
const palette = kinds.map(kind => ({
  kind,
  label: KindRegistry[kind].label,
  allowedRecipes: KindRegistry[kind].allowedRecipes,
}));
```

---

## Error Handling

### Token Build Failure

```
[coldlight] Token build failed:
  Error: Invalid OKLCH value in tokens.ts:42
  Expected: { l: 0-100, c: 0-0.4, h: 0-360 }
  Got: { l: 150, c: 0.5, h: 400 }
```

### Registry Verification Failure

```
[coldlight] Registry verification failed:
  - Kind "panel" has no schema
  - Recipe "panel.glass" requires unknown action "glowTrack"
  - Preset "panel.glass.clean" uses recipe "panel.metal" not allowed for kind "panel"
```

### Tailwind Content Warning

```
[coldlight] Tailwind content missing: packages/coldlight/recipes/**/*.ts
[coldlight] Recipe classes will not be generated!
```

---

## CI Integration

### Build-Time Verification

```typescript
// In build mode, plugin fails hard on errors
if (process.env.NODE_ENV === "production") {
  if (verificationErrors.length > 0) {
    throw new Error(`Registry verification failed:\n${verificationErrors.join("\n")}`);
  }
}
```

### Pre-Commit Hook

```bash
# .husky/pre-commit
pnpm ds:tokens:build || exit 1
pnpm tsx scripts/dev/design/verify-registries.ts || exit 1
```

---

## Plugin Options

```typescript
interface ColdlightPluginOptions {
  // Path to tokens source
  tokensPath?: string; // default: "packages/coldlight/tokens/tokens.ts"

  // Enable/disable virtual modules
  virtualModules?: boolean; // default: true

  // Strict mode (fail on any warning)
  strict?: boolean; // default: false in dev, true in prod

  // Watch mode configuration
  watch?: {
    tokens?: boolean; // default: true
    recipes?: boolean; // default: true
    taxonomy?: boolean; // default: true
  };
}

// Usage in vite.config.ts
import { coldlight } from "./vite-plugins/coldlight";

export default defineConfig({
  plugins: [
    sveltekit(),
    coldlight({
      strict: process.env.NODE_ENV === "production",
    }),
  ],
});
```

---

## Integration with Existing Pipeline

### vite.config.ts

```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { coldlight } from "./vite-plugins/coldlight";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    coldlight(),
  ],
});
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "ds:tokens:build": "tsx scripts/dev/design/ds-tokens-build.ts",
    "ds:tokens:watch": "nodemon --watch packages/coldlight/tokens/tokens.ts --exec 'pnpm ds:tokens:build'",
    "ds:verify": "tsx scripts/dev/design/verify-registries.ts"
  }
}
```

---

## Summary

| Responsibility | Action |
|----------------|--------|
| Token generation | Watch + export + SD4 build |
| Registry verification | Kinds, recipes, presets, actions |
| Tailwind coverage | Verify content includes recipes |
| Virtual modules | Provide registry data to VPB |
| HMR/reload | Full reload for tokens, HMR for registries |
| CI blocking | Fail builds on verification errors |

---

**This is the canonical Vite plugin specification.**
