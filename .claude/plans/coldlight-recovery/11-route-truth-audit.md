# 11 — Route-truth audit: why chat + routes render broken (2026-07-14)

> Evidence pass behind `10-app-truth-recovery.md`. Three parallel read-only audits
> (route map · chat window · dashboard sizing) on HEAD `ad26270e`, merged here with
> file:line for every claim. FACTS + root-cause synthesis; fixes live in the 10-plan
> phases and the 09 slice family. Companion: `00-census-refresh-2026-07-14.md`
> (design-surface census, same day).

## §1 Root-cause synthesis (five mechanisms explain the visible wreckage)

1. **Connection state never reaches `connected`, and most surfaces don't even read it.**
   `clyffyConnection` defaults `{state:"disconnected"}` → `tier === "tier1"`
   (`connection.state.svelte.ts:36,51-53,66-68`), so every badge shows Standalone until a
   live event arrives. Confirmed readers: StatusBar (:34,52), TopBar (:28,36), chat Frame
   (:21,32). The main dashboard reads NO connection state at all — its "Clyffy Control"
   gauge is CPU usage relabeled (`devpulse.service.ts:93-98`, label:"CPU").
2. **Pre-severance hardware tiering still gates the AI layer.** "CPU only — no discrete
   GPU detected" = `VramBar.svelte:31` off `hardwareState.hasGpu` (:29); "Minimal" /
   "Micro-models only" = engine `wizard/tier_display.rs:91-92` (TierRole enum :19-34).
   Local-GPU tier, not wire capability, drives the model surfaces.
3. **Two windows point at routes that do not exist.** `WindowRole::ConnectomeViewer` →
   `/connectome` and `WindowRole::ModelLoader` → `/model-loader` (`window/types.rs:97-98`)
   have NO route folders. Chat's topbar buttons open both (`Frame.svelte:46-52`) →
   blank windows. Capabilities mismatch compounds it: `capabilities/default.json:5`
   grants `cortex-viewer` (a label never created) while the real label
   `connectome-viewer` (`types.rs:34`) is ungrances; `devforge` label absent entirely.
4. **Chat is double-gated by stale wiring.** Active project = `recentProjects[0]`
   (`chat.state.svelte.ts:43-45`), NOT the projects SSOT (`projectsState.activeProject`,
   used by `/devpulse/projects` `+page.svelte:31`) → red "No active project" while a
   project may be active. All send paths short-circuit on null pid
   (`chat.state.svelte.ts:69,88`; `chat.service.ts:37,47`). Cortex branding
   (`Frame.svelte:58`, `CortexMemoryStrip.svelte:14`) is the unexecuted B8 purge.
   CortexMemoryStrip hardcodes 5 of 6 memory dots to `active={false}` (:16-21).
5. **Sizing "ruined" = three stacked mechanisms, none of them mysterious.**
   (a) chat-tiny: `tauri_plugin_window_state` registered with defaults and no
   per-window filter (`lib.rs:685-687`) restores stale geometry over the computed
   0.45×0.8 fraction — chat CSS itself statically resolves full-window
   (`ChatFrame.svelte:64-82` w/ all-`display:contents` ancestors).
   (b) density: the most-used font sizes are emitted CONSTANTS
   (`typography.css:8-10` — 2xs/xs/sm) and devtools grids are fixed rem
   (`(devtools)/devtools/+page.svelte:561-599` minmax(14rem/18rem,1fr)); on a wide
   display everything holds min size while tracks stretch.
   (c) fluid system split-brain: spacing tokens are cqi with micro slopes saturating
   at fixed maxima (`spacing.css:14-35`), larger type is vw, `FLUID_*` presets have
   zero consumers, the devtools container seam has zero cqi consumers, and
   `.shell-root` (the directive's anchor) exists only inside the wizard overlay.

## §2 Route inventory (SvelteKit groups: (app) / (chat) / (devtools); SPA-only, `+layout.ts:2`)

| Route | Purpose | Window |
|---|---|---|
| `/` | redirect → /devpulse (`+page.ts:13`) | main |
| `/devpulse` | DevPulseDashboard (`(app)/devpulse/+page.svelte:8-11`) | main |
| `/devpulse/{community,models,projects,settings,stats}` | sub-surfaces (headers at each `+page.svelte`) | main |
| `/clyffy` `/devforge` `/latest` `/overmind` `/ui-demo` `/wiredfront` `/profile` | dashboards / feature mounts | main |
| `/chat` | ChatRoot via (chat)/+layout ChatShell (`(chat)/chat/+page.svelte:5-8`) | chat |
| `/devtools` + 23 leaf routes + `/devtools/runtimes` + `/logs` | registry-driven devtools | devtools |
| `/connectome` | **DOES NOT EXIST** — demanded by `types.rs:97` | connectome-viewer |
| `/model-loader` | **DOES NOT EXIST** — demanded by `types.rs:98` | model-loader |

Registry↔route orphans: `mongodb` registry entry (registry.ts:151-160, status planned) has
no route folder; `cortex` is status:"planned" yet its route exists AND renders
(`cortex/+page.svelte:6-9`). `/devtools`, `/devtools/runtimes`, `/logs` are intentional
non-registry routes. Other 22 leaves match 1:1.

## §3 Window creation table

| Label | Route | Default | Min | Notes |
|---|---|---|---|---|
| main | /devpulse | 1280×800 | 900×600 | tauri.conf.json:13-25 (only static window) |
| chat | /chat | 960×720 (frac 0.45×0.8) | 640×520 | types.rs:33,46,58,72,84,96; auto-opens post-boot (+layout.svelte:155-172); always-on-top :116 |
| connectome-viewer | /connectome (missing) | 600×450 | 480×360 | types.rs:34,47,59,85,97 |
| model-loader | /model-loader (missing) | 700×500 | 560×420 | types.rs:35,48,60,86,98 |
| devtools | /devtools | 720×560 | 600×440 | types.rs:36,49,61,87,99 |
| devforge | external REH URL | 1400×900 | 960×600 | devforge/window.rs:42-49,144-151; absent from capabilities |

Capability grant mismatch: `capabilities/default.json:5` = ["main","chat","devtools",
"cortex-viewer","model-loader"] — `cortex-viewer` never created; `connectome-viewer` +
`devforge` ungran­ted. Window-state persistence: `lib.rs:685-687` default StateFlags,
no filter (the chat-tiny mechanism). Hotkey doc drift: devtools header says Ctrl+Shift+Q
(`+page.svelte:4`) while Rust binds Ctrl+Shift+Z (`window/mod.rs:156`, `types.rs:23`).

## §4 String-origin table (operator-visible wreckage → source)

| String | Origin | Class |
|---|---|---|
| "Clyffy Chat" (title) | window/types.rs:45 | Rust |
| "DEVPULSE" hub label | Frame.svelte:57 ← global.svelte.ts:4 default "devpulse" | dynamic |
| "CORTEX MEMORY" (header) | Frame.svelte:58 → ChatTopBar:59 | literal (B8 target) |
| "CORTEX MEMORY" (strip) | CortexMemoryStrip.svelte:14 | literal (B8 target) |
| "AI: Standalone" | Frame.svelte:66 (gate :65); TopBar.svelte:128 (gate :116); StatusBar.svelte:127 ternary | literals |
| "No active project — open a project from the DevPulse hub." | chat.state.svelte.ts:53 (set :51), rendered ChatStream.svelte:39-40 | literal; wording variants at chat.service.ts:37,47 + ProjectSwitcher.svelte:100 + projects/+page.svelte:41 |
| "CPU only — no discrete GPU detected" | VramBar.svelte:31 (gate :29 !hardwareState.hasGpu) | literal |
| "Minimal" / "Micro-models only" | engine wizard/tier_display.rs:91-92 | Rust SSOT |
| "CPU Mode / Slower but works" | tier_display.rs:96-100 | Rust |
| "Memory orchestration live/· cross-sensor" | LiveSubsystemStrip.svelte:105,335 | literals |
| DEV/PLAN/IMG/GEN tabs | ChatModeSelector.svelte:10-13 | literals |
| Export/Export all/Delete session/Clear all | ChatActionsMenu.svelte:26,36,38,39 | literals |
| "Type a message..." | ChatFooter.svelte:87 | literal |

## §5 Chat window map (tree + gates + dead space)

Tree: chat window → root +layout (auth gate :215) → (chat)/+layout ChatShell →
`Frame.svelte` → ChatFrame(:55) [grid rows topbar/dashboard/footer] → ChatTopBar(:56) +
ChatDashboard(:77) → page ChatRoot → DynamicBackground(:48) + ChatModeSelector(:50-51) +
ChatActionsMenu(:56) + CortexMemoryStrip(:58) + ChatSessionList/ChatStream(:59-61) +
ChatComposer(:63).

- **Dead footer band**: ChatFrame reserves a 3.5rem `footer` grid row
  (`ChatFrame.svelte:67,69-72`; token `chat.css:16-17`) that Frame NEVER fills — the
  composer lives inside the dashboard subtree (ChatRoot:63). Permanent empty strip.
- Gates: no-project (chat.state:43-55 via `recentProjects[0]` — NOT projectsState SSOT);
  no-brain send error (chat.state:91-95); minimized collapse (Frame:34-36,
  ChatFrame:90-99); auth pending (root layout:215).
- Connection: Frame subscribes live (`:32`; catch-up + event stream
  connection.state.svelte.ts:103-126). Badge correct-but-default until an event.
- cqi: exactly ONE consumer in the whole chat tree (ChatSessionList.svelte:13
  `w-[clamp(8.5rem,24cqi,13rem)]`); container = `.chat-frame` (ChatFrame:80-81).
- Tesla naming: "teleautomaton" appears in ZERO code (one prose hit,
  LIBSQL_TO_TURSO_MIGRATION.md:356); actual vocabulary = Chat/ChatFrame/ChatRoot.
- Old floating chat CSS exists ONLY as text inside layouts/chat/README.md:478-508
  (SCAFFOLD doc, 2026-01-22) — not loaded; do not chase it.

## §6 Sizing / resolution mechanics (full detail)

- Anchor chain (devtools example): app.html:120 display:contents → root layout
  ColdLightProvider display:contents (:190-196) → (devtools)/+layout `h-screen w-screen`
  + container `devtools` (:10) → ServiceDevtoolShell `h-full flex-col` (:297-298) →
  `main.flex-1 overflow-y-auto p-4` (:457). Chain intact; blank-space cases are sparse
  content in plain block-flow snippets (SlotsDevtool status root `space-y-4` :471, no
  grow) — runtime confirm pending.
- 9 container-type declarations total (6 Frame zones, devtools layout, wizard
  `.shell-root` [the ONLY one], `.chat-frame`). Frame ROOT deliberately container-free
  (Frame.svelte:48-55; S1-FLUID-TOKENS.md:534 explains why: fixed overlays must keep the
  viewport as containing block).
- Token regimes: spacing/size = cqi clamps w/ micro slopes + fixed maxima
  (spacing.css:14-35; e.g. --padding-md-x total travel ≈6px); type base+ = vw
  (typography.css:11-17); type 2xs/xs/sm = CONSTANTS (:8-10, comments claim fluid);
  components.generated.css cqi count = 0; sd.config.mjs:363-369 basis rule.
- Devtools: `devtools` container seam has ZERO cqi consumers (grep verified; matches
  coldlight-fubar-audit.md:71); overview grids fixed rem (devtools/+page.svelte:561-599);
  shell chrome 0% fluid (layout.css:7-11).
- DPI: no zoom/setZoom/scale anywhere; scale_factor used only for monitor-size math
  (window/mod.rs:49); viewport meta standard (app.html:5); no root font-size override
  (app.css:19-28).
- Hardcoded route-level dims: logs `max-h-[70vh]` (+page.svelte:88), latest
  `min-h-[12rem]` (:60), BootOverlay `min-w-[320px] max-w-[400px]` (:207) — px caps.

## §7 Remaining per-route findings

- `/devpulse` dashboard: subscribes hardwareState (:51) + devpulseState (:54-58); NO
  clyffyConnection; widget titles hardcoded ("Clyffy Control" :84 etc.); loading/error
  states :61-72; "Waiting for health data..." :287.
- `/devpulse/community`: counts are "static zeros today" (header :11-13).
- Devtools dashboard: lazy per-tab loads (:225-235); EXTERNAL_WINDOWS hardcoded to the
  two missing-route windows (:63-76); LiveSubsystemStrip cortex vocabulary + hard
  `window.location.assign` (:211).
- Root layout auto-opens chat post-boot (+layout.svelte:155-172) — the broken window
  is in the operator's face on every boot.
- Rust "Standalone …Tier-2" doc comments across ~10 command modules are docs, not UI.

## §8 UNVERIFIED (merged across all three audits)

1. Slot Orchestrator blank-area runtime cause (static analysis points at sparse
   block-flow content; needs running app — /coldlight-verify).
2. Chat-tiny final confirmation requires deleting/inspecting the persisted window-state
   file at runtime (mechanism cited from lib.rs:685-687 + prior audit :67).
3. OS display-scale factor (density magnitude) — runtime state.
4. Full clyffyConnection importer census beyond the three confirmed readers.
5. cortex vocabulary full inventory (~80 hits; representative list here).
6. theme/spacing.css liveness (byte-dup of primitives copy).
7. `chat.css:16-19` static-chrome citation re-verified only for :16-17 this pass.
