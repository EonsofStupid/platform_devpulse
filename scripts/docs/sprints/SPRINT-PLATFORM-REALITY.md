# SPRINT: Platform Reality

**Date**: 2026-03-07
**Research**: `SPRINT-PLATFORM-REALITY.research.md`
**Status**: COMPLETE
**Verification**: `pnpm svelte-check` after every task

---

## Prerequisites
- [x] Full audit completed (this session)
- [x] Research document written with raw notes
- [x] Parking lot: LibSQL confirmed as local store (PostgreSQL remote only for license activation)

---

## Phase 1: Fix Broken Wiring

### Task 1.1: Load all 28 component recipes (was 34 — 17 dirs empty)
Create barrel file, add side-effect import to design/index.ts.

- [x] READ: `design/index.ts`
- [x] READ: `recipes/components/` directory listing — 28 dirs with index.ts, 17 empty
- [x] CREATE: `recipes/components/index.ts` — side-effect imports for all 28 recipe dirs
- [x] EDIT: `design/index.ts` — add `import "./recipes/components/index.js";`
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 1.2: Consolidate boot-labels SSOT
Delete FRIENDLY_NAMES from platformState. Rewrite boot-labels.ts with Lucide components + correct labels.

- [x] READ: `sys/boot/boot-labels.ts`
- [x] READ: `sys/runes/platformState.svelte.ts`
- [x] REWRITE: `sys/boot/boot-labels.ts` — Lucide component map (Settings/Database/BarChart3/Brain/Zap/Radar), correct labels (Graph store -> "Cortex"), RRO placeholder, dev labels (LibSQL, SurrealDB, DuckDB, Moka)
- [x] EDIT: `sys/runes/platformState.svelte.ts` — deleted FRIENDLY_NAMES, imported friendlyLabel from boot-labels
- [x] VERIFY: `pnpm svelte-check` — 0 source errors
- [x] FIX: lucide-svelte type mismatch — used `typeof Settings` as LucideIcon type alias

### Task 1.3: Wire StatusBar icons
StatusBar uses sub.friendlyName text. Add Lucide icon component per subsystem.

- [x] READ: `layouts/app/StatusBar.svelte`
- [x] EDIT: `layouts/app/StatusBar.svelte` — imported getIcon/devLabel from boot-labels, added `<svelte:component>` icon rendering, shows dev labels in DEV_MODE
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

**--- CHECKPOINT 1: PASSED ---**

## Phase 2: Hub Dashboards

Consistent pattern for every hub. Grid 12-col. Icons from lucide-svelte. Widget components from ColdLight blocks. Every widget title gets an icon.

### Prerequisite: Widget icon prop
- [x] EDIT: `blocks/widgets/types.ts` — added `icon?: Component<Record<string, unknown>>` to WidgetProps and WidgetHeaderProps
- [x] EDIT: `blocks/widgets/Widget.svelte` — destructure icon, pass to WidgetHeader
- [x] EDIT: `blocks/widgets/WidgetHeader.svelte` — render icon via `<svelte:component>` before title
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 2.1: OverMind hub
- [x] REWRITE: 6 widgets (Status/Activity, Playground/FlaskConical, Experiments/TestTube2, Sandbox/Box, Training/GraduationCap, Learning/BookOpen)
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 2.2: WiredFront hub
- [x] REWRITE: 8 widgets (Storage/HardDrive, Screenshots/Camera, Video/Video, Audio/AudioLines, Image/ImagePlus, Streaming/Radio with Twitch+YouTube+AngryVibers tabs, Notes/StickyNote, Voice/Mic)
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 2.3: DevForge hub
- [x] REWRITE: 5 widgets (Build Pipeline/Hammer, CI-CD/GitBranch, Environments/Server with dev+staging+prod, Node CLI/Terminal, Packages/Package)
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 2.4: Maestro hub
- [x] REWRITE: 5 widgets (Orchestrator/Brain, Minion Fleet/Users, Knowledge Base/BookOpenCheck with RAG+CAG+HyDE tabs, Inference Cache/Database, Context Window/Layers). IP labels gated behind flags.DEV_MODE.
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 2.5: DevPulse hub icons
- [x] EDIT: Added icons to all 6 existing widgets (Gauge, Activity, TrendingUp, BarChart3, HeartPulse, FolderGit2)
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

**--- CHECKPOINT 2: PASSED ---**

## Phase 3: Visual Token Boost

### Task 3.1: Boost glow values in tailwind.css
- [x] EDIT: `tokens/tailwind.css` — all 6 glow colors boosted: inner 20px/0.6 -> 30px/0.7, outer 50px/0.25 -> 60px/0.35
- [x] REBUILD: `pnpm ds:tokens:build` — success
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

### Task 3.2: Boost frame/border values in token-categories.ts
- [x] EDIT: `registry/token-categories.ts` — soft 0.10->0.25, hard 0.20->0.40, crisp 0.30->0.45, glow border 0.6->0.7 + frame-glow 15px/30px->20px/40px, accent-teal/purple border 0.55/0.50->0.65 + frame-glow 10px->20px
- [x] REBUILD: `pnpm ds:tokens:build` — success
- [x] VERIFY: `pnpm svelte-check` — 0 source errors

**--- CHECKPOINT 3: PASSED ---**

## Final Verification
- [x] `pnpm svelte-check` — 0 source errors (only pre-existing dist/ artifacts)
- [ ] `pnpm dev` — all 5 hub dashboards render with icons (needs visual confirmation)
- [x] StatusBar shows correct labels with icons (code verified)
- [x] All 28 component recipes loaded via barrel import

## Decisions
- [2026-03-07] Relational store: LibSQL locally, PostgreSQL remote for license activation only. Dev label = "LibSQL".
- [2026-03-07] 28 recipe dirs have index.ts (not 34 — 17 dirs are empty placeholders).
- [2026-03-07] Glow values in tailwind.css (not token-categories.ts) — token-categories references CSS vars.
- [2026-03-07] LucideIcon type = `typeof Settings` (SvelteComponentTyped class), not `Component` from svelte.
