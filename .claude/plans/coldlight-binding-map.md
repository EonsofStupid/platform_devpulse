# ColdLight Consumption Binding Map — Phase 3 execution spec

**Date:** 2026-07-11 (Pass 3 of the pre-execution passes) · **Parent plan:** `coldlight-fubar-audit.md`
**Live counts at authoring:** 245 palette-hue reaches / 49 files · 98 raw `--color-` reaches / 22 files · 82 consumed-but-undefined vars (post tool-fix baseline).

## The headline

The codebase already contains the correct pattern, applied inconsistently: **component-scoped accent indirection** — the owner component binds a palette hue ONCE (`style="--store-accent: var(--accent-purple-main)"`), descendants consume the local var. Working exemplars: `--store-accent`, `--engine-accent`, `--slot-accent`, `--orb-accent`, plus three mis-namespaced ones (`--accent-section-*`, `--accent-tile-*`, `--accent-service-*`) that work but squat in the global `--accent-` namespace.

**Live bugs found (render wrong TODAY):** malformed hue reaches missing the `-main|-glow|-fill` suffix fall through to raw CSS keyword fallbacks — `var(--accent-purple, mediumpurple)` (SurrealdbHero), `var(--accent-cyan, cyan)` (LibsqlHero), `var(--accent-amber, gold)` (DuckdbHero), `var(--accent-cyber, ...)` (ReasoningTopology/HealthSignal/SwapDialog), and the `--store-accent`/`--accent` defaults pointing at nonexistent `--accent-electric`/`--accent-amber`.

## The rules (lintable)

For every `var(--accent-<x>)` / `var(--color-<x>)` in a component or route:

1. **Palette-API surface?** (`theme/`, `styles/`, `generated/`, `resolve-svg-macro.ts`, `visual/presets/*`, `Stat.svelte`, `TokenDebugOverlay`) → ALLOWED; fix only arbitrary *defaults* (teal → primary).
2. **STATE/INTENT?** (ok, error, destructive, warn, success, info, disabled, primary action) → MUST be a role var `--accent-{primary|secondary|danger|success|warning|muted}-{main|glow|fill}`. Never a hue name.
3. **IDENTITY?** (SurrealDB=purple, DuckDB=gold, libSQL=cyan, Claude brand, per-slot anatomy, feed categories, route glow) → legitimate palette binding, but through a **component-scoped `*-accent` local** — the hue name appears once, in the owning component/data map.
4. **Otherwise** (teal-because-default) → `--accent-primary-*`.
5. **Hygiene:** hue reaches MUST carry `-main|-glow|-fill`; bare `--accent-<hue>` or invented suffixes (`-soft`, `-strong`) are invalid; canonical names only (`--signal-error` not `--signal-error-main`, `--text-muted` not `--text-tertiary`).

Lint rules:

- **R1** — `var(--accent-<any of 16 hues>-…)` disallowed in `**/*.svelte` unless the same file defines a `*-accent` local on the element (allowlist: Stat.svelte, resolve-svg-macro.ts, visual/presets/*, debug/*).
- **R2** — `var(--accent-<hue|role>)` with no `-{main|glow|fill}` suffix → ERROR.

## Rename/alias actions (small, high-leverage)

| Action | Detail |
| --- | --- |
| Rename indirections out of the global ns | `--accent-section-*` → `--section-accent-*` (Section.svelte + devtools/+page), `--accent-tile-*` → `--tile-accent-*` (SubsystemTile), `--accent-service-*` → `--service-accent-*` (ServiceDevtoolShell + ~9 service devtools), `--accent` → `--pulse-accent` (LiveActivityPulse/ModelEventCard) |
| One true phantom role | `--accent-positive-main` → alias of `--accent-success-main` (or rebind the 3 consumers: KnowledgeCard, IntelligenceMemoryStream, Sidebar) |
| New locals for identity files without one | `--reasoning-accent` (reasoning subtree), `--provider-accent` (ClaudeDevtool), `--devtool-accent` (VisionDevtool), `--feed-accent` (CommunityFeedList) |
| Fix malformed defaults | every `--accent-<hue>` fallback gains `-main`; `--accent-electric`/`--accent-amber` defaults → `--accent-electric-main`/`--accent-gold-main` |

## Wrong-named token renames (part of the undefined-82)

Text: `--text-default`→`--text-primary` · `--text-tertiary`→`--text-muted` · `--text-error`→`--signal-error` · `--text-on-accent`→`--accent-fg` · `--text-{base,lg,sm}`→`--font-size-*`.
Surface: `--surface-1`→`--surface-base` · `--surface-2`/`--surface-elevated`→`--surface-raised` · `--surface-muted`→`--surface-subtle` · `--surface-hover`/`--surface-pressed`→`--surface-raised`/`--surface-inset` · `--surface-void`→`--color-void-base`.
Signal: `--signal-error-{main,fill,subtle}`→`--signal-error` · `--signal-warn(-subtle)`→`--signal-warning`.
Scale: `--font-family-mono`→`--font-mono` · `--font-family-sans`→`--font-sans` · `--duration-md`/`--ease-out`/`--z-dropdown`→ scale tokens.
Dead/sandbox (quarantine or delete, do not fix): `ui-demo/Glass*` phantoms, `stories/shards` shadow vars, `--foo` debug placeholder.

## Per-file map (execution order: bugs → renames → role swaps)

### Bucket 1 — role-bound (~95 reaches / ~28 files)

teal-chrome → `--accent-primary-*`: ProjectSwitcher(7), ThreadList, TypingIndicator, EmptyChatState, SessionRow, downloader suite (Overlay/Confirm/Progress/Search/TokenStrip/BundleFileRow/ModelResultCard), DownloadPanel, LatestUpdateCard(blue→primary), Widget, settings/+page(5), runtimes/+page, candle/llama-cpp/ollama devtool chrome, DevtoolLogsTab/HfSearchDialog/RepoDownloadButton, IntelligenceMemoryStream teal(5), Spinner default, BootOverlay teal(4).
Role-specific: DeleteConfirmDialog ember→**danger** · MessageAvatar user→primary/ai→secondary/system→muted · BootOverlay `--accent-red-main`→danger · ProjectReferences gold→warning · DevPulseDashboard status map→success/warning · SuggestionDropdown `--accent-primary`→`--accent-primary-main` · LoginShell purple→secondary · rro.format.ts amber/teal→`--signal-warning`/`--signal-success` · date-fields `--color-red-400`→`--signal-error`.

### Bucket 2 — identity via local var (~90 reaches / ~24 files)

Keep + fix defaults: StoreHeroCard, EmptyStatePoster, EngineFoundationCard, slot-anatomy.ts, AnatomyTile/SaveSlotCard, ClyffyStatusOrb (fold `--color-*` moods into map), roles.ts, models/+page.
Wrap in new local: SurrealdbHero/Devtool (purple), DuckdbHero/Devtool (gold), LibsqlHero/Devtool (cyan), HealthSignal, ReasoningTopology/SwapDialog/RrdDevtool (`--reasoning-accent`), ClaudeDevtool (`--provider-accent`, 16 reaches), VisionDevtool (`--devtool-accent`), SlotsDevtool (via `--slot-accent`), CommunityFeedList (`--feed-accent`), Knowledge{Card,MultipleChoice,Ordering,Term} (via `--accent-strip`), DevPulseDashboard accent loop.
Rename only: Section, SubsystemTile, ServiceDevtoolShell + service devtool consumers (Sts/Stt/Tts/Cortex/Intelligence/Qdrant/rro panels).

### Bucket 3 — api-keep / structural keep (~55 + ~62 reaches)

Stat.svelte (default teal→primary), resolve-svg-macro.ts, visual/presets/chat.ts, svg-accent-defaults.css (default→`--accent-main`), TokenDebugOverlay, DynamicBackground (ambient identity + `--color-void-base` structural), ErrorOverlay (pre-token self-contained), coldlight-shiki-theme.ts (syntax ramps), BootOverlay void.

## Counts (end-state)

Of ~343 audited reaches: **~1/3 collapse to role tokens · ~1/3 identity through `*-accent` locals (pattern exists; extend it) · ~1/3 legitimate structural/API**. The undefined-82: ~12 renames to locals + 1 alias (`positive`→success) + ~40 canonical-name renames + ~25 dead/sandbox deletions + a handful of runtime-set locals (correct as-is).
