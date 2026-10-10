> # ☠️ SUPERSEDED — DO NOT EXECUTE
>
> **This sprint doc is DEAD.** The model-loader / setup-wizard work has been
> re-chartered under `POAM-MODEL-LOADER-WIZARD.md`, which embeds the 10
> Commandments verbatim as the workflow SSOT.
>
> - Do not plan against this file.
> - Do not cite "DONE" items below as evidence of working behavior.
> - If you need historical context, read this as archaeology, not authority.
>
> **Go to:** `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# Research: Boot Setup Wizard — Three Broken Systems

**Date**: 2026-04-02
**Sprint**: SPRINT-BOOT-WIZARD-FIX
**Status**: COMPLETE

## SSOT Map

| Concern | SSOT File | Status |
|---------|-----------|--------|
| Hardware metrics struct | `kernel/model-loader/src/hardware/metrics.rs:7-45` | Working |
| GPU collection (NVML) | `kernel/model-loader/src/hardware/metrics.rs:139-197` | Silent fail |
| Tauri HW command | `src-tauri/src/commands/models/mod.rs:111-133` | Working |
| Frontend HW rune | `domains/app/models/runes/hardware.runes.svelte.ts` | Working |
| Frontend HW service | `domains/app/models/services/hardware.service.ts` | Working |
| HF search (Rust) | `kernel/model-loader/src/models/search.rs:71-144` | Working (reqwest + rustls) |
| HF search (Tauri cmd) | `src-tauri/src/commands/models/mod.rs:309-345` | Registered, working |
| HF search (frontend) | `domains/app/models/runes/search.runes.svelte.ts` | Working |
| ModelSearch UI | `domains/app/models/components/ModelSearch.svelte` | Working but error invisible |
| Style presets JSON | `scripts/build/styledictionary/tokens/src/style-presets.json` | 4210 lines, 42 presets |
| Kind-families generator | `scripts/build/styledictionary/derive-kind-families.mjs` | Working |
| Kind-families output | `src/lib/design/renderforge/generated/kind-families.ts` | 48 entries, missing wizard kinds |
| Intent map | `src/lib/design/visual/intent-map.ts` | Working (14 mappings) |
| renderForge resolver | `src/lib/design/renderforge/render.ts` | Working, falls back to DEFAULT_FAMILIES |
| BootOverlay | `src/lib/layouts/app/BootOverlay.svelte` | 400px constraint, no scroll |
| BootSetupWizard | `domains/app/models/components/BootSetupWizard.svelte` | Functional, visually broken |
| VramGauge | `domains/app/models/components/VramGauge.svelte` | Functional, unstyled |
| ClyffyNarration | `domains/app/models/components/ClyffyNarration.svelte` | Functional, invisible |

## Findings

### Problem 1: GPU Not Detected

**Root cause**: `Nvml::init()` fails silently at `metrics.rs:143-147`. The error is logged at `tracing::debug!` level — not visible in compact stderr output (which shows INFO+). The feature flag chain is correct: `inference` → `model-loader` → `nvml` is compiled. NVML just can't init.

**Likely reasons**: NVIDIA driver not providing nvml.dll in PATH, or driver version mismatch with nvml-wrapper crate expectations. On Windows, nvml.dll lives in `C:\Windows\System32\` but the app may not find it.

**Fix needed**: Surface the NVML error at `warn!` level (not `debug!`), and propagate GPU detection failure to the frontend so it shows *why* — "NVML driver not found" vs "No NVIDIA GPU" are different problems.

### Problem 2: HuggingFace Search Not Working

**Root cause**: Unclear — the entire chain is wired correctly. The reqwest client uses `rustls-tls` (not native-tls), 15s timeout, correct HF API URL. Possible causes:
- Network timeout (15s may be too short behind corporate proxy)
- rustls not negotiating TLS with HF servers
- The error IS being shown but ClyffyNarration + error styling is invisible (see Problem 3)

**Need from owner**: What error message appears when searching? If no error visible, that confirms it's the styling problem masking the error state.

### Problem 3: All 5 Wizard Kinds Orphaned from Design System

**Root cause**: `style-presets.json` has zero entries for:
- `boot-wizard-*`
- `boot-wizard-btn-*`
- `boot-wizard-knowledge-*`
- `clyffy-narration-*`
- `vram-gauge-*`

The `derive-kind-families.mjs` script derives KIND_FAMILIES from style-presets.json. No preset entries → no kind-families entry → renderForge falls back to `DEFAULT_FAMILIES = ["surface", "text", "frame"]` and generic `--preset-{resolved}` vars. The components get shapes but no identity.

**Resolution chain for `renderForge({ kind: "boot-wizard", preset: "primary" })`**:
1. `resolveIntent("primary")` → `"glass-deep"` (from intent-map.ts)
2. Build var: `var(--style-boot-wizard-glass-deep-background-color, var(--preset-glass-deep-background-color, transparent))`
3. `--style-boot-wizard-glass-deep-*` → NOT IN CSS → skip
4. `--preset-glass-deep-*` → EXISTS → used
5. Result: generic glass-deep preset applied to everything uniformly

The components DO render, but they all look identical — no hierarchy, no distinction between wizard chrome, CTA buttons, narration bubbles, and gauges.

### Problem 4: Layout Cramped

**Root cause**: BootOverlay line 109: `max-w-[400px]`. The boot subsystem list is fine at 400px. But when the wizard takes over (line 192-195), the entire BootSetupWizard including VramGauge, recommendations, ModelSearch, and ClyffyNarration all stack vertically in that 400px pipe with no scroll constraint.

## Anti-Pattern Risks

1. **Don't add per-kind overrides to render.ts** — the resolution chain is correct, the presets are missing
2. **Don't hardcode colors in components** — author DTCG tokens in style-presets.json
3. **Don't add a third layout breakpoint** — the wizard needs a wider container, not responsive breakpoints
4. **Don't mock GPU data** — fix the actual NVML error surfacing

## Files Referenced

- `kernel/model-loader/src/hardware/metrics.rs`: GPU detection + NVML init
- `scripts/build/styledictionary/tokens/src/style-presets.json`: DTCG token source
- `scripts/build/styledictionary/derive-kind-families.mjs`: Kind→family derivation
- `src/lib/design/renderforge/render.ts`: Pure resolver (20-axis)
- `src/lib/design/renderforge/generated/kind-families.ts`: AUTO-GENERATED, rebuilt by pipeline
- `src/lib/design/visual/intent-map.ts`: Semantic→preset mapping
- `src/lib/layouts/app/BootOverlay.svelte`: Overlay container
- `domains/app/models/components/BootSetupWizard.svelte`: Wizard steps
- `domains/app/models/components/VramGauge.svelte`: GPU gauge
- `domains/app/models/components/ClyffyNarration.svelte`: Clyffy bubble
- `domains/app/models/components/ModelSearch.svelte`: HF search
