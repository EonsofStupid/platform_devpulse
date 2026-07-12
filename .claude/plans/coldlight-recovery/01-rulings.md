# ColdLight Recovery — 01-RULINGS (Pass 2 — DRAFT, awaiting Opus research merge)

> Produced by /coldlight-rulings from 00-census.md (tree 7ba3ad83, census 2026-07-12).
> Structure is decided by exactly ONE party: the operator. Rows marked RULED are
> forced by the locked rules 1–6 with zero judgment; everything else is OPEN and
> waits for the operator's word. NOTHING in this document authorizes a code change.

## The locked rules (operator, 2026-07-12 — every destination must conform)

1. ALL runtime CSS under `styles/` (SD5-emitted layers; rebind in token sources).
2. Base component in its own NAMED folder under the components directory, typed.
3. Variants colocated in that component's folder, typed.
4. NO bucket directories anywhere — `_shared`, `common`, `shared`, `_internal`,
   `utils`-as-bucket, `helpers`, `misc`. Bucket→bucket is FAILURE.
5. `domains/common` is banned from use and is itself dismantled.
6. Tokens bind through the role vocabulary — no raw literals, no keyword fallbacks.

## Section 1 — Destination table

### 1.1 RULED rows (forced by the rules — no judgment)

| Module | Capabilities | Importers | Destination | Rule | Duplicates | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `domains/common/` (empty barrel, 7 lines) | none — zero exports | **0 external** (verified) | **DELETE** | 5 | — | RULED |
| CLAUDE.md devtool-registry path claim | doc | — | correct to `lib/devtools/registry.ts` (census-verified location) | truth | — | RULED |

Dead code confirmed by research (absorb-verify then delete; rule: nothing deletes
before its capabilities are proven absorbed or proven absent):

| Dead item | Evidence |
| --- | --- |
| `utils/ariaAnnounce.ts` | 0 consumers; assertive covered by live-region politeness |
| `utils/idGenPair`, `slotMerge`, `tokenResolve` + 13 more utils exports | 0 consumers each (§2.6) |
| `behaviors/_shared/active-descendant` module | 0 call-sites anywhere (§1.3) |
| `devtools/_shared/SwapPrimaryBrainButton.svelte` | 0 real importers (§1.4) |
| rro `formatBytes` export | 0 consumers (§2.3) |
| `bindings/_shared` `Result` re-export | 0 importers (§1.4) |
| fate of each = operator ruling (deferred ≠ retired) | Q16 |

### 1.2 OPEN rows — destinations pending operator ruling (Opus options being merged)

| Module set | Contents | Importers | Status |
| --- | --- | --- | --- |
| `design/behaviors/_shared/` (9 primitives) | see §1.3 options | 30 import lines / 12 files | **options in §1.3 — operator picks** |
| `design/behaviors/_internal/utils/` (kbd/uid/data-attr) | see §1.3 options | 104 lines / ~59 files | **options in §1.3 — operator picks** |
| `design/utils/` loose roots + 16 dead exports | see §1.3 + §2.6 | cn=228 files; idGen=1; rest 0 | **options in §1.3** |
| `design/components/_base/` | UIBaseProps/UIDef/ArkType base contract | 39 absolute + 10 relative | OPEN Q-BASE (underscore name; content architectural; docs cite "_base: styling contract") |
| `devtools/_shared/` (17 files) | chrome / adapters / domain widgets | 21 refs | **options in §1.4** |
| `devtools/system/datastores/_shared/` | 4 components | 3 store features | **options in §1.4** |
| `devtools/clyffy/reasoning/_shared/` | ReasoningTopology | rrd + rro | **options in §1.4** |
| `sys/bindings/_shared/` | 4 type re-exports | 6 facades | **options in §1.4** |

### 1.4 Devtools/sys destination options — OPEN-B MERGED [opus: purity + precedent research]

**Purity test result (imports of state/IPC/binding types):** of the 17
`devtools/_shared` files — **PURE design-tier:** ServiceDevtoolShell, serviceAccents,
types.ts, DevtoolBentoGrid/Tile, resolve-primary-file, voice-contracts (re-export).
**DOMAIN-coupled:** DevtoolLogsTab, ScopedLogPanel (deprecated), CommandErrorAlert,
DevtoolRefreshButton, HfSearchDialog, RepoDownloadButton, LiveSubsystemStrip,
voice-selection.state. All 4 datastores components are **PURE** (design primitives
in disguise). ReasoningTopology is DOMAIN (reads `rrdState`).

**New facts:** `SwapPrimaryBrainButton` = **DEAD, 0 real importers** (absorb-verify
then delete). `voice-contracts.ts` duplicates `sys/bindings/voice/index.ts` — the
voice facade **already exports the identical 7 types** (dedup #8; 9 consumers
repoint). `Result` in `bindings/_shared` = dead re-export. The cross-devtool NAMED
home does not exist yet — the only prior mechanism was the banned buckets; the
composition contract (LiveSubsystemStrip:11-17) says: pure primitive →
`design/blocks/`, domain composer → devtools-side.

**Homes that already EXIST (no new name needed):**

| Contents | Existing home | Precedent | Blast |
| --- | --- | --- | --- |
| Chrome (shell + accents + types + README) and pure grids/tiles | `design/blocks/devtools/` | blocks colocate types.ts + README (chat/governance/widgets); SubsystemTile lives there now; shell already imports blocks/knowledge | 0 if barrel-preserved, else ~27 |
| HF cluster (HfSearchDialog + RepoDownloadButton + resolve-primary-file) | `domains/app/models/feature/downloader/{ui,util}` | the downloader sub-feature exists with ui/util/data-access; `downloader.state.svelte.ts:67` already names HfSearchDialog | 2 |
| voice-contracts.ts | fold into `sys/bindings/voice/` (identical types already there) | facade convention | 9 |
| bindings/_shared 4 re-exports | inline into each facade from generated bindings (facades already do this for their own types); drop dead `Result` | facade shape | 6 |
| datastores 4 pure components | `design/blocks/` — as a new topic folder (name flagged) or keyed on StoreHeroCard entry like blocks/widgets | blocks/{topic} + widgets entry+parts precedent | 3 |
| ReasoningTopology | Opt-1 split: pure topology → `design/blocks/devtools/`, thin rrdState binder stays reasoning-side (exact SubsystemTile/LiveSubsystemStrip pattern) · Opt-3 fold into `rrd/ui/` as owner (rro imports across) | composition contract | 2 |

**Homes requiring the operator to NAME a new boundary (flagged, not proposed):**
domain-coupled log/error/refresh adapters (devtools-root concept folder or sys-side);
LiveSubsystemStrip (dashboard-only — devtools dashboard folder vs route-colocated);
voice-selection.state (`sys/data-access/<name>` — precedent: sys/data-access/rro+rrd
hold exactly this kind of cross-consumer state).

### 1.3 Researched destination options — OPEN-A MERGED [opus: tree-precedent research]

**Ground facts:** the 9 primitives already match the behavior triad shape
(`types.ts` + `{name}.svelte.ts` + `index.ts`) used by `interaction/focus`,
`keyboard-handler`, `locale`, `filter`. The repo's OWN doc
(`design/docs/BEHAVIORS-ORPHAN-HOOKS.md:11`) already assigns this class to
`behaviors/interaction/**` (it listed `interaction/**` and `_shared/**` as one
class). Single-concern TOP-LEVEL categories are also established precedent
(`behaviors/locale/`, `behaviors/filter/`). No doc blesses `_shared`/`_internal`
as permanent. Both bucket barrels have ZERO consumers. **New fact:
`active-descendant` has zero call-sites anywhere — orphaned module.**

**SET 1 — the nine primitives (30 import lines / 12 files):**

| Option | Destinations | Precedent | Blast | Trade-off |
| --- | --- | --- | --- | --- |
| 1-A | `behaviors/interaction/{name}/` ×9 | ORPHAN-HOOKS doc names interaction/** for this class; member shape matches | 30 lines, segment swap only, depth unchanged | "interaction" broadens from pointer/focus micro-behaviors to ARIA patterns |
| 1-B | `behaviors/{name}/` ×9 top-level | locale/ + filter/ are single-concern top-level | 30 lines + ~4 internal depth edits | 9 new top-level folders; no concern grouping |
| 1-C | by concern: overlays/{dismiss,escape,focus-trap,scroll-lock,presence}, navigation/{roving,typeahead,active-descendant}, display/live-region | each category owns same-concern hooks | 30 lines, varied depths | cross-consumed primitives (presence, roving) create sideways category imports — the thing pooling avoided |

**SET 2 — the three leaf utilities (104 lines / ~59 files):**

- **kbd.ts (31 lines):** K-A colocate into `interaction/keyboard-handler/` (owns the
  keyboard concern) · K-B split — constants→keyboard-handler, RTL dir helpers→`locale/`
  (locale ALREADY owns direction; kbd re-declares locale's `Direction` type — a type
  duplicate retired by this option) · K-C own leaf `interaction/kbd/` (two keyboard
  homes result).
- **uid.ts (49 lines) + idGen dedup:** U-A fold uid into `design/utils/idGen.ts`
  (FLAGGED: utils/ is itself bucket-named — bucket→bucket) · U-B single named
  folder as SSOT, fold idGen's 1 consumer in (**needs operator naming** — no
  existing non-bucket home owns id-generation).
- **data-attr.ts (24 lines, behavior-layer consumers only):** D-A `components/_base/`
  (render-contract precedent; but dependency points sideways from behaviors) ·
  D-B `design/utils/` (FLAGGED bucket→bucket) · D-C named leaf in the behavior
  layer (**needs operator naming**).

**live-region SSOT (RULED direction, home follows Set-1 pick):** SSOT = the
`live-region` module (2 consumers: progress + chat.state). `ariaAnnounce` is DEAD
(0 consumers) and its only distinct feature (assertive) is already covered by
live-region's politeness param — absorb-verify then delete, zero repoints.

## Section 2 — Duplicate SSOT directions

### 2.1 RULED direction (documented in-repo)

| Concern | Candidates | SSOT direction | Absorb list | Confidence |
| --- | --- | --- | --- | --- |
| Scoped log tail | `ScopedLogPanel` (deprecated per its own README, 5 consumers) vs `DevtoolLogsTab` | LogsTab absorbs Panel | Panel's table layout w/ sticky header if operator wants it; else repoint 5 consumers + delete after verify | RULED (repo documents the deprecation) — final HOME of LogsTab is OPEN-B |

### 2.2 Capability matrices — all merged

See §2.3 (bytes), §2.4 (escape/modals), §2.5 (status vocab), §2.6 (utils dedup).

### 2.6 design/utils dedup + dead-export census — GAP-C MERGED [opus: importer breakdown]

**All 265 refs / 240 files reconcile exactly.** Every consumer uses direct
`$lib/design/utils/<path>` imports — **the barrel `utils/index.ts` has ZERO
importers** (23 re-exports nobody consumes through it).

| Export | Consumers | Dedup consequence |
| --- | --- | --- |
| `cn` | **228 files** (216 external + 12 utils-internal) | the load-bearing giant; any move = 228-file repoint |
| `stack` | 18 | live |
| `hstack` | 12 | live |
| `gridLayout` | 3 · `box` 2 · `container` 1 | live |
| `idGen` | **1** (`blocks/factory.ts:11`, uses `idGen("blk")`/`idGen("doc")`) | id-gen dedup = ONE repoint to the uid SSOT |
| `ariaAnnounce` | **0** | live-region dedup = absorb-verify then DELETE, **zero repoints** |
| `idGenPair`, `slotMerge`, `tokenResolve`, `center`, `flex`, `clampValue`, `clampFluid`, `FLUID_SPACE/SIZE/PADDING`, `useAspectRatio`, `useDivider`, `useSpacer`, `useSticky`, `useVisuallyHidden` | **0 each — 16 of 23 exports dead** | fate = operator call (deferred ≠ retired): **OPEN Q-UTILS-DEAD** |

Notable: the five `use*` layout hooks and the entire FLUID_* fluid-clamp system
(authored for container-fluid sizing) currently have no consumer. No devtools-tier
consumer of anything in design/utils exists.

### 2.5 Status/health vocabularies — GAP-E MERGED [opus: 4-vocabulary census]

**The four unions (exact, verbatim):**

| Vocab | Definition | Union | Consumers |
| --- | --- | --- | --- |
| V1 `HealthState`/`HealthBadge` | `devtools/_shared/types.ts:21` | starting·up·degraded·down·stopped·unknown | ~26 devtools build `HealthBadge` inline → `ServiceDevtoolShell` header dot; **mirrored in Rust bindings** (`DevforgeHealthState` bindings.ts:6228, `OllamaHealthState` :9006) |
| V2 `HealthState` (local) | `datastores/_shared/HealthSignal.svelte:26` | up·starting·degraded·down·unknown (no stopped) | **copy-pasted VERBATIM into 8 files** (StoreHeroCard:38, 3 Hero cards, 3 devtools as `StoreHealth`) |
| V3 `SubsystemTone` | `blocks/devtools/SubsystemTile.svelte:62` | identical membership to V1 | SubsystemTile + LiveSubsystemStrip (all 6 tones emitted) |
| V4 `StatusDotStatus` | `components/status-dot/status-dot.types.ts:11` | online·offline·loading·ready·failed·pending·hybrid | SubsystemTile, ReasoningTopology, StatusRow, StatePanel, TelemetryDevtool, PersonaGraphDevtool |

**Name collision (unrelated):** `sys/runes/platformState.svelte.ts:28` also exports
`SubsystemState` (boot-init pending·loading·ready·skipped·failed) — different concern.

**Adapters found (7+):** toneToDotState (SubsystemTile:158), nodeStatusDot
(ReasoningTopology:117), TONE_TO_STATUS (StatusRow:14), stateDotTone (StatePanel:65),
heroState ×3 (per-store devtools), stateToVariant + mapInitStatus (boot), plus ~26
inline HealthBadge builders. **No shared converter exists.**

**Visual disagreement (fact, renders wrong today):** "degraded" is AMBER via the
shell path (`healthDotColor` → `--signal-warning`, ServiceDevtoolShell:285) but
GRAY via the tile path (degraded→`pending`→`--text-muted`, SubsystemTile:158 +
StatusDot STATUS_COLOR). Same system state, two colors on screen.

**Token-alignment finding (joins Section 3):** StatusDot has DTCG tokens
(`status-dot/tokens.ts:25-59`: teal-400/purple-400/red-500/neutral-500) that the
component **ignores** — `StatusDot.svelte:28-36` hardcodes `--signal-*` vars instead.

**StatusDot capability gaps vs HealthSignal (absorb list if unified):** latency
readout (µs/ms/s), state-DERIVED animation (breathing on up, fast-pulse on
starting/degraded), `prefers-reduced-motion` handling, text label,
`aria-label` announcement (StatusDot is `aria-hidden`). Reverse: StatusDot has
`glow` + `size` props HealthSignal lacks. Unification target = **OPEN question
Q-STATUS** (operator names the canonical union + rules the degraded-color truth).

### 2.4 Escape / modal-overlay classification — GAP-B MERGED [opus: 14-site census]

**OVERLAY-DUP — 9 sites** (hand-roll Escape for a dialog/menu/popover surface; no
shared top-of-stack arbitration → nesting breaks):

| Site | Surface | Facilities present | Facilities MISSING | z |
| --- | --- | --- | --- | --- |
| `components/date-picker/DatePickerContent.svelte:19` | role=dialog aria-modal | Escape only | trap + scroll lock + outside-click (verified absent across the kind) | via class |
| `components/date-range-picker/DateRangePickerContent.svelte:16` | role=dialog (non-inline) | Escape only — **inline mode silently drops Escape** | trap + lock + outside-click | via class |
| `components/menubar/MenubarContent.svelte:36` | role=menu | Escape only | trap + lock + outside-click | z-50 |
| `components/navigation-menu/NavigationMenuContent.svelte:26` | submenu | Escape only | trap + lock + outside-click | via class |
| `components/navigation-menu/NavigationMenuTrigger.svelte:32` | trigger half of ↑ | Escape only | (facilities belong to Content) | — |
| `devtools/.../rrd/feature/SwapDialog.svelte:166` | role=dialog aria-modal + scrim | Escape (guarded by !inFlight) | trap + lock + outside-click | z-[90] |
| `devtools/.../slots/feature/SlotsDevtool.svelte:948` | picker, role=dialog | Escape + outside-click | trap + lock | 1000 |
| `devtools/_shared/HfSearchDialog.svelte:88` | role=dialog aria-modal + scrim | Escape only | trap + lock + outside-click | z-[90] |
| `domains/app/models/.../ModelDownloaderOverlay.svelte:129` | role=dialog aria-modal | Escape + **real trap** + outside-click | scroll lock (overflow:hidden is on the card, not body) | 9000/8999 |

**WIDGET-INTERNAL — 5 sites** (APG assigns Escape to the widget; non-modal; correct
to keep OUT of the escape stack): tooltip `use-tooltip.svelte.ts:68`,
`SubsystemTile.svelte:184` (hover card, z-70), `KnowledgeTerm.svelte:106` (glossary
tooltip, z 9200), `ChatComposer.svelte:53` (autocomplete clear), `TopBar.svelte:48`
(inline search close).

**Uncoordinated z-scale across overlays (fact):** 50, 70, 90, 1000, 8999, 9000, 9200 —
no shared token; utils/sticky consumes `--z-index-*` tokens but overlays don't.
SwapPrimaryBrainButton overlay (z-[100], census §2.9) is a 10th overlay surface not
in the Escape list (no Escape handler at all — it's a blocking progress scrim,
role=alertdialog).

### 2.3 Byte/size formatting — GAP-A matrix MERGED [opus: formatBytes census]

Cluster is larger than the census saw: **8× `formatBytes` + 2× `formatMb` + 2× `formatSizeHint` = 12 helpers.**
All divide by 1024; none use base-1000. Definitions:

| # | Definition | Input | Labels | Tiers/precision | Scope | Real consumers |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | rrd `SwapDialog.svelte:74` | number | KiB/MiB/GiB | GiB .toFixed(2) / MiB .1 / KiB .0 — **no B tier** | local | 2 in-file (:117, :282) |
| 2 | rro `rro.format.ts:80` | number\|bigint (coerces) | B/KB/MB/GB | KB .1 / MB .1 / GB .2 | exported + barrel `rro/index.ts:43` | **NONE — dead export** |
| 3 | `DevforgeDevtool.svelte:33` | number | KB/MB/GB | GB .2 / MB .1 / KB .0 — no B tier | local | 1 in-file (:143) |
| 4 | `resolve-primary-file.ts:118` | number | B/KB/MB/GB | **KB .toFixed(0)** / MB .1 / GB .2 | exported + `devtools/index.ts:24` | in-file :66,:77 + RepoDownloadButton :304,:320,:333 (direct path, not barrel) |
| 5 | `ServiceDevtoolShell.svelte:246` | number | B/KiB/MiB | KiB .1 / MiB .1 — **no GiB tier** | local | 5 in-file (:370–:393) |
| 6 | `DevForgeDashboard.svelte:113` | number\|**null** ("—") | KB/MB/GB | GB .2 / MB .1 / KB .0 — no B tier | local | 1 in-file (:220) |
| 7 | models `util/format.ts:31` | number | B/KB/MB/GB | KB .1 / MB .1 / GB .2 | exported + `models/index.ts:79` | BundleFileRow:42; DownloaderConfirmPanel imports but **voids** it (:103) |
| 8 | telemetry `telemetry.types.ts:63` | number | B/KB/MB/GB | **byte-identical to #7** | exported + `telemetry/index.ts:53` | TelemetryDevtool :256, :333 |

Adjacent helpers found by the wider sweep:

| Helper | Where | Fact |
| --- | --- | --- |
| `formatMb(mb)` | models `util/format.ts:20` (exported) | MB-input; 11 consumer sites (StatusBar, VramBar, models page, SlotsDevtool, InstallingView, HardwareView, DownloaderConfirmPanel) |
| `formatMb(bytes)` | `sys/activity-hud/DownloadPanel.svelte:45` | **takes BYTES despite the name** — mislabeled unit, single-tier MB |
| `formatSizeHint(mb)` ×2 | `SetupWizardOverlay.svelte:234` and `slots-bootstrap.state.svelte.ts:336` | duplicated MB-input hint formatter |

**SSOT absorb requirements (whichever home the operator names):** B tier (#2/4/7/8),
GiB tier (#1), null→"—" (#6), bigint coercion (#2), one precision table, one unit
vocabulary — binary labels (KiB/MiB, matching the 1024 math) vs decimal labels
(KB/MB, current majority) is **OPEN question Q-BYTES** for the operator.
Repoint sites: all consumers listed above; delete-after-verify: #2 (dead) first.

## Section 3 — Token-alignment fix list — GAP-D MERGED (all 73 classified)

Full 73-row table with per-var evidence: agent output preserved in the audit JSON
(`scratchpad/cssvars.json`) and summarized here. Classes: 2 TYPO/TRUNCATED (scanner
artifacts), **36 WRONG-NAME**, 2 RUNTIME-SCOPED false positives
(`--accent-service-{main,fill}` via `serviceAccentStyle()`), **33 GENUINELY-MISSING**.

### 3.1 RULED — mechanical rebinds (WRONG-NAME: consumer → verified existing token)

Every row verified against the emitted set; fix = rebind the consumer line:

| Wrong name (consumers) | Existing token (evidence) |
| --- | --- |
| `--accent-positive-main` (KnowledgeCard, IntelligenceMemoryStream, Sidebar) | `--accent-success-main` (accent.css:54) |
| `--accent-primary` bare (SuggestionDropdown:69) | `--accent-primary-main` (accent.css:45) |
| `--accent-purple` bare (SurrealdbDevtool:311) | `--accent-purple-main` (accent.css:64) |
| `--accent-red-main` (BootOverlay:214) | `--accent-danger-main` (accent.css:51) |
| `--accent-warning` (ProjectReferences:214) | `--accent-warning-main` (accent.css:57) |
| `--duration-md` (Frame:71,80) | `--duration-normal` (motion.css:8) |
| `--ease-out` ×3 (Glass*) | `--easing-ease-out` (motion.css:14) |
| `--font-family-mono` ×7 / `--font-family-sans` (ErrorOverlay) | `--font-mono` / `--font-sans` (typography.css:18-19) |
| `--purple-500/600`, `--teal-400/600` (Glass*) | `--color-purple-*` / `--color-teal-*` (color.css) |
| `--shadow-z1..z4` (Panel.stories) | `--depth-z1..z4` (shadow.css:7-10) |
| `--signal-error-{fill,main,subtle}`, `--signal-warn(-subtle)` | `--signal-error` / `--signal-warning` (signal.css:7-8) |
| `--surface-elevated` ×2 / `--surface-glass-deep` ×3 / `--surface-muted` / `--surface-void` | `--surface-raised` / `--glass-deep` / `--surface-subtle` / `--surface-base` (surface.css) |
| `--text-base/sm/lg` (Glass*) | `--font-size-base/sm/lg` (typography.css) |
| `--text-default` ×4 / `--text-error` / `--text-on-accent` / `--text-tertiary` | `--text-primary` / `--signal-error` / `--accent-fg` / `--text-muted` |

### 3.2 RULED — generator/source bugs (fix in the GENERATOR/SD5 source)

| Bug | Fix location |
| --- | --- |
| `svg-presets.generated.css` emits `--cl-svg-accent-{main,glow,fill}` but the pipeline defines `--svg-accent-*` — **prefix mismatch in generated output; SVG presets resolve to nothing** | the svg preset GENERATOR (scripts/build svg pipeline), then regen |
| 12 raw oklch literals in retro/stark preset families (ΔE 6–13) | `tokens/src/presets/*.tokens.json` — rebind per-literal (slice detail) |
| 1 keyword fallback (ClyffyHeadshot:162) | consumer fix (rule 6) |
| StatusDot ignores its own DTCG tokens (§2.5) | reconcile component ↔ `status-dot/tokens.ts` (direction = Q-STATUS) |

### 3.3 GENUINELY-MISSING (33) — operator rules author-vs-retire (Section 4 questions)

| Cluster | Vars | Facts |
| --- | --- | --- |
| ui-demo Glass* private vocabulary | `--bevel-raised(-deep)`, `--border-rise-{soft,subtle}`, `--glass-{deep,frost,light,standard}-blur`, `--gradient-bg-{1,2}`, `--shadow-purple-{2,3}` (13) | demo-only components authored against tokens that never existed → Q-GLASS |
| RenderForge glue gap | `--gap` (NO fallback), `--z`, `--focus-ring`, `--focus-offset`, `--hover-filter`, `--active-filter` | render-base.css consumes them; `var-to-family.ts` registers NO axis vars for interactive/layout families; render.ts emits only the other 20 → Q-RENDERFORGE |
| Scrollbar size tokens | `--scrollbar-size-{width,height,radius}` (app.css:197-205, no fallbacks) | scrollbar.css defines only thumb colors → author in SD5 source or restyle |
| No z-index scale | `--z-dropdown` (Sidebar:172) + raw literals 50/70/90/100/1000/8999/9000/9200 across overlays | no z token scale exists anywhere → Q-Z |
| Surface interaction states | `--surface-hover`, `--surface-pressed`, `--surface-1/2` | nearest existing: `--interaction-hover/active` (interaction.css:6-7) |
| DynamicBackground override hooks | `--dynamic-background-{overlay-blend,overlay-opacity,video-blend}` | local override hooks with fallbacks; no variant sets them |
| Comment/doc artifacts | `--foo`, `--shadow-{bevel,depth,frame}` (stories comments), `--font-weight-semibold` | scanner-visible, not render-breaking |

765 CONTESTED / 2931 DEAD: recorded; interpretation needs the resolver-aware pass — not a Phase-2 blocker.

## Section 4 — OPEN questions for the operator

Answer inline (circle/edit an option or write your own name). A/B/C reference the
researched options in §1.3/§1.4. "NAME:" means only you can name the boundary.

### 4.1 Structure — design tier

**Q1.** Nine behavior primitives → **A** `behaviors/interaction/{name}/` (repo-doc precedent, 30 lines) | **B** `behaviors/{name}/` top-level (locale/filter precedent) | **C** split by concern (sideways-import risk): ______

**Q2.** `kbd.ts` → **A** into `interaction/keyboard-handler/` | **B** split: constants→keyboard-handler, RTL dir→`locale/` (retires the duplicate Direction type) | **C** own leaf: ______

**Q3.** `uid.ts` (id-gen SSOT, absorbs idGen) → **A** `design/utils/idGen.ts` (bucket→bucket, flagged) | **B** NAME a folder: ______

**Q4.** `data-attr.ts` → **A** `components/_base/` (sideways dep) | **B** `design/utils/` (flagged) | **C** NAME a leaf: ______

**Q5.** `design/utils/` itself — bucket-named but structured+typed; cn = 228-file blast if moved. Keep as-is / rename to your name / dissolve: ______

**Q6.** `components/_base/` — underscore name, architectural content (49 imports). Keep / rename: ______

### 4.2 Structure — devtools + sys tier

**Q7.** Devtool chrome (shell/accents/types/README) + pure grids/tiles → **A** `design/blocks/devtools/` (exists, ~0 blast via barrel) | **B** NAME devtools-root folder: ______

**Q8.** Domain-coupled adapters (LogsTab, CommandErrorAlert, RefreshButton) → **A** NAME devtools-root concept folder (e.g. logs): ______ | **B** sys-side named home: ______

**Q9.** `LiveSubsystemStrip` → **A** NAME devtools dashboard folder: ______ | **B** colocate beside the dashboard route

**Q10.** Datastore quartet (StoreHeroCard + 3, all pure) → **A** `design/blocks/<NAME>/` (topic folder, you name it — e.g. datastores): ______ | **B** tier-local named folder: ______

**Q11.** `ReasoningTopology` → **A** split: pure topology → `design/blocks/devtools/` + thin rrdState binder stays reasoning-side (SubsystemTile pattern) | **B** fold into `rrd/ui/` (rro imports across): ______

**Q12.** HF-download cluster → **A** fold into `domains/app/models/feature/downloader/{ui,util}` (exists; state file already names HfSearchDialog; blast 2) | **B** NAME: ______

**Q13.** `voice-selection.state` → `sys/data-access/<NAME>` (precedent: rro/rrd live there): ______

**Q14.** `bindings/_shared` → **A** inline each type into its facade from generated bindings (facade convention; CommandError line ×4) | **B** NAME flat module `sys/bindings/<name>.ts`: ______

### 4.3 Vocabulary + SSOT

**Q15** (Q-BYTES)**.** One byte formatter absorbs all 8 (+formatMb/formatSizeHint facts §2.3). Unit labels: **binary** KiB/MiB/GiB (matches the 1024 math) | **decimal** KB/MB/GB (current majority). Home: ______ Labels: ______

**Q16** (Q-UTILS-DEAD)**.** The dead exports (§2.6 sixteen + active-descendant + SwapPrimaryBrainButton + FLUID_* fluid-clamp system): keep-deferred (marked, kept) | retire (delete after absorb-verify). Your call per item or wholesale: ______

**Q17** (Q-STATUS)**.** Canonical status vocabulary: keep 4 unions with one shared adapter | unify on ONE union (name it: ______). Render truth: degraded = amber everywhere (shell behavior) or gray (tile behavior)? ______ StatusDot absorbs HealthSignal capabilities (latency, state-derived animation, reduced-motion, label, aria)? ______

### 4.4 Tokens (all authored in SD5 sources if approved)

**Q18** (Q-GLASS)**.** ui-demo Glass* 13-var private vocabulary: author the tokens | retire/rewrite the Glass demo components on existing tokens: ______

**Q19** (Q-RENDERFORGE)**.** 6 never-emitted axis vars (`--gap` has NO fallback): register interactive/layout axis vars in var-to-family.ts + render.ts | strip the dead consumption from render-base glue: ______

**Q20** (Q-Z)**.** No z-index scale exists (raw 50–9200 across overlays; `--z-dropdown` undefined): author a z-scale in SD5 source (your names/values) | defer: ______

**Q21** (Q-SCROLLBAR)**.** `--scrollbar-size-{width,height,radius}` consumed by app.css, never defined: author in SD5 | restyle app.css on existing tokens: ______

**Q22** (Q-MODALS)**.** The 9 OVERLAY-DUP sites (§2.4): unify all on the behavior primitives (escape-layer/focus-trap/scroll-lock/dismiss-layer) | triage per-site: ______

## Section 5 — Approval

APPROVED BY OPERATOR: 2026-07-12 — explicit answers for Q1–Q9/Q12 in the operator's
message, two structural corrections stated (below), remainder explicitly delegated
("JUST PICK").

### Operator structural corrections (LOCKED — override any option text above)

1. **`design/blocks` = LIBRARY/CORE components + their variants ONLY, all pulling
   from `styles/`.** No devtool templates, no devtool-specific anything in blocks.
2. **Actual devtools live in `devtools/{tier}/{bucket}/{id}` with their components
   COLOCATED inside that devtool's folders.** Shared devtool TEMPLATES centralize
   devtools-side (root-level named template homes), never in the design library.
3. **Devtool actions emit clear structured signals.** The logs surface consumes
   emitted tracing events (`devtools.{id}` targets, typed lifecycle events — the
   existing scoped-log architecture, enforced 1:1), not ad-hoc plumbing. Every
   slice touching devtool actions verifies the action emits its signal.

### Recorded answers

| Q | Ruling |
| --- | --- |
| Q1 | **A** — `behaviors/interaction/{name}/` ×9 |
| Q2 | **B** — kbd splits: constants → `interaction/keyboard-handler/`, RTL dir helpers → `locale/` (retires duplicate `Direction`) |
| Q3 | **A** — uid SSOT at `design/utils/` as named module, absorbs idGen |
| Q4 | **A** — data-attr → `components/_base/` |
| Q5 | **keep** — `design/utils/` stays this phase (cn blast) |
| Q6 | **keep** — `components/_base/` name stays |
| Q7 | corrected — shell TEMPLATE + bento grid/tile → `devtools/shell/`; `serviceAccents.ts` + `types.ts` + README stay devtools-root beside `registry.ts`/`meta.ts` (named-flat-file precedent). **NOT design/blocks** |
| Q8 | **A** — `devtools/logs/` (LogsTab + CommandErrorAlert + RefreshButton) + correction 3 (signals) applies |
| Q9 | **A** — `devtools/dashboard/` (LiveSubsystemStrip) |
| Q10 | corrected — datastore quartet stays devtools-side: `devtools/system/datastores/store-hero/` (StoreHeroCard entry + colocated parts; researched option B-Opt2). **NOT blocks** |
| Q11 | **B** (consistent w/ corrections) — ReasoningTopology folds into `rrd/ui/`, rro imports across |
| Q12 | **A** — HF cluster → `domains/app/models/feature/downloader/{ui,util}` |
| Q13 | delegated → `sys/data-access/voice/` |
| Q14 | delegated → **A** inline into facades; drop dead `Result` |
| Q15 | delegated → SSOT `models/util/format.ts`, decimal KB/MB/GB labels (Windows convention); fix mislabeled `formatMb(bytes)` same slice |
| Q16 | delegated → retire all dead exports EXCEPT keep-deferred `FLUID_*` (container-fluid directive) + `active-descendant` (Q22 will consume it) |
| Q17 | delegated → unify on 6-state `HealthState` (Rust-mirrored); degraded = AMBER everywhere; StatusDot absorbs HealthSignal capabilities + honors its own DTCG tokens |
| Q18 | delegated → retire/rewrite Glass* demo components on existing tokens |
| Q19 | delegated → register interactive/layout axis vars in var-to-family.ts + render.ts |
| Q20 | delegated → author z-scale in SD5 source (base/dropdown/sticky/overlay/modal/toast) |
| Q21 | delegated → author `--scrollbar-size-*` tokens in SD5 |
| Q22 | delegated → unify the 9 OVERLAY-DUP sites on behavior primitives (design-tier pickers/menus first, then devtool dialogs) |

**Consistency flag carried into slices:** `SubsystemTile` currently lives in
`design/blocks/devtools/` — collides with correction 1; moves devtools-side in the
same slice family as Q7/Q10. Not silently left.

> This section is the operator's signature. Slices are authored only from these rows.
