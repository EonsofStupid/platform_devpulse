# BUILD FIX PLAN

## ROOT CAUSE
Tailwind CSS v4 uses **automatic content detection** - it scans ALL files in the project.
The `tailwind.config.ts` content paths are **IGNORED** in v4.
Tailwind is scanning `lib/design/tokens/tokens.ts` (922 lines) and finding something that produces code point `5703710` (invalid unicode).

## THE FIX
Use `@source` directives in `app.css` to explicitly tell Tailwind v4 which directories to scan.

---

## EXACT FILE CHANGES

### 1. app.css (REPLACE ENTIRE FILE)

```css
@import "tailwindcss";

@source "./App.svelte";
@source "./routes";
@source "./lib/layouts";
@source "./lib/domains";
@source "./lib/sys";

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; }
```

### 2. Files already stubbed (DONE)
- `lib/design/tokens/tokens.css` → STUBBED
- `lib/design/tokens/types.ts` → STUBBED
- `lib/design/tokens/tailwind.preset.ts` → STUBBED
- `lib/design/tokens/.tokens.gen.mjs` → STUBBED
- `lib/design/tokens/index.ts` → STUBBED
- `lib/design/recipes/css/surfaces.gen.css` → STUBBED
- `lib/design/vite-plugin.ts` → STUBBED

### 3. vite.config.ts (ALREADY DONE)
- coldlight() removed from plugins

### 4. tailwind.config.ts (KEEP AS-IS)
- Content paths don't matter in v4 - @source in CSS overrides

---

## REMAINING ISSUE AFTER BUILD FIX

```
Failed to resolve import "$app/stores" from "lib/layouts/app/Sidebar.svelte"
```

This is a SvelteKit-specific import. Since this is a Tauri app (not SvelteKit), `$app/stores` doesn't exist.

### Fix for Sidebar.svelte
Remove or stub the `$app/stores` import.

---

## EXECUTION ORDER

1. Update app.css with @source directives
2. Fix Sidebar.svelte $app/stores import
3. Run `pnpm build`

---

## VERIFY SUCCESS

```bash
pnpm build
# Should complete without errors
```
